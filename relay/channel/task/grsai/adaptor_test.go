package grsai

import (
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/model"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/relaykit/dto"
	"github.com/QuantumNous/new-api/relaykit/types"
	"github.com/QuantumNous/new-api/service"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func videoContext(body string) (*gin.Context, *httptest.ResponseRecorder, *relaycommon.RelayInfo) {
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/v1/videos", strings.NewReader(body))
	ctx.Request.Header.Set("Content-Type", "application/json")
	info := &relaycommon.RelayInfo{
		OriginModelName: "video-alias", StartTime: time.Unix(1700000000, 0),
		ChannelMeta:   &relaycommon.ChannelMeta{UpstreamModelName: "minimax-h3", ApiKey: "test-key"},
		TaskRelayInfo: &relaycommon.TaskRelayInfo{PublicTaskID: "task_public"},
	}
	return ctx, recorder, info
}

func TestVideoRequestPreservesMetadataAndExplicitZeroValues(t *testing.T) {
	ctx, _, info := videoContext(`{"model":"video-alias","prompt":"猫咪散步","seconds":"10","metadata":{"resolution":"1080p","aspect_ratio":"9:16","images":["https://example.com/cat.png"],"audios":["data:audio/mp3;base64,YQ=="],"seed":0,"promptSkill":false}}`)
	adaptor := &TaskAdaptor{}
	require.Nil(t, adaptor.ValidateRequestAndSetAction(ctx, info))
	assert.Equal(t, constant.TaskActionReferenceGenerate, info.Action)
	request, err := relaycommon.GetTaskRequest(ctx)
	require.NoError(t, err)
	assert.Equal(t, 10, request.Duration)
	assert.Equal(t, "1080p", request.Resolution)
	body, err := adaptor.BuildRequestBody(ctx, info)
	require.NoError(t, err)
	var payload map[string]any
	require.NoError(t, common.DecodeJson(body, &payload))
	assert.Equal(t, "minimax-h3", payload["model"])
	assert.Equal(t, "portrait", payload["aspectRatio"])
	assert.Equal(t, "async", payload["replyType"])
	assert.Equal(t, float64(0), payload["seed"])
	assert.Equal(t, false, payload["promptSkill"])
	assert.Equal(t, float64(10), payload["duration"])
	assert.Len(t, payload["images"], 1)
	assert.Len(t, payload["audios"], 1)
	assert.NotContains(t, payload, "metadata")
	assert.NotContains(t, payload, "seconds")
}

func TestVideoRequestDefaultsAndSingleReference(t *testing.T) {
	for _, reference := range []string{"", `,"input_reference":"https://example.com/a.png"`} {
		ctx, _, info := videoContext(`{"model":"minimax-h3","prompt":"日出"` + reference + `}`)
		ctx.Request.URL.Path = "/v1/video/generations"
		adaptor := &TaskAdaptor{}
		require.Nil(t, adaptor.ValidateRequestAndSetAction(ctx, info))
		body, err := adaptor.BuildRequestBody(ctx, info)
		require.NoError(t, err)
		var payload map[string]any
		require.NoError(t, common.DecodeJson(body, &payload))
		assert.Equal(t, float64(5), payload["duration"])
		assert.Equal(t, "480p", payload["resolution"])
		assert.Equal(t, "landscape", payload["aspectRatio"])
		assert.NotContains(t, payload, "seed")
		assert.NotContains(t, payload, "promptSkill")
		if reference != "" {
			assert.Equal(t, []any{"https://example.com/a.png"}, payload["images"])
		}
	}
}

func TestVideoRequestRejectsInvalidBillingAndProtocolInputs(t *testing.T) {
	for name, extra := range map[string]string{
		"零时长": `"duration":0`, "负时长": `"duration":-1`,
		"超长": `"duration":16`, "高清超长": `"resolution":"1080p","duration":11`,
		"溢出时长": `"duration":18446744073686646784`, "小数时长": `"duration":1.5`,
		"字符串时长": `"duration":"5"`, "seconds格式": `"seconds":"abc"`,
		"时长冲突":         `"duration":5,"seconds":"6"`,
		"metadata绕过时长": `"metadata":{"duration":9999999999}`,
		"metadata重复":   `"duration":5,"metadata":{"duration":6}`,
		"metadata覆盖模型": `"metadata":{"model":"other"}`,
		"metadata类型":   `"metadata":[]`, "metadata嵌套": `"metadata":{"parameters":{"duration":100}}`,
		"分辨率": `"resolution":"4k"`, "分辨率冲突": `"resolution":"480p","size":"1080p"`,
		"比例": `"aspect_ratio":"1:1"`, "流式": `"stream":true`, "同步": `"replyType":"json"`,
		"多视频": `"n":2`, "巨大数量": `"n":18446744073686646784`,
		"参考图冲突":  `"images":["a"],"image":"b"`,
		"参考图过多":  `"images":["a","b","c","d","e","f","g","h","i","j"]`,
		"参考音频过多": `"audios":["a","b","c","d"]`, "空素材": `"images":[""]`,
	} {
		t.Run(name, func(t *testing.T) {
			ctx, _, info := videoContext(`{"model":"minimax-h3","prompt":"日出",` + extra + `}`)
			taskErr := (&TaskAdaptor{}).ValidateRequestAndSetAction(ctx, info)
			require.NotNil(t, taskErr)
			assert.Equal(t, http.StatusBadRequest, taskErr.StatusCode)
			_, exists := ctx.Get("task_request")
			assert.False(t, exists)
		})
	}
	ctx, _, info := videoContext(`{"model":"minimax-h3","prompt":"日出"}`)
	info.ParamOverride = map[string]any{"duration": 20}
	require.NotNil(t, (&TaskAdaptor{}).ValidateRequestAndSetAction(ctx, info))
	info.ParamOverride = nil
	ctx.Request.Header.Set("Content-Type", "multipart/form-data")
	require.NotNil(t, (&TaskAdaptor{}).ValidateRequestAndSetAction(ctx, info))
}

func TestVideoSubmissionAndQueryUseGrsaiProtocol(t *testing.T) {
	service.InitHttpClient()
	type captured struct{ method, path, id, authorization, host, body string }
	requests := make(chan captured, 2)
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		requests <- captured{r.Method, r.URL.Path, r.URL.Query().Get("id"), r.Header.Get("Authorization"), r.Host, string(body)}
		w.Header().Set("Content-Type", "application/json")
		_, _ = io.WriteString(w, `{"id":"private+id/1","status":"running"}`)
	}))
	defer server.Close()
	ctx, recorder, info := videoContext(`{"model":"video-alias","prompt":"日出"}`)
	info.ChannelBaseUrl = server.URL
	adaptor := &TaskAdaptor{}
	require.Nil(t, adaptor.ValidateRequestAndSetAction(ctx, info))
	body, err := adaptor.BuildRequestBody(ctx, info)
	require.NoError(t, err)
	response, err := adaptor.DoRequest(ctx, info, body)
	require.NoError(t, err)
	id, data, taskErr := adaptor.DoResponse(ctx, response, info)
	require.Nil(t, taskErr)
	assert.Equal(t, "private+id/1", id)
	assert.Contains(t, string(data), "private+id/1")
	var video dto.OpenAIVideo
	require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &video))
	assert.Equal(t, "task_public", video.ID)
	assert.Equal(t, "video-alias", video.Model)
	assert.Equal(t, "queued", video.Status)
	assert.NotContains(t, recorder.Body.String(), "private+id/1")
	submitted := <-requests
	assert.Equal(t, http.MethodPost, submitted.method)
	assert.Equal(t, "/v1/api/generate", submitted.path)
	assert.Equal(t, "Bearer test-key", submitted.authorization)
	assert.Contains(t, submitted.body, `"replyType":"async"`)
	response, err = adaptor.FetchTaskWithHeaderOverride(server.URL, "query-key", map[string]any{"task_id": id}, "", map[string]string{"Host": "upstream.example"})
	require.NoError(t, err)
	require.NoError(t, response.Body.Close())
	queried := <-requests
	assert.Equal(t, http.MethodGet, queried.method)
	assert.Equal(t, "/v1/api/result", queried.path)
	assert.Equal(t, id, queried.id)
	assert.Equal(t, "Bearer query-key", queried.authorization)
	assert.Equal(t, "upstream.example", queried.host)
	assert.Empty(t, queried.body)
}

