package service

import (
	"net/http/httptest"
	"testing"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/types"
	"github.com/gin-gonic/gin"
)

func TestCalculateTextQuotaSummaryUsesImageResolutionPriceAndCount(t *testing.T) {
	gin.SetMode(gin.TestMode)
	oldQuotaPerUnit := common.QuotaPerUnit
	common.QuotaPerUnit = 500000
	t.Cleanup(func() {
		common.QuotaPerUnit = oldQuotaPerUnit
	})

	ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
	info := &relaycommon.RelayInfo{
		OriginModelName: "image-model",
		StartTime:       time.Now(),
		PriceData: types.PriceData{
			ModelPrice:      0.04,
			UsePrice:        true,
			ImageResolution: "2k",
			ImagePixels:     4_194_304,
			OtherRatios: map[string]float64{
				"n": 2,
			},
			GroupRatioInfo: types.GroupRatioInfo{
				GroupRatio: 1,
			},
		},
	}
	usage := &dto.Usage{
		PromptTokens: 1,
		TotalTokens:  1,
	}

	summary := calculateTextQuotaSummary(ctx, info, usage)
	if summary.Quota != 40_000 {
		t.Fatalf("Quota = %d, want 40000", summary.Quota)
	}
}
