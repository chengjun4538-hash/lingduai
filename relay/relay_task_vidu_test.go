package relay

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/QuantumNous/new-api/common"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
	"github.com/QuantumNous/new-api/types"
	"github.com/gin-gonic/gin"
)

func TestBuildViduDynamicPriceData(t *testing.T) {
	gin.SetMode(gin.TestMode)
	oldQuotaPerUnit := common.QuotaPerUnit
	common.QuotaPerUnit = 500000
	t.Cleanup(func() {
		common.QuotaPerUnit = oldQuotaPerUnit
	})

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/ent/v2/reference2video", nil)
	c.Set("task_request", relaycommon.TaskSubmitReq{
		Model:      "viduq3",
		Duration:   7,
		Resolution: "720p",
	})

	priceData, err := buildViduDynamicPriceData(c, &relaycommon.RelayInfo{
		OriginModelName: "viduq3",
		UserGroup:       "default",
		UsingGroup:      "default",
	})
	if err != nil {
		t.Fatalf("buildViduDynamicPriceData returned error: %v", err)
	}
	if priceData.Quota != 2100000 {
		t.Fatalf("quota = %d, want 2100000", priceData.Quota)
	}
	if priceData.ModelPrice != 0.6 {
		t.Fatalf("model price = %v, want 0.6", priceData.ModelPrice)
	}
}

func TestBuildViduDynamicPriceDataDefaultDuration(t *testing.T) {
	gin.SetMode(gin.TestMode)
	oldQuotaPerUnit := common.QuotaPerUnit
	common.QuotaPerUnit = 500000
	t.Cleanup(func() {
		common.QuotaPerUnit = oldQuotaPerUnit
	})

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/ent/v2/reference2video", nil)
	c.Set("task_request", relaycommon.TaskSubmitReq{
		Model:      "viduq3",
		Resolution: "540P",
	})

	priceData, err := buildViduDynamicPriceData(c, &relaycommon.RelayInfo{
		OriginModelName: "viduq3",
		UserGroup:       "default",
		UsingGroup:      "default",
	})
	if err != nil {
		t.Fatalf("buildViduDynamicPriceData returned error: %v", err)
	}
	if priceData.Quota != 750000 {
		t.Fatalf("quota = %d, want 750000", priceData.Quota)
	}
}

func TestBuildViduDynamicPriceDataUsesConfiguredResolutionPrice(t *testing.T) {
	gin.SetMode(gin.TestMode)
	oldQuotaPerUnit := common.QuotaPerUnit
	oldModelPrice := ratio_setting.ModelPrice2JSONString()
	common.QuotaPerUnit = 500000
	t.Cleanup(func() {
		common.QuotaPerUnit = oldQuotaPerUnit
		if err := ratio_setting.UpdateModelPriceByJSONString(oldModelPrice); err != nil {
			t.Fatalf("restore model price: %v", err)
		}
	})

	modelPrices := ratio_setting.GetModelPriceMap()
	modelPrices[ratio_setting.ViduResolutionPriceKey("viduq3", "720p")] = 1
	data, err := common.Marshal(modelPrices)
	if err != nil {
		t.Fatalf("marshal model prices: %v", err)
	}
	if err := ratio_setting.UpdateModelPriceByJSONString(string(data)); err != nil {
		t.Fatalf("update model price: %v", err)
	}

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/ent/v2/reference2video", nil)
	c.Set("task_request", relaycommon.TaskSubmitReq{
		Model:      "viduq3",
		Duration:   7,
		Resolution: "720p",
	})

	priceData, err := buildViduDynamicPriceData(c, &relaycommon.RelayInfo{
		OriginModelName: "viduq3",
		UserGroup:       "default",
		UsingGroup:      "default",
	})
	if err != nil {
		t.Fatalf("buildViduDynamicPriceData returned error: %v", err)
	}
	if priceData.Quota != 3500000 {
		t.Fatalf("quota = %d, want 3500000", priceData.Quota)
	}
	if priceData.ModelPrice != 1 {
		t.Fatalf("model price = %v, want 1", priceData.ModelPrice)
	}
}

func TestBuildViduDynamicPriceDataRejectsUnknownResolution(t *testing.T) {
	gin.SetMode(gin.TestMode)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/ent/v2/reference2video", nil)
	c.Set("task_request", relaycommon.TaskSubmitReq{
		Model:      "viduq3",
		Duration:   5,
		Resolution: "4k",
	})

	_, err := buildViduDynamicPriceData(c, &relaycommon.RelayInfo{
		OriginModelName: "viduq3",
		UserGroup:       "default",
		UsingGroup:      "default",
	})
	if err == nil {
		t.Fatal("expected error for unknown resolution")
	}
}

func TestRecalcQuotaFromRatiosUsesAdjustedViduUnitPrice(t *testing.T) {
	info := &relaycommon.RelayInfo{
		PriceData: types.PriceData{
			Quota: 275000,
			OtherRatios: map[string]float64{
				"duration":        5,
				"vidu_unit_price": 0.11,
			},
		},
	}

	quota := recalcQuotaFromRatios(info, map[string]float64{
		"duration":        5,
		"vidu_unit_price": 0.09,
	})
	if quota != 225000 {
		t.Fatalf("quota = %d, want 225000", quota)
	}
}
