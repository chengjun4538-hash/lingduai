package ratio_setting

import (
	"math"
	"strings"
)

type GrsaiVideoResolutionPrice struct {
	Resolution string  `json:"resolution"`
	ModelPrice float64 `json:"model_price"`
}

// GetGrsaiVideoSecondPrice 使用对外模型名配置售价，避免模型映射改变客户的计费规则。
// 分辨率专价优先，模型基础价格可作为所有分辨率共用的每秒价格。
func GetGrsaiVideoSecondPrice(modelName, resolution string) (float64, bool) {
	switch resolution {
	case "480p", "768p", "1080p":
	default:
		return 0, false
	}
	name := FormatMatchingModelName(strings.TrimSpace(modelName))
	price, ok := GetModelPrice(name+":"+resolution, false)
	if !ok {
		price, ok = GetModelPrice(name, false)
	}
	return price, ok && price >= 0 && !math.IsNaN(price) && !math.IsInf(price, 0)
}

func GetGrsaiVideoResolutionPrices(modelName string) []GrsaiVideoResolutionPrice {
	var prices []GrsaiVideoResolutionPrice
	for _, resolution := range []string{"480p", "768p", "1080p"} {
		if price, ok := GetGrsaiVideoSecondPrice(modelName, resolution); ok {
			prices = append(prices, GrsaiVideoResolutionPrice{Resolution: resolution, ModelPrice: price})
		}
	}
	return prices
}
