package relay

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/QuantumNous/new-api/common"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
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
