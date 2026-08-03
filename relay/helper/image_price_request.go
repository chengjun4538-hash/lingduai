package helper

import (
	"fmt"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	relayconstant "github.com/QuantumNous/new-api/relay/constant"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
)

const chatImageDefaultResolution = "2k"

type imagePricingRequest struct {
	Resolution string
	Pixels     int64
	Count      int
}

type imageResolutionCandidate struct {
	Field string
	Value string
}

type chatImageConfig struct {
	ImageSize      *string `json:"image_size,omitempty"`
	ImageSizeCamel *string `json:"imageSize,omitempty"`
}

type chatImageExtraBody struct {
	ImageConfig *chatImageConfig `json:"image_config,omitempty"`
	Google      *struct {
		ImageConfig *chatImageConfig `json:"image_config,omitempty"`
	} `json:"google,omitempty"`
}

// resolveImagePricingRequest 提取不同兼容接口中的图片计费参数。
// 返回 false 表示当前请求并非受支持的图片生成或图片编辑请求。
func resolveImagePricingRequest(info *relaycommon.RelayInfo) (imagePricingRequest, bool, error) {
	result := imagePricingRequest{Count: 1}

	switch request := info.Request.(type) {
	case *dto.ImageRequest:
		if info.RelayMode != relayconstant.RelayModeImagesGenerations &&
			info.RelayMode != relayconstant.RelayModeImagesEdits {
			return result, false, nil
		}

		resolution, pixels, err := ratio_setting.ClassifyImageResolution(request.Size)
		if err != nil {
			return result, true, err
		}
		result.Resolution = resolution
		result.Pixels = pixels
		if request.N != nil && *request.N > 0 {
			result.Count = int(*request.N)
		}
		return result, true, nil

	case *dto.GeneralOpenAIRequest:
		if info.RelayMode != relayconstant.RelayModeChatCompletions {
			return result, false, nil
		}

		candidates, err := chatImageResolutionCandidates(request)
		if err != nil {
			return result, true, err
		}
		if request.N != nil && *request.N > 0 {
			result.Count = *request.N
		}
		if len(candidates) == 0 {
			// Chat Completions 生图上游未传尺寸时默认生成 2048×2048。
			result.Resolution = chatImageDefaultResolution
			return result, true, nil
		}

		var selected imageResolutionCandidate
		for _, candidate := range candidates {
			resolution, pixels, err := ratio_setting.ClassifyImageResolution(candidate.Value)
			if err != nil {
				return result, true, fmt.Errorf("图片计费字段 %s 无效: %w", candidate.Field, err)
			}
			if result.Resolution == "" {
				result.Resolution = resolution
				result.Pixels = pixels
				selected = candidate
				continue
			}
			if resolution != result.Resolution {
				return result, true, fmt.Errorf(
					"图片计费分辨率字段冲突：%s=%q 对应 %s，%s=%q 对应 %s",
					selected.Field,
					selected.Value,
					strings.ToUpper(result.Resolution),
					candidate.Field,
					candidate.Value,
					strings.ToUpper(resolution),
				)
			}
			if result.Pixels == 0 && pixels > 0 {
				result.Pixels = pixels
			}
		}
		return result, true, nil
	}

	return result, false, nil
}

func chatImageResolutionCandidates(request *dto.GeneralOpenAIRequest) ([]imageResolutionCandidate, error) {
	candidates := make([]imageResolutionCandidate, 0, 7)
	appendCandidate := func(field string, value *string, sizeMayBeAspectRatio bool) {
		if value == nil {
			return
		}
		normalized := strings.TrimSpace(*value)
		if normalized == "" || strings.EqualFold(normalized, "auto") {
			return
		}
		if sizeMayBeAspectRatio && strings.Contains(normalized, ":") && !strings.Contains(strings.ToLower(normalized), "x") {
			return
		}
		candidates = append(candidates, imageResolutionCandidate{Field: field, Value: normalized})
	}

	appendCandidate("size", &request.Size, true)
	appendCandidate("output_resolution", request.OutputResolution, false)
	appendCandidate("image_size", request.ImageSize, false)

	if len(request.ImageConfig) > 0 {
		var config chatImageConfig
		if err := common.Unmarshal(request.ImageConfig, &config); err != nil {
			return nil, fmt.Errorf("解析 image_config 失败: %w", err)
		}
		appendCandidate("image_config.image_size", config.ImageSize, false)
		appendCandidate("image_config.imageSize", config.ImageSizeCamel, false)
	}

	if len(request.ExtraBody) > 0 {
		var extraBody chatImageExtraBody
		if err := common.Unmarshal(request.ExtraBody, &extraBody); err != nil {
			return nil, fmt.Errorf("解析 extra_body 失败: %w", err)
		}
		if extraBody.ImageConfig != nil {
			appendCandidate("extra_body.image_config.image_size", extraBody.ImageConfig.ImageSize, false)
			appendCandidate("extra_body.image_config.imageSize", extraBody.ImageConfig.ImageSizeCamel, false)
		}
		if extraBody.Google != nil && extraBody.Google.ImageConfig != nil {
			appendCandidate("extra_body.google.image_config.image_size", extraBody.Google.ImageConfig.ImageSize, false)
			appendCandidate("extra_body.google.image_config.imageSize", extraBody.Google.ImageConfig.ImageSizeCamel, false)
		}
	}

	return candidates, nil
}