func TestVideoUpstreamFailuresNeverRetrySubmission(t *testing.T) {
	service.InitHttpClient()
	for _, status := range []int{400, 429, 500} {
		t.Run(fmt.Sprint(status), func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
				w.WriteHeader(status)
				_, _ = io.WriteString(w, `{"error":"生成失败"}`)
			}))
			defer server.Close()
			ctx, _, info := videoContext(`{}`)
			info.ChannelBaseUrl = server.URL
			_, err := (&TaskAdaptor{}).DoRequest(ctx, info, strings.NewReader(`{}`))
			require.Error(t, err)
			assert.True(t, types.IsSkipRetryError(err))
			var apiErr *types.NewAPIError
			require.ErrorAs(t, err, &apiErr)
			assert.Equal(t, status, apiErr.StatusCode)
		})
	}
	server := httptest.NewServer(http.NotFoundHandler())
	server.Close()
	ctx, _, info := videoContext(`{}`)
	info.ChannelBaseUrl = server.URL
	_, err := (&TaskAdaptor{}).DoRequest(ctx, info, strings.NewReader(`{}`))
	require.Error(t, err)
	assert.True(t, types.IsSkipRetryError(err))
	for _, body := range []string{`{}`, `{"id":"a","status":"failed","error":"拒绝"}`, `{"id":"a","status":"succeeded","results":[{"url":"data:video/mp4;base64,YQ=="}]}`} {
		ctx, recorder, info := videoContext(`{}`)
		response := &http.Response{Body: io.NopCloser(strings.NewReader(body))}
		_, _, taskErr := (&TaskAdaptor{}).DoResponse(ctx, response, info)
		require.NotNil(t, taskErr)
		assert.True(t, types.IsSkipRetryError(taskErr.Error))
		assert.Empty(t, recorder.Body.String())
	}
}

