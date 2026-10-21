package relay

import (
	"net/http/httptest"
	"testing"

	"github.com/QuantumNous/new-api/common"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGrsaiVideoBillingUsesResolutionDurationAndGroup(t *testing.T) {
	originalPrices := ratio_setting.ModelPrice2JSONString()
	originalGroups := ratio_setting.GroupRatio2JSONString()
	originalQuotaPerUnit := common.QuotaPerUnit
	t.Cleanup(func() {
		require.NoError(t, ratio_setting.UpdateModelPriceByJSONString(originalPrices))
		require.NoError(t, ratio_setting.UpdateGroupRatioByJSONString(originalGroups))
		common.QuotaPerUnit = originalQuotaPerUnit
	})
	common.QuotaPerUnit = 500_000
	require.NoError(t, ratio_setting.UpdateModelPriceByJSONString(`{"video-alias":0.1,"video-alias:1080p":0.4,"free-video":0,"bad-video":-1,"huge-video":1e308}`))
	require.NoError(t, ratio_setting.UpdateGroupRatioByJSONString(`{"grsai-test":2}`))
	ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
	info := &relaycommon.RelayInfo{OriginModelName: "video-alias", UserGroup: "grsai-test", UsingGroup: "grsai-test", ChannelMeta: &relaycommon.ChannelMeta{UpstreamModelName: "minimax-h3"}}
	for _, tc := range []struct {
		resolution string
		unitPrice  float64
		quota      int
	}{
		{"480p", 0.1, 500_000}, {"768p", 0.1, 500_000}, {"1080p", 0.4, 2_000_000},
	} {
		ctx.Set("task_request", relaycommon.TaskSubmitReq{Duration: 5, Resolution: tc.resolution})
		price, err := buildGrsaiVideoPriceData(ctx, info)
		require.NoError(t, err)
		assert.Equal(t, tc.unitPrice, price.ModelPrice)
		assert.Equal(t, tc.quota, price.Quota)
		assert.Equal(t, map[string]float64{"duration": 5}, price.OtherRatios())
		assert.False(t, price.FreeModel)
	}
	for _, name := range []string{"missing-video", "bad-video"} {
		info.OriginModelName = name
		_, err := buildGrsaiVideoPriceData(ctx, info)
		require.Error(t, err)
	}
	info.OriginModelName = "free-video"
	price, err := buildGrsaiVideoPriceData(ctx, info)
	require.NoError(t, err)
	assert.True(t, price.FreeModel)
	assert.Zero(t, price.Quota)
	info.OriginModelName = "huge-video"
	price, err = buildGrsaiVideoPriceData(ctx, info)
	require.NoError(t, err)
	assert.Equal(t, common.MaxQuota, price.Quota)
	require.NotNil(t, info.QuotaClamp)
	assert.Equal(t, common.QuotaClampOverflow, info.QuotaClamp.Kind)
	info.OriginModelName = "video-alias"
	for _, request := range []relaycommon.TaskSubmitReq{
		{Duration: 0, Resolution: "480p"}, {Duration: 16, Resolution: "768p"},
		{Duration: 11, Resolution: "1080p"}, {Duration: 5, Resolution: "4k"},
	} {
		ctx.Set("task_request", request)
		_, err := buildGrsaiVideoPriceData(ctx, info)
		require.Error(t, err)
	}
	ctx.Set("task_request", relaycommon.TaskSubmitReq{Duration: 5, Resolution: "480p"})
	info.UpstreamModelName = "other-model"
	_, err = buildGrsaiVideoPriceData(ctx, info)
	require.Error(t, err)
}
