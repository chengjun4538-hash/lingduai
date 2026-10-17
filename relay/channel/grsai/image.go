package grsai

import (
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"github.com/QuantumNous/new-api/common"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/relay/helper"
	"github.com/QuantumNous/new-api/relaykit/dto"
	"github.com/QuantumNous/new-api/relaykit/types"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
	"github.com/gin-gonic/gin"
)

type imageRequest struct {
	Model       string   `json:"model"`
	Prompt      string   `json:"prompt"`
	Images      []string `json:"images,omitempty"`
	AspectRatio string   `json:"aspectRatio"`
	ImageSize   string   `json:"imageSize"`
	ReplyType   string   `json:"replyType"`
}

func convertImageRequest(request dto.ImageRequest) (*imageRequest, error) {
	if err := helper.NormalizeGrsaiImageRequest(&request); err != nil {
		return nil, err
	}
	if request.Model != "nano-banana" && !strings.HasPrefix(request.Model, "nano-banana-") {
		return nil, fmt.Errorf("Grsai 生图只支持 Nano Banana 系列模型，请检查模型映射")
	}
	resolution, _, err := ratio_setting.ClassifyImageResolution(request.Size)
	if err != nil {
		return nil, err
	}
	converted := &imageRequest{
		Model: request.Model, Prompt: request.Prompt,
		ImageSize: strings.ToUpper(resolution), ReplyType: "json",
	}
	for _, field := range []string{"aspectRatio", "aspect_ratio"} {
		raw, ok := request.Extra[field]
		if !ok {
			continue
		}
		var value string
		if err := common.Unmarshal(raw, &value); err != nil || value == "" {
			return nil, fmt.Errorf("%s 必须为有效的图片比例", field)
		}
		if converted.AspectRatio != "" && converted.AspectRatio != value {
			return nil, fmt.Errorf("aspectRatio 与 aspect_ratio 冲突")
		}
		converted.AspectRatio = value
	}
	if converted.AspectRatio == "" {
		converted.AspectRatio = "auto"
		if parts := strings.Split(strings.ToLower(request.Size), "x"); len(parts) == 2 {
			// 尺寸已通过 ClassifyImageResolution 校验；约分只负责提取比例。
			width, _ := strconv.ParseInt(strings.TrimSpace(parts[0]), 10, 64)
			height, _ := strconv.ParseInt(strings.TrimSpace(parts[1]), 10, 64)
			a, b := width, height
			for b != 0 {
				a, b = b, a%b
			}
			converted.AspectRatio = fmt.Sprintf("%d:%d", width/a, height/a)
			switch strings.ToLower(request.Size) {
			case "1792x1024":
				converted.AspectRatio = "16:9"
			case "1024x1792":
				converted.AspectRatio = "9:16"
			}
		}
	}
	switch converted.AspectRatio {
	case "auto", "1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "5:4", "4:5", "21:9":
	case "1:4", "4:1", "1:8", "8:1":
		if !strings.HasPrefix(request.Model, "nano-banana-2") {
			return nil, fmt.Errorf("图片比例 %s 仅支持 nano-banana-2 系列", converted.AspectRatio)
		}
	default:
		return nil, fmt.Errorf("Grsai 不支持图片比例 %s，请使用 aspect_ratio 指定支持的比例", converted.AspectRatio)
	}
	if len(request.Images) > 0 && len(request.Image) > 0 {
		return nil, fmt.Errorf("image 与 images 不能同时传入")
	}
	images := request.Images
	if len(request.Image) > 0 {
		images = request.Image
	}
	if len(images) > 0 {
		if common.GetJsonType(images) == "string" {
			var value string
			if err := common.Unmarshal(images, &value); err != nil {
				return nil, err
			}
			converted.Images = []string{value}
		} else if err := common.Unmarshal(images, &converted.Images); err != nil {
			return nil, fmt.Errorf("参考图必须为 URL、Base64 字符串或字符串数组")
		}
		for _, value := range converted.Images {
			if strings.TrimSpace(value) == "" {
				return nil, fmt.Errorf("参考图不能为空")
			}
		}
	}
	return converted, nil
}

func imageResponse(c *gin.Context, resp *http.Response, info *relaycommon.RelayInfo) (*dto.Usage, *types.NewAPIError) {
	defer service.CloseResponseBodyGracefully(resp)
	var result struct {
		Status  string `json:"status"`
		Error   string `json:"error"`
		Results []struct {
			URL string `json:"url"`
		} `json:"results"`
	}
	if err := common.DecodeJson(resp.Body, &result); err != nil {
		return nil, types.NewOpenAIError(err, types.ErrorCodeBadResponseBody, http.StatusBadGateway, types.ErrOptionWithSkipRetry())
	}
	if result.Status != "succeeded" {
		statusCode := http.StatusBadGateway
		code := "grsai_image_failed"
		if result.Status == "violation" {
			statusCode = http.StatusBadRequest
			code = "content_policy_violation"
		}
		message := result.Error
		if message == "" {
			message = fmt.Sprintf("Grsai 未返回成功的生图结果，状态：%s", result.Status)
		}
		return nil, types.WithOpenAIError(types.OpenAIError{
			Message: message, Type: "grsai_image_error", Code: code,
		}, statusCode, types.ErrOptionWithSkipRetry())
	}
	if len(result.Results) == 0 || len(result.Results) > dto.MaxImageN {
		return nil, types.NewOpenAIError(fmt.Errorf("Grsai 返回的图片数量无效"), types.ErrorCodeBadResponseBody, http.StatusBadGateway, types.ErrOptionWithSkipRetry())
	}
	response := dto.ImageResponse{Created: info.StartTime.Unix()}
	for _, item := range result.Results {
		parsed, err := url.Parse(item.URL)
		if err != nil || parsed.Host == "" || (parsed.Scheme != "https" && parsed.Scheme != "http") {
			return nil, types.NewOpenAIError(fmt.Errorf("Grsai 返回的图片 URL 无效"), types.ErrorCodeBadResponseBody, http.StatusBadGateway, types.ErrOptionWithSkipRetry())
		}
		response.Data = append(response.Data, dto.ImageData{Url: item.URL})
	}
	// 直接返回上游链接，避免网关下载图片并重新编码为 Base64。
	data, err := common.Marshal(response)
	if err != nil {
		return nil, types.NewError(err, types.ErrorCodeBadResponseBody, types.ErrOptionWithSkipRetry())
	}
	info.PriceData.AddOtherRatio("n", float64(len(response.Data)))
	c.Header("Content-Type", "application/json")
	if _, err := c.Writer.Write(data); err != nil {
		return nil, types.NewError(err, types.ErrorCodeBadResponseBody, types.ErrOptionWithSkipRetry())
	}
	return &dto.Usage{}, nil
}
