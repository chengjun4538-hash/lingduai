package grsai

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"github.com/QuantumNous/new-api/common"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
)

type videoRequest struct {
	Model       string   `json:"model"`
	Prompt      string   `json:"prompt"`
	AspectRatio string   `json:"aspectRatio"`
	Resolution  string   `json:"resolution"`
	Duration    *int     `json:"duration,omitempty"`
	Images      []string `json:"images,omitempty"`
	Audios      []string `json:"audios,omitempty"`
	Seed        *int64   `json:"seed,omitempty"`
	PromptSkill *bool    `json:"promptSkill,omitempty"`
	ReplyType   string   `json:"replyType"`
}

// normalizeRequest 在预扣费前完成别名和 metadata 合并；计费与上游共用这份结果。
func normalizeRequest(fields map[string]json.RawMessage) (*videoRequest, error) {
	if raw, ok := fields["metadata"]; ok {
		var metadata map[string]json.RawMessage
		if err := common.Unmarshal(raw, &metadata); err != nil {
			return nil, fmt.Errorf("Grsai 视频的 metadata 必须为 JSON 对象")
		}
		for key, value := range metadata {
			switch key {
			case "aspectRatio", "aspect_ratio", "resolution", "size", "duration", "seconds", "images", "image", "input_reference", "audios", "seed", "promptSkill", "replyType":
			default:
				return nil, fmt.Errorf("Grsai 视频不支持 metadata.%s", key)
			}
			if _, exists := fields[key]; exists {
				return nil, fmt.Errorf("%s 不能同时出现在请求顶层和 metadata 中", key)
			}
			fields[key] = value
		}
	}
	data, err := common.Marshal(fields)
	if err != nil {
		return nil, err
	}
	var input struct {
		videoRequest
		Seconds        *string `json:"seconds"`
		Size           string  `json:"size"`
		AspectRatioAlt string  `json:"aspect_ratio"`
		Image          string  `json:"image"`
		InputReference string  `json:"input_reference"`
		Stream         *bool   `json:"stream"`
		N              *uint   `json:"n"`
	}
	if err := common.Unmarshal(data, &input); err != nil {
		return nil, fmt.Errorf("Grsai 视频参数格式错误：%w", err)
	}
	if strings.TrimSpace(input.Model) == "" || strings.TrimSpace(input.Prompt) == "" {
		return nil, fmt.Errorf("Grsai 视频的 model 和 prompt 不能为空")
	}
	if input.Stream != nil && *input.Stream || input.ReplyType != "" && input.ReplyType != "async" {
		return nil, fmt.Errorf("Grsai 视频使用异步任务，请省略 stream 和 replyType，或设置 replyType 为 async")
	}
	if input.N != nil && *input.N != 1 {
		return nil, fmt.Errorf("Grsai 视频每次只能生成一个视频，n 必须为 1")
	}
	if input.Seconds != nil {
		seconds, err := strconv.Atoi(*input.Seconds)
		if err != nil {
			return nil, fmt.Errorf("Grsai 视频的 seconds 必须为整数字符串")
		}
		if input.Duration != nil && *input.Duration != seconds {
			return nil, fmt.Errorf("Grsai 视频的 seconds 与 duration 冲突")
		}
		input.Duration = &seconds
	}
	if input.Duration == nil {
		input.Duration = common.GetPointer(5)
	}
	input.Resolution = strings.ToLower(strings.TrimSpace(input.Resolution))
	if input.Size != "" {
		size := strings.ToLower(strings.TrimSpace(input.Size))
		if input.Resolution != "" && input.Resolution != size {
			return nil, fmt.Errorf("Grsai 视频的 size 与 resolution 冲突")
		}
		input.Resolution = size
	}
	if input.Resolution == "" {
		input.Resolution = "480p"
	}
	maxDuration := 15
	switch input.Resolution {
	case "480p", "768p":
	case "1080p":
		maxDuration = 10
	default:
		return nil, fmt.Errorf("Grsai 视频的 resolution 只支持 480p、768p、1080p")
	}
	if *input.Duration < 1 || *input.Duration > relaycommon.MaxTaskDurationSeconds || *input.Duration > maxDuration {
		return nil, fmt.Errorf("Grsai %s 视频时长必须为 1～%d 秒", input.Resolution, maxDuration)
	}
	if input.AspectRatioAlt != "" {
		if input.AspectRatio != "" && input.AspectRatio != input.AspectRatioAlt {
			return nil, fmt.Errorf("Grsai 视频的 aspectRatio 与 aspect_ratio 冲突")
		}
		input.AspectRatio = input.AspectRatioAlt
	}
	switch input.AspectRatio {
	case "", "16:9", "landscape":
		input.AspectRatio = "landscape"
	case "9:16", "portrait":
		input.AspectRatio = "portrait"
	default:
		return nil, fmt.Errorf("Grsai 视频比例只支持 landscape（16:9）和 portrait（9:16）")
	}
	for _, image := range []string{input.Image, input.InputReference} {
		if image == "" {
			continue
		}
		if len(input.Images) > 0 {
			return nil, fmt.Errorf("Grsai 视频的 images、image、input_reference 只能使用一个")
		}
		input.Images = []string{image}
	}
	if len(input.Images) > 9 || len(input.Audios) > 3 {
		return nil, fmt.Errorf("Grsai 视频最多支持 9 张参考图和 3 段参考音频")
	}
	for _, values := range [][]string{input.Images, input.Audios} {
		for _, value := range values {
			if strings.TrimSpace(value) == "" {
				return nil, fmt.Errorf("Grsai 视频的参考素材不能为空")
			}
		}
	}
	input.ReplyType = "async"
	return &input.videoRequest, nil
}
