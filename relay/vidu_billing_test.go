package relay

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/QuantumNous/new-api/common"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestBuildViduDynamicPriceDataUsesConfiguredResolutionPrice(t *testing.T) {
	originalQuotaPerUnit := common.QuotaPerUnit
	originalPrices := ratio_setting.ModelPrice2JSONString()
	common.QuotaPerUnit = 500_000
	t.Cleanup(func() {
		common.QuotaPerUnit = originalQuotaPerUnit
		require.NoError(t, ratio_setting.UpdateModelPriceByJSONString(originalPrices))
	})

	prices := ratio_setting.GetModelPriceMap()
	prices[ratio_setting.ViduResolutionPriceKey("viduq3", "720p")] = 1
	data, err := common.Marshal(prices)
	require.NoError(t, err)
	require.NoError(t, ratio_setting.UpdateModelPriceByJSONString(string(data)))

	ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
	ctx.Request = httptest.NewRequest(http.MethodPost, "/ent/v2/reference2video", nil)
	ctx.Set("task_request", relaycommon.TaskSubmitReq{Model: "viduq3", Duration: 7, Resolution: "720p"})
	priceData, err := buildViduDynamicPriceData(ctx, &relaycommon.RelayInfo{
		OriginModelName: "viduq3",
		UserGroup:       "default",
		UsingGroup:      "default",
	})
	require.NoError(t, err)
	assert.Equal(t, 3_500_000, priceData.Quota)
	assert.Equal(t, 1.0, priceData.ModelPrice)
	assert.Equal(t, 7.0, priceData.OtherRatios()["duration"])
}

func TestBuildViduDynamicPriceDataRejectsInvalidMultipliers(t *testing.T) {
	ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
	ctx.Request = httptest.NewRequest(http.MethodPost, "/ent/v2/reference2video", nil)

	ctx.Set("task_request", relaycommon.TaskSubmitReq{Model: "viduq3", Duration: 3601, Resolution: "720p"})
	_, err := buildViduDynamicPriceData(ctx, &relaycommon.RelayInfo{})
	require.Error(t, err)

	ctx.Set("task_request", relaycommon.TaskSubmitReq{Model: "viduq3", Duration: 5, Resolution: "4k"})
	_, err = buildViduDynamicPriceData(ctx, &relaycommon.RelayInfo{})
	require.Error(t, err)
}
