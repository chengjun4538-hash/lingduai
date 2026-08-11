package relay

import (
	"context"
	"errors"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/relay/channel"
	"github.com/QuantumNous/new-api/relay/channel/task/taskcommon"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/service"
	"github.com/gin-gonic/gin"
)

func RelayViduTaskFetch(c *gin.Context) *dto.TaskError {
	taskID := c.Param("task_id")
	userID := c.GetInt("id")
	originTask, exists, err := model.GetByTaskId(userID, taskID)
	if err != nil {
		return service.TaskErrorWrapper(err, "get_task_failed", http.StatusInternalServerError)
	}
	if !exists {
		return service.TaskErrorWrapperLocal(errors.New("task_not_exist"), "task_not_exist", http.StatusBadRequest)
	}

	channelModel, err := model.GetChannelById(originTask.ChannelId, true)
	if err != nil {
		return service.TaskErrorWrapper(err, "get_channel_failed", http.StatusInternalServerError)
	}
	if channelModel.Type != constant.ChannelTypeVidu {
		return service.TaskErrorWrapperLocal(errors.New("task channel is not vidu"), "invalid_task_channel", http.StatusBadRequest)
	}

	baseURL := constant.ChannelBaseURLs[channelModel.Type]
	if channelModel.GetBaseURL() != "" {
		baseURL = channelModel.GetBaseURL()
	}
	apiKey := channelModel.Key
	if originTask.PrivateData.Key != "" {
		apiKey = originTask.PrivateData.Key
	}
	adaptor := GetTaskAdaptor(constant.TaskPlatform(strconv.Itoa(channelModel.Type)))
	if adaptor == nil {
		return service.TaskErrorWrapperLocal(errors.New("vidu adaptor not found"), "invalid_api_platform", http.StatusBadRequest)
	}

	fetchBody := map[string]any{
		"task_id": originTask.GetUpstreamTaskID(),
		"action":  originTask.Action,
	}
	proxy := channelModel.GetSetting().Proxy
	var response *http.Response
	if headerFetcher, ok := adaptor.(channel.TaskHeaderOverrideFetcher); ok {
		headerOverride, resolveErr := channel.ResolveHeaderOverride(&relaycommon.RelayInfo{
			ChannelMeta: &relaycommon.ChannelMeta{
				ApiKey:          apiKey,
				HeadersOverride: channelModel.GetHeaderOverride(),
			},
		}, c)
		if resolveErr != nil {
			return service.TaskErrorWrapper(resolveErr, "channel_header_override_invalid", http.StatusBadRequest)
		}
		response, err = headerFetcher.FetchTaskWithHeaderOverride(baseURL, apiKey, fetchBody, proxy, headerOverride)
	} else {
		response, err = adaptor.FetchTask(baseURL, apiKey, fetchBody, proxy)
	}
	if err != nil {
		return service.TaskErrorWrapper(err, "fetch_task_failed", http.StatusBadGateway)
	}
	if response == nil {
		return service.TaskErrorWrapperLocal(errors.New("empty upstream response"), "fetch_task_failed", http.StatusBadGateway)
	}
	defer response.Body.Close()

	body, err := io.ReadAll(response.Body)
	if err != nil {
		return service.TaskErrorWrapper(err, "read_response_body_failed", http.StatusInternalServerError)
	}
	contentType := response.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/json"
	}

	if response.StatusCode >= http.StatusOK && response.StatusCode < http.StatusBadRequest {
		if taskResult, parseErr := adaptor.ParseTaskResult(body); parseErr == nil && taskResult != nil {
			updateViduTaskFromFetch(c.Request.Context(), adaptor, originTask, taskResult, body)
		}
	}

	c.Data(response.StatusCode, contentType, body)
	return nil
}

func updateViduTaskFromFetch(ctx context.Context, adaptor channel.TaskAdaptor, task *model.Task, taskResult *relaycommon.TaskInfo, body []byte) {
	snapshot := task.Snapshot()
	now := time.Now().Unix()

	if taskResult.Status != "" {
		task.Status = model.TaskStatus(taskResult.Status)
	}
	task.Data = body

	switch task.Status {
	case model.TaskStatusSubmitted:
		task.Progress = taskcommon.ProgressSubmitted
	case model.TaskStatusQueued:
		task.Progress = taskcommon.ProgressQueued
	case model.TaskStatusInProgress:
		task.Progress = taskcommon.ProgressInProgress
		if task.StartTime == 0 {
			task.StartTime = now
		}
	case model.TaskStatusSuccess:
		task.Progress = taskcommon.ProgressComplete
		if task.FinishTime == 0 {
			task.FinishTime = now
		}
		if taskResult.Url != "" {
			task.PrivateData.ResultURL = taskResult.Url
		} else {
			task.PrivateData.ResultURL = taskcommon.BuildProxyURL(task.TaskID)
		}
	case model.TaskStatusFailure:
		task.Progress = taskcommon.ProgressComplete
		if task.FinishTime == 0 {
			task.FinishTime = now
		}
		task.FailReason = taskResult.Reason
	default:
		return
	}
	if taskResult.Progress != "" {
		task.Progress = taskResult.Progress
	}

	isDone := task.Status == model.TaskStatusSuccess || task.Status == model.TaskStatusFailure
	if isDone && snapshot.Status != task.Status {
		won, updateErr := task.UpdateWithStatus(snapshot.Status)
		if updateErr != nil || !won {
			return
		}
		if task.Status == model.TaskStatusSuccess {
			if actualQuota := adaptor.AdjustBillingOnComplete(task, taskResult); actualQuota > 0 {
				service.RecalculateTaskQuota(ctx, task, actualQuota, "adaptor计费调整")
			} else if taskResult.TotalTokens > 0 {
				service.RecalculateTaskQuotaByTokens(ctx, task, taskResult.TotalTokens)
			}
			return
		}
		if task.Quota != 0 {
			service.RefundTaskQuota(ctx, task, task.FailReason)
		}
		return
	}
	if !snapshot.Equal(task.Snapshot()) {
		_, _ = task.UpdateWithStatus(snapshot.Status)
	}
}
