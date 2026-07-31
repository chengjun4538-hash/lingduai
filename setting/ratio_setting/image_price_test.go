package ratio_setting

import (
	"testing"

	"github.com/QuantumNous/new-api/common"
)

func TestClassifyImageResolution(t *testing.T) {
	tests := []struct {
		name           string
		size           string
		wantResolution string
		wantPixels     int64
	}{
		{name: "未传尺寸按 1K", size: "", wantResolution: "1k"},
		{name: "直接指定 2K", size: "2K", wantResolution: "2k"},
		{name: "1K 方图", size: "1024x1024", wantResolution: "1k", wantPixels: 1_048_576},
		{name: "1K 边界", size: "1600x1000", wantResolution: "1k", wantPixels: 1_600_000},
		{name: "2K 起点", size: "1600001x1", wantResolution: "2k", wantPixels: 1_600_001},
		{name: "2K 方图", size: "2048x2048", wantResolution: "2k", wantPixels: 4_194_304},
		{name: "2K 边界", size: "2500x2000", wantResolution: "2k", wantPixels: 5_000_000},
		{name: "4K 横图", size: "3840x2160", wantResolution: "4k", wantPixels: 8_294_400},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resolution, pixels, err := ClassifyImageResolution(tt.size)
			if err != nil {
				t.Fatalf("ClassifyImageResolution() error = %v", err)
			}
			if resolution != tt.wantResolution {
				t.Fatalf("resolution = %q, want %q", resolution, tt.wantResolution)
			}
			if pixels != tt.wantPixels {
				t.Fatalf("pixels = %d, want %d", pixels, tt.wantPixels)
			}
		})
	}
}

func TestClassifyImageResolutionRejectsInvalidSize(t *testing.T) {
	for _, size := range []string{"auto", "1024", "0x1024", "1024x0", "abcx1024"} {
		t.Run(size, func(t *testing.T) {
			if _, _, err := ClassifyImageResolution(size); err == nil {
				t.Fatalf("ClassifyImageResolution(%q) expected error", size)
			}
		})
	}
}

func TestGetImageResolutionPricesUsesConfiguredPrices(t *testing.T) {
	oldModelPrice := ModelPrice2JSONString()
	t.Cleanup(func() {
		if err := UpdateModelPriceByJSONString(oldModelPrice); err != nil {
			t.Fatalf("恢复模型价格失败: %v", err)
		}
	})

	modelPrices := GetModelPriceMap()
	modelPrices[ImageResolutionPriceKey("image-model", "1K")] = 0.02
	modelPrices[ImageResolutionPriceKey("image-model", "2K")] = 0.04
	modelPrices[ImageResolutionPriceKey("image-model", "4K")] = 0.08
	modelPrices["uppercase-model:2K"] = 0.05
	data, err := common.Marshal(modelPrices)
	if err != nil {
		t.Fatalf("序列化模型价格失败: %v", err)
	}
	if err := UpdateModelPriceByJSONString(string(data)); err != nil {
		t.Fatalf("更新模型价格失败: %v", err)
	}

	prices := GetImageResolutionPrices("image-model")
	if len(prices) != 3 {
		t.Fatalf("prices length = %d, want 3", len(prices))
	}
	if prices[1].Resolution != "2k" || prices[1].ModelPrice != 0.04 {
		t.Fatalf("2K price = %+v, want 0.04", prices[1])
	}
	if price, ok := GetImageResolutionPrice("uppercase-model", "2k"); !ok || price != 0.05 {
		t.Fatalf("uppercase 2K price = %v, %v, want 0.05, true", price, ok)
	}
}
