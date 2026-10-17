package helper

import (
	"fmt"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/relaykit/dto"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
)

// NormalizeGrsaiImageRequest 在预扣费前统一分辨率别名，保证发送给上游的档位与计费一致。
// 渠道重试和后台测试也会调用适配器，因此转换请求时仍需执行同一校验。
func NormalizeGrsaiImageRequest(request *dto.ImageRequest) error {
	if strings.TrimSpace(request.Prompt) == "" {
		return fmt.Errorf("Grsai 生图的 prompt 不能为空")
	}
	if request.N != nil && *request.N != 1 {
		return fmt.Errorf("Grsai 生图每次只支持一张图片，n 必须为 1")
	}
	if request.Stream != nil && *request.Stream {
		return fmt.Errorf("Grsai 生图暂不支持 stream，请使用同步请求")
	}
	if request.ResponseFormat != "" && request.ResponseFormat != "url" {
		return fmt.Errorf("Grsai 生图的 response_format 只支持 url")
	}
	if raw, ok := request.Extra["replyType"]; ok {
		var replyType string
		if err := common.Unmarshal(raw, &replyType); err != nil || replyType != "json" {
			return fmt.Errorf("Grsai 生图的 replyType 只支持 json")
		}
	}

	size := strings.TrimSpace(request.Size)
	resolution, _, err := ratio_setting.ClassifyImageResolution(size)
	if err != nil {
		return err
	}
	for _, field := range []string{"imageSize", "image_size"} {
		raw, ok := request.Extra[field]
		if !ok {
			continue
		}
		var value string
		if err := common.Unmarshal(raw, &value); err != nil {
			return fmt.Errorf("%s 必须为 1K、2K 或 4K", field)
		}
		normalized, ok := ratio_setting.NormalizeImageResolution(value)
		if !ok {
			return fmt.Errorf("%s 必须为 1K、2K 或 4K", field)
		}
		if size != "" && resolution != normalized {
			return fmt.Errorf("图片分辨率冲突：size 与 %s 必须对应同一档位", field)
		}
		if size == "" {
			size = strings.ToUpper(normalized)
			resolution = normalized
		}
	}
	request.Size = size
	return nil
}
