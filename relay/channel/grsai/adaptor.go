package grsai

import (
	"bytes"
	"errors"
	"io"
	"net/http"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/relay/channel"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	relayconstant "github.com/QuantumNous/new-api/relay/constant"
	"github.com/QuantumNous/new-api/relaykit/dto"
	"github.com/QuantumNous/new-api/relaykit/types"
	"github.com/QuantumNous/new-api/service"
	"github.com/gin-gonic/gin"
)

type Adaptor struct {
	imageSize string
}

func (a *Adaptor) Init(_ *relaycommon.RelayInfo) {}

func (a *Adaptor) GetRequestURL(info *relaycommon.RelayInfo) (string, error) {
	if info.RelayMode != relayconstant.RelayModeImagesGenerations {
		return "", invalidRequest("Grsai 渠道只支持 /v1/images/generations")
	}
	baseURL := info.ChannelBaseUrl
	if baseURL == "" {
		baseURL = constant.ChannelBaseURLs[constant.ChannelTypeGrsai]
	}
	return strings.TrimRight(baseURL, "/") + "/v1/api/generate", nil
}

func (a *Adaptor) SetupRequestHeader(c *gin.Context, header *http.Header, info *relaycommon.RelayInfo) error {
	channel.SetupApiRequestHeader(info, c, header)
	header.Set("Authorization", "Bearer "+info.ApiKey)
	header.Set("Content-Type", "application/json")
	header.Set("Accept", "application/json")
	return nil
}

func (a *Adaptor) ConvertImageRequest(_ *gin.Context, info *relaycommon.RelayInfo, request dto.ImageRequest) (any, error) {
	if info.RelayMode != relayconstant.RelayModeImagesGenerations {
		return nil, invalidRequest("Grsai 渠道只支持 /v1/images/generations，参考图请通过 images 传入")
	}
	converted, err := convertImageRequest(request)
	if err != nil {
		return nil, invalidRequest(err.Error())
	}
	// 重试可能切换到此渠道，不能让此前预扣的分辨率与实际生成档位不一致。
	if info.PriceData.ImageResolution != "" && !strings.EqualFold(info.PriceData.ImageResolution, converted.ImageSize) {
		return nil, invalidRequest("Grsai 生图分辨率与预扣费档位不一致，请使用 size 指定分辨率")
	}
	a.imageSize = converted.ImageSize
	return converted, nil
}

func (a *Adaptor) DoRequest(c *gin.Context, info *relaycommon.RelayInfo, body io.Reader) (any, error) {
	if a.imageSize == "" {
		return nil, invalidRequest("Grsai 渠道需要转换请求，请关闭请求体透传")
	}
	if !info.PriceData.UsePrice {
		return nil, invalidRequest("Grsai 生图不返回 token 用量，请配置按次或分辨率价格")
	}
	// 参数覆盖发生在转换之后；再次校验并仅发送已支持的字段，防止绕过数量、
	// 同步模式和分辨率约束，导致上游已创建任务而本地按错误规则结算。
	var request dto.ImageRequest
	if err := common.DecodeJson(body, &request); err != nil {
		return nil, invalidRequest("Grsai 生图请求不是有效 JSON")
	}
	converted, err := convertImageRequest(request)
	if err != nil {
		return nil, invalidRequest(err.Error())
	}
	if converted.ImageSize != a.imageSize {
		return nil, invalidRequest("Grsai 参数覆盖不能改变已计费的分辨率，请在请求 size 中指定")
	}
	data, err := common.Marshal(converted)
	if err != nil {
		return nil, err
	}
	resp, err := channel.DoApiRequest(a, c, info, bytes.NewReader(data))
	if err != nil {
		// 生图提交不具备幂等保证；连接中断也可能已经创建任务，不能自动重复提交。
		return nil, types.NewOpenAIError(err, types.ErrorCodeDoRequestFailed, http.StatusBadGateway, types.ErrOptionWithSkipRetry())
	}
	if resp.StatusCode != http.StatusOK {
		apiErr := service.RelayErrorHandler(c.Request.Context(), resp, false)
		return nil, types.NewError(apiErr, types.ErrorCodeBadResponseStatusCode, types.ErrOptionWithSkipRetry())
	}
	return resp, nil
}

func (a *Adaptor) DoResponse(c *gin.Context, resp *http.Response, info *relaycommon.RelayInfo) (any, *types.NewAPIError) {
	return imageResponse(c, resp, info)
}

func (a *Adaptor) GetModelList() []string {
	return []string{
		"nano-banana", "nano-banana-fast", "nano-banana-2", "nano-banana-2-cl",
		"nano-banana-2-2k-cl", "nano-banana-2-4k-cl", "nano-banana-2.1",
		"nano-banana-pro", "nano-banana-pro-vt", "nano-banana-pro-cl",
		"nano-banana-pro-vip", "nano-banana-pro-4k-vip",
	}
}

func (a *Adaptor) GetChannelName() string { return "Grsai" }

func invalidRequest(message string) *types.NewAPIError {
	return types.NewErrorWithStatusCode(errors.New(message), types.ErrorCodeInvalidRequest, http.StatusBadRequest, types.ErrOptionWithSkipRetry())
}

func (a *Adaptor) ConvertOpenAIRequest(*gin.Context, *relaycommon.RelayInfo, *dto.GeneralOpenAIRequest) (any, error) {
	return nil, invalidRequest("Grsai 渠道只支持生图请求")
}

func (a *Adaptor) ConvertClaudeRequest(*gin.Context, *relaycommon.RelayInfo, *dto.ClaudeRequest) (any, error) {
	return nil, invalidRequest("Grsai 渠道只支持生图请求")
}

func (a *Adaptor) ConvertGeminiRequest(*gin.Context, *relaycommon.RelayInfo, *dto.GeminiChatRequest) (any, error) {
	return nil, invalidRequest("Grsai 渠道只支持生图请求")
}

func (a *Adaptor) ConvertOpenAIResponsesRequest(*gin.Context, *relaycommon.RelayInfo, dto.OpenAIResponsesRequest) (any, error) {
	return nil, invalidRequest("Grsai 渠道只支持生图请求")
}

func (a *Adaptor) ConvertRerankRequest(*gin.Context, int, dto.RerankRequest) (any, error) {
	return nil, invalidRequest("Grsai 渠道只支持生图请求")
}

func (a *Adaptor) ConvertEmbeddingRequest(*gin.Context, *relaycommon.RelayInfo, dto.EmbeddingRequest) (any, error) {
	return nil, invalidRequest("Grsai 渠道只支持生图请求")
}

func (a *Adaptor) ConvertAudioRequest(*gin.Context, *relaycommon.RelayInfo, dto.AudioRequest) (io.Reader, error) {
	return nil, invalidRequest("Grsai 渠道只支持生图请求")
}
