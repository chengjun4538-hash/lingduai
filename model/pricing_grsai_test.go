package model

import (
	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/relaykit/dto"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"testing"
)

func TestGrsaiPricingPublishesVideoEndpointAndResolutionPricesForAlias(t *testing.T) {
	resetPricingEndpointTestTables(t)
	originalPrices := ratio_setting.ModelPrice2JSONString()
	t.Cleanup(func() { require.NoError(t, ratio_setting.UpdateModelPriceByJSONString(originalPrices)) })
	require.NoError(t, ratio_setting.UpdateModelPriceByJSONString(`{"video-alias:480p":0.1,"video-alias:768p":0.2,"video-alias:1080p":0.3}`))
	insertPricingEndpointChannel(t, 301, constant.ChannelTypeGrsai, dto.ChannelOtherSettings{})
	require.NoError(t, DB.Model(&Channel{}).Where("id = ?", 301).Update("model_mapping", `{"video-alias":"intermediate","intermediate":"minimax-h3"}`).Error)
	insertPricingEndpointAbility(t, 301, "video-alias")
	insertPricingEndpointAbility(t, 301, "nano-banana-2")
	InitChannelCache()
	pricings := GetPricing()
	byModel := pricingEndpointTypesFromPricing(pricings)
	assert.Equal(t, []constant.EndpointType{constant.EndpointTypeOpenAIVideo}, byModel["video-alias"])
	assert.Equal(t, []constant.EndpointType{constant.EndpointTypeImageGeneration}, byModel["nano-banana-2"])
	for _, pricing := range pricings {
		if pricing.ModelName != "video-alias" {
			continue
		}
		assert.Equal(t, 1, pricing.QuotaType)
		assert.Equal(t, []ratio_setting.GrsaiVideoResolutionPrice{{Resolution: "480p", ModelPrice: 0.1}, {Resolution: "768p", ModelPrice: 0.2}, {Resolution: "1080p", ModelPrice: 0.3}}, pricing.GrsaiVideoResolutionPrices)
	}
	assert.Equal(t, constant.EndpointTypeOpenAIVideo, common.GetGrsaiModelEndpoint("minimax-h3", ""))
}
