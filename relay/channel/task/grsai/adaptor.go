package grsai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	taskdto "github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/relay/channel"
	"github.com/QuantumNous/new-api/relay/channel/task/taskcommon"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/relaykit/dto"
	"github.com/QuantumNous/new-api/relaykit/types"
	"github.com/QuantumNous/new-api/service"
	"github.com/gin-gonic/gin"
)

type TaskAdaptor struct {
	taskcommon.BaseBilling
	request *videoRequest
}

func (a *TaskAdaptor) Init(_ *relaycommon.RelayInfo) {}

func (a *TaskAdaptor) ValidateRequestAndSetAction(c *gin.Context, info *relaycommon.RelayInfo) *taskdto.TaskError {
	if c.Request.URL.Path != "/v1/videos" && c.Request.URL.Path != "/v1/video/generations" {
		return service.TaskErrorWrapperLocal(fmt.Errorf("Grsai 视频只支持 /v1/videos 和 /v1/video/generations"), "invalid_request", http.StatusBadRequest)
	}
	if c.ContentType() != "application/json" {
		return service.TaskErrorWrapperLocal(fmt.Errorf("Grsai 视频需要 JSON 请求，参考素材请使用 URL 或 Base64"), "invalid_request", http.StatusBadRequest)
	}
	if len(info.ParamOverride) > 0 {
		return service.TaskErrorWrapperLocal(fmt.Errorf("Grsai 视频暂不支持渠道参数覆盖，请在请求中指定参数"), "invalid_request", http.StatusBadRequest)
	}
	var fields map[string]json.RawMessage
	if err := common.UnmarshalBodyReusable(c, &fields); err != nil {
		return service.TaskErrorWrapperLocal(err, "invalid_request", http.StatusBadRequest)
	}
	request, err := normalizeRequest(fields)
	if err != nil {
		return service.TaskErrorWrapperLocal(err, "invalid_request", http.StatusBadRequest)
	}
	a.request = request
	info.Action = constant.TaskActionTextGenerate
	if len(request.Images) > 0 || len(request.Audios) > 0 {
		info.Action = constant.TaskActionReferenceGenerate
	}
	c.Set("task_request", relaycommon.TaskSubmitReq{
		Model: request.Model, Prompt: request.Prompt, Images: request.Images,
		Duration: *request.Duration, Resolution: request.Resolution,
	})
	return nil
}

func (a *TaskAdaptor) BuildRequestURL(info *relaycommon.RelayInfo) (string, error) {
	baseURL := info.ChannelBaseUrl
	if baseURL == "" {
		baseURL = constant.ChannelBaseURLs[constant.ChannelTypeGrsai]
	}
	return strings.TrimRight(baseURL, "/") + "/v1/api/generate", nil
}

