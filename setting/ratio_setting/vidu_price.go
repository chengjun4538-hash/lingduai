package ratio_setting

import "strings"

const (
	ViduDefaultResolution     = "1080p"
	ViduResolutionPriceKeySep = ":"
)

var viduResolutionOrder = []string{"1080p", "720p", "540p"}

var defaultViduResolutionSecondPrices = map[string]float64{
	"1080p": 0.75,
	"720p":  0.6,
	"540p":  0.3,
}

type ViduResolutionPrice struct {
	Resolution string  `json:"resolution"`
	ModelPrice float64 `json:"model_price"`
}

func NormalizeViduResolution(resolution string) string {
	resolution = strings.ToLower(strings.TrimSpace(resolution))
	if resolution == "" {
		return ViduDefaultResolution
	}
	if !strings.HasSuffix(resolution, "p") {
		resolution += "p"
	}
	return resolution
}

func ViduResolutionPriceKey(modelName, resolution string) string {
	return FormatMatchingModelName(strings.TrimSpace(modelName)) +
		ViduResolutionPriceKeySep +
		NormalizeViduResolution(resolution)
}

func GetViduResolutionSecondPrice(modelName, resolution string) (float64, bool) {
	return GetViduResolutionSecondPriceByModels([]string{modelName}, resolution)
}

func GetViduResolutionSecondPriceByModels(modelNames []string, resolution string) (float64, bool) {
	resolution = NormalizeViduResolution(resolution)
	if _, ok := defaultViduResolutionSecondPrices[resolution]; !ok {
		return 0, false
	}

	seen := make(map[string]struct{})
	for _, modelName := range modelNames {
		modelName = FormatMatchingModelName(strings.TrimSpace(modelName))
		if modelName == "" {
			continue
		}
		if _, ok := seen[modelName]; ok {
			continue
		}
		seen[modelName] = struct{}{}

		if price, ok := GetModelPrice(ViduResolutionPriceKey(modelName, resolution), false); ok {
			return price, true
		}
	}

	price, ok := defaultViduResolutionSecondPrices[resolution]
	return price, ok
}

func GetViduResolutionSecondPrices(modelName string) []ViduResolutionPrice {
	items := make([]ViduResolutionPrice, 0, len(viduResolutionOrder))
	for _, resolution := range viduResolutionOrder {
		price, ok := GetViduResolutionSecondPrice(modelName, resolution)
		if !ok {
			continue
		}
		items = append(items, ViduResolutionPrice{
			Resolution: resolution,
			ModelPrice: price,
		})
	}
	return items
}
