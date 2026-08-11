package ratio_setting

import (
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetViduResolutionSecondPriceUsesConfiguredModelPrice(t *testing.T) {
	original := ModelPrice2JSONString()
	t.Cleanup(func() {
		require.NoError(t, UpdateModelPriceByJSONString(original))
	})

	prices := GetModelPriceMap()
	prices[ViduResolutionPriceKey("viduq3", "720p")] = 1.25
	data, err := common.Marshal(prices)
	require.NoError(t, err)
	require.NoError(t, UpdateModelPriceByJSONString(string(data)))

	price, ok := GetViduResolutionSecondPrice("viduq3", "720P")
	require.True(t, ok)
	assert.Equal(t, 1.25, price)
}

func TestGetViduResolutionSecondPriceFallsBackToDefault(t *testing.T) {
	price, ok := GetViduResolutionSecondPrice("viduq3", "540")
	require.True(t, ok)
	assert.Equal(t, 0.3, price)

	_, ok = GetViduResolutionSecondPrice("viduq3", "4k")
	assert.False(t, ok)
}
