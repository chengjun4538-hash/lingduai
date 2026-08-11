package ratio_setting

import (
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestClassifyImageResolution(t *testing.T) {
	tests := []struct {
		name       string
		size       string
		resolution string
		pixels     int64
	}{
		{name: "未传尺寸按 1K", resolution: "1k"},
		{name: "直接指定 2K", size: "2K", resolution: "2k"},
		{name: "1K 边界", size: "1600x1000", resolution: "1k", pixels: 1_600_000},
		{name: "2K 方图", size: "2048x2048", resolution: "2k", pixels: 4_194_304},
		{name: "4K 横图", size: "3840x2160", resolution: "4k", pixels: 8_294_400},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			resolution, pixels, err := ClassifyImageResolution(test.size)
			require.NoError(t, err)
			assert.Equal(t, test.resolution, resolution)
			assert.Equal(t, test.pixels, pixels)
		})
	}
}

func TestClassifyImageResolutionRejectsInvalidSize(t *testing.T) {
	for _, size := range []string{"auto", "1024", "0x1024", "1024x0", "abcx1024"} {
		t.Run(size, func(t *testing.T) {
			_, _, err := ClassifyImageResolution(size)
			require.Error(t, err)
		})
	}
}

func TestGetImageResolutionPricesUsesConfiguredPrices(t *testing.T) {
	original := ModelPrice2JSONString()
	t.Cleanup(func() {
		require.NoError(t, UpdateModelPriceByJSONString(original))
	})

	prices := GetModelPriceMap()
	prices[ImageResolutionPriceKey("image-model", "1K")] = 0.02
	prices[ImageResolutionPriceKey("image-model", "2K")] = 0.04
	prices[ImageResolutionPriceKey("image-model", "4K")] = 0.08
	data, err := common.Marshal(prices)
	require.NoError(t, err)
	require.NoError(t, UpdateModelPriceByJSONString(string(data)))

	configured := GetImageResolutionPrices("image-model")
	require.Len(t, configured, 3)
	assert.Equal(t, ImageResolutionPrice{Resolution: "2k", ModelPrice: 0.04}, configured[1])
}
