package dto

import (
	"encoding/json"
	"testing"

	"github.com/QuantumNous/new-api/common"
)

func TestGeneralOpenAIRequestPreservesChatImageFields(t *testing.T) {
	raw := []byte(`{
		"model":"chat-image-model",
		"aspect_ratio":"16:9",
		"output_resolution":"2K",
		"image_size":"2K",
		"image_config":{"image_size":"2K"}
	}`)

	var request GeneralOpenAIRequest
	if err := common.Unmarshal(raw, &request); err != nil {
		t.Fatalf("解析请求失败: %v", err)
	}
	if request.AspectRatio == nil || *request.AspectRatio != "16:9" {
		t.Fatalf("AspectRatio = %v, want 16:9", request.AspectRatio)
	}
	if request.OutputResolution == nil || *request.OutputResolution != "2K" {
		t.Fatalf("OutputResolution = %v, want 2K", request.OutputResolution)
	}
	if request.ImageSize == nil || *request.ImageSize != "2K" {
		t.Fatalf("ImageSize = %v, want 2K", request.ImageSize)
	}

	encoded, err := common.Marshal(request)
	if err != nil {
		t.Fatalf("序列化请求失败: %v", err)
	}
	var body map[string]json.RawMessage
	if err := common.Unmarshal(encoded, &body); err != nil {
		t.Fatalf("解析序列化结果失败: %v", err)
	}
	for _, field := range []string{"aspect_ratio", "output_resolution", "image_size", "image_config"} {
		if _, ok := body[field]; !ok {
			t.Fatalf("序列化结果缺少字段 %s: %s", field, string(encoded))
		}
	}
}
