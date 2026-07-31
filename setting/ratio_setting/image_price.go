package ratio_setting

import (
	"fmt"
	"math"
	"strconv"
	"strings"
)

const (
	ImageDefaultResolution     = "1k"
	ImageResolutionPriceKeySep = ":"
	ImageOneKMaxPixels         = int64(1_600_000)
	ImageTwoKMaxPixels         = int64(5_000_000)
)

var imageResolutionOrder = []string{"1k", "2k", "4k"}

type ImageResolutionPrice struct {
	Resolution string  `json:"resolution"`
	ModelPrice float64 `json:"model_price"`
}

func NormalizeImageResolution(resolution string) (string, bool) {
	resolution = strings.ToLower(strings.TrimSpace(resolution))
	switch resolution {
	case "1k", "2k", "4k":
		return resolution, true
	default:
		return "", false
	}
}

func ImageResolutionPriceKey(modelName, resolution string) string {
	normalized, _ := NormalizeImageResolution(resolution)
	return FormatMatchingModelName(strings.TrimSpace(modelName)) +
		ImageResolutionPriceKeySep +
		normalized
}

func GetImageResolutionPrice(modelName, resolution string) (float64, bool) {
	normalized, ok := NormalizeImageResolution(resolution)
	if !ok {
		return 0, false
	}
	if price, ok := GetModelPrice(ImageResolutionPriceKey(modelName, normalized), false); ok {
		return price, true
	}
	uppercaseKey := FormatMatchingModelName(strings.TrimSpace(modelName)) +
		ImageResolutionPriceKeySep +
		strings.ToUpper(normalized)
	return GetModelPrice(uppercaseKey, false)
}

func HasImageResolutionPrice(modelName string) bool {
	for _, resolution := range imageResolutionOrder {
		if _, ok := GetImageResolutionPrice(modelName, resolution); ok {
			return true
		}
	}
	return false
}

func GetImageResolutionPrices(modelName string) []ImageResolutionPrice {
	items := make([]ImageResolutionPrice, 0, len(imageResolutionOrder))
	for _, resolution := range imageResolutionOrder {
		price, ok := GetImageResolutionPrice(modelName, resolution)
		if !ok {
			continue
		}
		items = append(items, ImageResolutionPrice{
			Resolution: resolution,
			ModelPrice: price,
		})
	}
	return items
}

// ClassifyImageResolution 按总像素划分计费档位。
// 空尺寸只影响计费归类，不会向上游请求补写 size。
func ClassifyImageResolution(size string) (resolution string, pixels int64, err error) {
	size = strings.ToLower(strings.TrimSpace(size))
	if size == "" {
		return ImageDefaultResolution, 0, nil
	}
	if resolution, ok := NormalizeImageResolution(size); ok {
		return resolution, 0, nil
	}

	parts := strings.Split(size, "x")
	if len(parts) != 2 {
		return "", 0, fmt.Errorf("图片尺寸 %q 无效，应使用“宽x高”或 1K/2K/4K", size)
	}
	width, err := strconv.ParseInt(strings.TrimSpace(parts[0]), 10, 64)
	if err != nil || width <= 0 {
		return "", 0, fmt.Errorf("图片尺寸 %q 的宽度无效", size)
	}
	height, err := strconv.ParseInt(strings.TrimSpace(parts[1]), 10, 64)
	if err != nil || height <= 0 {
		return "", 0, fmt.Errorf("图片尺寸 %q 的高度无效", size)
	}
	if width > math.MaxInt64/height {
		return "", 0, fmt.Errorf("图片尺寸 %q 的总像素超出支持范围", size)
	}

	pixels = width * height
	switch {
	case pixels <= ImageOneKMaxPixels:
		return "1k", pixels, nil
	case pixels <= ImageTwoKMaxPixels:
		return "2k", pixels, nil
	default:
		return "4k", pixels, nil
	}
}
