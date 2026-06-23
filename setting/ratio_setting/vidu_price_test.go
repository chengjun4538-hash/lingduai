package ratio_setting

import (
	"testing"

	"github.com/QuantumNous/new-api/common"
)

func TestGetViduResolutionSecondPriceUsesConfiguredPrice(t *testing.T) {
	oldModelPrice := ModelPrice2JSONString()
	t.Cleanup(func() {
		if err := UpdateModelPriceByJSONString(oldModelPrice); err != nil {
			t.Fatalf("restore model price: %v", err)
		}
	})

	modelPrices := GetModelPriceMap()
	modelPrices[ViduResolutionPriceKey("viduq3", "720P")] = 1.25
	data, err := common.Marshal(modelPrices)
	if err != nil {
		t.Fatalf("marshal model prices: %v", err)
	}
	if err := UpdateModelPriceByJSONString(string(data)); err != nil {
		t.Fatalf("update model price: %v", err)
	}

	price, ok := GetViduResolutionSecondPrice("viduq3", "720p")
	if !ok {
		t.Fatal("expected configured vidu resolution price")
	}
	if price != 1.25 {
		t.Fatalf("price = %v, want 1.25", price)
	}
}

func TestGetViduResolutionSecondPriceFallsBackToDefault(t *testing.T) {
	price, ok := GetViduResolutionSecondPrice("viduq3", "540P")
	if !ok {
		t.Fatal("expected default vidu resolution price")
	}
	if price != 0.3 {
		t.Fatalf("price = %v, want 0.3", price)
	}
}