func TestVideoPollingStatesAndClientResponse(t *testing.T) {
	adaptor := &TaskAdaptor{}
	for _, tc := range []struct {
		body                  string
		status                model.TaskStatus
		progress, url, reason string
	}{
		{`{"id":"a","status":"running","progress":42}`, model.TaskStatusInProgress, "42%", "", ""},
		{`{"id":"a","status":"running","progress":100}`, model.TaskStatusInProgress, "99%", "", ""},
		{`{"id":"a","status":"succeeded","results":[{"url":"https://example.com/a.mp4"}]}`, model.TaskStatusSuccess, "100%", "https://example.com/a.mp4", ""},
		{`{"id":"a","status":"failed","error":"失败"}`, model.TaskStatusFailure, "100%", "", "失败"},
		{`{"id":"a","status":"violation","error":"违规"}`, model.TaskStatusFailure, "100%", "", "违规"},
	} {
		result, err := adaptor.ParseTaskResult([]byte(tc.body))
		require.NoError(t, err)
		assert.EqualValues(t, tc.status, result.Status)
		assert.Equal(t, tc.progress, result.Progress)
		assert.Equal(t, tc.url, result.Url)
		assert.Equal(t, tc.reason, result.Reason)
	}
	for _, body := range []string{`{}`, `{"id":"a","status":"unknown"}`, `{"id":"a","status":"succeeded","results":[]}`} {
		_, err := adaptor.ParseTaskResult([]byte(body))
		require.Error(t, err)
	}
	task := &model.Task{TaskID: "task_public", Status: model.TaskStatusFailure, FailReason: "上游拒绝生成", Progress: "100%"}
	data, err := adaptor.ConvertToOpenAIVideo(task)
	require.NoError(t, err)
	var video dto.OpenAIVideo
	require.NoError(t, common.Unmarshal(data, &video))
	assert.Equal(t, "failed", video.Status)
	require.NotNil(t, video.Error)
	assert.Equal(t, task.FailReason, video.Error.Message)
	assert.NotContains(t, video.Metadata, "url")
}
