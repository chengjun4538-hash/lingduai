package controller

import (
	"errors"
	"net/http/httptest"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/relay"
	"github.com/QuantumNous/new-api/relaykit/dto"
	"github.com/QuantumNous/new-api/relaykit/types"
	"github.com/QuantumNous/new-api/service"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGrsaiChannelModelDiscoveryAndTestEndpoint(t *testing.T) {
	channel := &model.Channel{Type: constant.ChannelTypeGrsai, BaseURL: common.GetPointer("")}
	apiType, ok := common.ChannelType2APIType(channel.Type)
	require.True(t, ok)
	adaptor := relay.GetAdaptor(apiType)
	require.NotNil(t, adaptor)
	assert.Contains(t, adaptor.GetModelList(), "nano-banana-2")
	assert.Contains(t, adaptor.GetModelList(), "minimax-h3")
	assert.Equal(t, "https://grsaiapi.com", channel.GetBaseURL())

	// 即使管理员使用自定义模型名，也只公布生图端点，后台测试不会误发聊天请求。
	assert.Equal(t, []constant.EndpointType{constant.EndpointTypeImageGeneration}, common.GetEndpointTypesByChannelType(channel.Type, "banana-alias"))
	endpoint := normalizeChannelTestEndpoint(channel, "banana-alias", "")
	assert.Equal(t, string(constant.EndpointTypeImageGeneration), endpoint)
	request := buildTestRequest("nano-banana-2", endpoint, channel, true)
	imageRequest, ok := request.(*dto.ImageRequest)
	require.True(t, ok)
	assert.Equal(t, "nano-banana-2", imageRequest.Model)
	assert.NotEmpty(t, imageRequest.Prompt)
	assert.Equal(t, uint(1), *imageRequest.N)
	assert.Nil(t, imageRequest.Stream)
}

func TestGrsaiVideoChannelTestUsesMappedEndpoint(t *testing.T) {
	channel := &model.Channel{Type: constant.ChannelTypeGrsai, ModelMapping: common.GetPointer(`{"video-alias":"minimax-h3"}`)}
	assert.Equal(t, string(constant.EndpointTypeOpenAIVideo), normalizeChannelTestEndpoint(channel, "video-alias", ""))
}

func TestTaskRelayHonorsSkipRetryForUpstreamSubmissionFailures(t *testing.T) {
	ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
	for _, status := range []int{429, 500, 502} {
		apiErr := types.NewErrorWithStatusCode(errors.New("已提交上游"), types.ErrorCodeDoRequestFailed, status, types.ErrOptionWithSkipRetry())
		taskErr := service.TaskErrorWrapper(apiErr, "do_request_failed", status)
		assert.False(t, shouldRetryTaskRelay(ctx, 1, taskErr, 3))
	}
}
