package model

import (
	"testing"

	"github.com/QuantumNous/new-api/constant"
)

func TestIsViduPricingModel(t *testing.T) {
	tests := []struct {
		name      string
		model     string
		endpoints []constant.EndpointType
		want      bool
	}{
		{name: "按模型名识别", model: "vidu-q1", want: true},
		{name: "按原生端点识别", model: "custom-video", endpoints: []constant.EndpointType{constant.EndpointTypeViduImageVideo}, want: true},
		{name: "普通视频模型", model: "sora-2", endpoints: []constant.EndpointType{constant.EndpointTypeOpenAIVideo}, want: false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := isViduPricingModel(tt.model, tt.endpoints); got != tt.want {
				t.Fatalf("isViduPricingModel() = %v, want %v", got, tt.want)
			}
		})
	}
}