func (a *TaskAdaptor) BuildRequestHeader(_ *gin.Context, req *http.Request, info *relaycommon.RelayInfo) error {
	req.Header.Set("Authorization", "Bearer "+info.ApiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	return nil
}

func (a *TaskAdaptor) BuildRequestBody(_ *gin.Context, info *relaycommon.RelayInfo) (io.Reader, error) {
	request := *a.request
	request.Model = info.UpstreamModelName
	data, err := common.Marshal(request)
	if err != nil {
		return nil, err
	}
	return bytes.NewReader(data), nil
}

func (a *TaskAdaptor) DoRequest(c *gin.Context, info *relaycommon.RelayInfo, body io.Reader) (*http.Response, error) {
	resp, err := channel.DoTaskApiRequest(a, c, info, body)
	if err != nil {
		// 上游可能已创建任务，网络中断后重复提交会产生重复费用。
		return nil, types.NewErrorWithStatusCode(err, types.ErrorCodeDoRequestFailed, http.StatusBadGateway, types.ErrOptionWithSkipRetry())
	}
	if resp.StatusCode != http.StatusOK {
		apiErr := service.RelayErrorHandler(c.Request.Context(), resp, false)
		return nil, types.NewErrorWithStatusCode(apiErr, types.ErrorCodeBadResponseStatusCode, resp.StatusCode, types.ErrOptionWithSkipRetry())
	}
	return resp, nil
}

func (a *TaskAdaptor) DoResponse(c *gin.Context, resp *http.Response, info *relaycommon.RelayInfo) (string, []byte, *taskdto.TaskError) {
	defer service.CloseResponseBodyGracefully(resp)
	data, err := io.ReadAll(resp.Body)
	var result *relaycommon.TaskInfo
	if err == nil {
		result, err = a.ParseTaskResult(data)
	}
	status := http.StatusBadGateway
	if err == nil && result.Status == model.TaskStatusFailure {
		err = fmt.Errorf("%s", result.Reason)
		status = http.StatusBadRequest
	}
	if err != nil {
		apiErr := types.NewErrorWithStatusCode(err, types.ErrorCodeBadResponseBody, status, types.ErrOptionWithSkipRetry())
		return "", nil, service.TaskErrorWrapper(apiErr, "grsai_video_failed", status)
	}
	video := dto.NewOpenAIVideo()
	video.ID = info.PublicTaskID
	video.TaskID = info.PublicTaskID
	video.Model = info.OriginModelName
	video.CreatedAt = info.StartTime.Unix()
	c.JSON(http.StatusOK, video)
	return result.TaskID, data, nil
}

func (a *TaskAdaptor) FetchTask(baseURL, key string, body map[string]any, proxy string) (*http.Response, error) {
	return a.FetchTaskWithHeaderOverride(baseURL, key, body, proxy, nil)
}

func (a *TaskAdaptor) FetchTaskWithHeaderOverride(baseURL, key string, body map[string]any, proxy string, headers map[string]string) (*http.Response, error) {
	id, ok := body["task_id"].(string)
	if !ok || id == "" {
		return nil, fmt.Errorf("Grsai 视频任务 ID 不能为空")
	}
	if baseURL == "" {
		baseURL = constant.ChannelBaseURLs[constant.ChannelTypeGrsai]
	}
	req, err := http.NewRequest(http.MethodGet, strings.TrimRight(baseURL, "/")+"/v1/api/result?id="+url.QueryEscape(id), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+key)
	req.Header.Set("Accept", "application/json")
	for name, value := range headers {
		req.Header.Set(name, value)
		if strings.EqualFold(name, "Host") {
			req.Host = value
		}
	}
	client, err := service.GetHttpClientWithProxy(proxy)
	if err != nil {
		return nil, err
	}
	return client.Do(req)
}

func (a *TaskAdaptor) ParseTaskResult(data []byte) (*relaycommon.TaskInfo, error) {
	var response struct {
		ID       string `json:"id"`
		Status   string `json:"status"`
		Progress int    `json:"progress"`
		Error    string `json:"error"`
		Results  []struct {
			URL string `json:"url"`
		} `json:"results"`
	}
	if err := common.Unmarshal(data, &response); err != nil {
		return nil, err
	}
	if response.ID == "" {
		return nil, fmt.Errorf("Grsai 未返回视频任务 ID")
	}
	result := &relaycommon.TaskInfo{TaskID: response.ID}
	switch response.Status {
	case "running":
		result.Status = model.TaskStatusInProgress
		result.Progress = strconv.Itoa(max(0, min(99, response.Progress))) + "%"
	case "succeeded":
		if len(response.Results) != 1 {
			return nil, fmt.Errorf("Grsai 返回的视频结果数量无效")
		}
		parsed, err := url.Parse(response.Results[0].URL)
		if err != nil || parsed.Host == "" || (parsed.Scheme != "https" && parsed.Scheme != "http") {
			return nil, fmt.Errorf("Grsai 返回的视频 URL 无效")
		}
		result.Status = model.TaskStatusSuccess
		result.Progress = "100%"
		result.Url = response.Results[0].URL
	case "failed", "violation":
		result.Status = model.TaskStatusFailure
		result.Progress = "100%"
		result.Reason = response.Error
		if result.Reason == "" {
			result.Reason = "Grsai 视频任务" + response.Status
		}
	default:
		return nil, fmt.Errorf("Grsai 返回未知视频任务状态：%s", response.Status)
	}
	return result, nil
}

func (a *TaskAdaptor) ConvertToOpenAIVideo(task *model.Task) ([]byte, error) {
	video := task.ToOpenAIVideo()
	if task.Status == model.TaskStatusFailure {
		video.Error = &dto.OpenAIVideoError{Code: "grsai_video_failed", Message: task.FailReason}
		// 旧任务结构会把失败原因当作结果链接，失败响应不应暴露伪 URL。
		delete(video.Metadata, "url")
	}
	return common.Marshal(video)
}

func (a *TaskAdaptor) GetModelList() []string { return []string{"minimax-h3"} }
func (a *TaskAdaptor) GetChannelName() string { return "grsai-video" }
