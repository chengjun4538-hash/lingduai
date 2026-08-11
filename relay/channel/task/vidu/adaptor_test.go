package vidu

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNativeViduVideoActionsAndDefaultDuration(t *testing.T) {
	tests := []struct {
		path   string
		action string
	}{
		{path: "/ent/v2/text2video", action: constant.TaskActionTextGenerate},
		{path: "/ent/v2/img2video", action: constant.TaskActionGenerate},
		{path: "/ent/v2/reference2video", action: constant.TaskActionReferenceGenerate},
		{path: "/ent/v2/start-end2video", action: constant.TaskActionFirstTailGenerate},
	}

	for _, test := range tests {
		t.Run(test.path, func(t *testing.T) {
			ctx := newNativeViduContext(test.path, `{"model":"viduq3","resolution":"720p"}`)
			info := &relaycommon.RelayInfo{}
			adaptor := &TaskAdaptor{baseURL: "https://vidu.example"}

			require.Nil(t, adaptor.ValidateRequestAndSetAction(ctx, info))
			assert.Equal(t, test.action, info.Action)
			request, err := relaycommon.GetTaskRequest(ctx)
			require.NoError(t, err)
			assert.Equal(t, defaultViduDuration, request.Duration)
			assert.Equal(t, "720p", request.Resolution)

			requestURL, err := adaptor.BuildRequestURL(info)
			require.NoError(t, err)
			assert.Equal(t, "https://vidu.example"+test.path, requestURL)
		})
	}
}

func TestNativeViduVideoPreservesObjectImagesAndRejectsOversizedDuration(t *testing.T) {
	ctx := newNativeViduContext(
		"/ent/v2/start-end2video",
		`{"model":"viduq3","images":[{"url":"https://example.com/a.png"},{"url":"https://example.com/b.png"}],"duration":3,"resolution":"720p"}`,
	)
	adaptor := &TaskAdaptor{}
	require.Nil(t, adaptor.ValidateRequestAndSetAction(ctx, &relaycommon.RelayInfo{}))

	ctx = newNativeViduContext(
		"/ent/v2/text2video",
		`{"model":"viduq3","duration":3601,"resolution":"720p"}`,
	)
	taskErr := adaptor.ValidateRequestAndSetAction(ctx, &relaycommon.RelayInfo{})
	require.NotNil(t, taskErr)
	assert.Equal(t, http.StatusBadRequest, taskErr.StatusCode)
}

func TestBuildNativeViduVideoBodyPreservesFields(t *testing.T) {
	ctx := newNativeViduContext(
		"/ent/v2/img2video",
		`{"model":"viduq3","images":["https://example.com/a.png"],"resolution":"540p","duration":0,"movement_amplitude":"auto","bgm":false}`,
	)
	info := &relaycommon.RelayInfo{ChannelMeta: &relaycommon.ChannelMeta{UpstreamModelName: "viduq3-upstream"}}

	bodyReader, err := (&TaskAdaptor{}).buildNativeViduVideoBody(ctx, info)
	require.NoError(t, err)
	body, err := io.ReadAll(bodyReader)
	require.NoError(t, err)
	var payload map[string]any
	require.NoError(t, common.Unmarshal(body, &payload))
	assert.Equal(t, float64(defaultViduDuration), payload["duration"])
	assert.Equal(t, "auto", payload["movement_amplitude"])
	assert.Equal(t, false, payload["bgm"])
	assert.Equal(t, "viduq3-upstream", payload["model"])
}

func TestNativeViduTaskIDAndHeaderOverrides(t *testing.T) {
	rewritten := rewriteNativeTaskID([]byte(`{"task_id":"upstream","state":"created"}`), "task_public")
	var payload map[string]any
	require.NoError(t, common.Unmarshal(rewritten, &payload))
	assert.Equal(t, "task_public", payload["task_id"])

	service.InitHttpClient()
	type capturedRequest struct {
		header http.Header
		path   string
	}
	requestCh := make(chan capturedRequest, 2)
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		requestCh <- capturedRequest{header: request.Header.Clone(), path: request.URL.Path}
		writer.Header().Set("Content-Type", "application/json")
		_, _ = writer.Write([]byte(`{"state":"success","creations":[]}`))
	}))
	defer server.Close()

	adaptor := &TaskAdaptor{}
	response, err := adaptor.FetchTaskWithHeaderOverride(
		server.URL,
		"sk-test",
		map[string]any{"task_id": "task_123"},
		"",
		map[string]string{"Authorization": "Bearer sk-test", "X-Upstream": "yunwu"},
	)
	require.NoError(t, err)
	require.NoError(t, response.Body.Close())
	fetched := <-requestCh
	assert.Equal(t, "/ent/v2/tasks/task_123/creations", fetched.path)
	assert.Equal(t, "Bearer sk-test", fetched.header.Get("Authorization"))

	ctx := newNativeViduContext("/ent/v2/reference2video", `{"model":"viduq3"}`)
	info := &relaycommon.RelayInfo{
		TaskRelayInfo: &relaycommon.TaskRelayInfo{Action: constant.TaskActionReferenceGenerate},
		ChannelMeta: &relaycommon.ChannelMeta{
			ChannelBaseUrl: server.URL,
			ApiKey:         "sk-test",
			HeadersOverride: map[string]any{
				"Authorization": "Bearer {api_key}",
				"X-Upstream":    "yunwu",
			},
		},
	}
	adaptor.Init(info)
	response, err = adaptor.DoRequest(ctx, info, strings.NewReader(`{"model":"viduq3"}`))
	require.NoError(t, err)
	require.NoError(t, response.Body.Close())
	submitted := <-requestCh
	assert.Equal(t, "Bearer sk-test", submitted.header.Get("Authorization"))
	assert.Equal(t, "yunwu", submitted.header.Get("X-Upstream"))
}

func TestAdjustBillingOnSubmitUsesUpstreamResolutionPrice(t *testing.T) {
	original := ratio_setting.ModelPrice2JSONString()
	t.Cleanup(func() {
		require.NoError(t, ratio_setting.UpdateModelPriceByJSONString(original))
	})
	prices := ratio_setting.GetModelPriceMap()
	prices[ratio_setting.ViduResolutionPriceKey("viduq3", "720p")] = 0.09
	data, err := common.Marshal(prices)
	require.NoError(t, err)
	require.NoError(t, ratio_setting.UpdateModelPriceByJSONString(string(data)))

	taskData, err := common.Marshal(responsePayload{Model: "viduq3", Duration: 5, Resolution: "720p"})
	require.NoError(t, err)
	ratios := (&TaskAdaptor{}).AdjustBillingOnSubmit(&relaycommon.RelayInfo{
		OriginModelName: "viduq3",
		ChannelMeta:     &relaycommon.ChannelMeta{UpstreamModelName: "viduq3"},
	}, taskData)
	assert.Equal(t, 5.0, ratios["duration"])
	assert.Equal(t, 0.09, ratios["vidu_unit_price"])
}

func newNativeViduContext(path string, body string) *gin.Context {
	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPost, path, strings.NewReader(body))
	ctx.Request.Header.Set("Content-Type", "application/json")
	return ctx
}
