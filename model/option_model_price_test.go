package model

import (
	"testing"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestValidateOptionValueRejectsInvalidModelPriceJSON(t *testing.T) {
	require.NoError(t, validateOptionValue("ModelPrice", `{"Nano Banana 2:1k":0.02}`))
	require.Error(t, validateOptionValue("ModelPrice", `{"Nano Banana 2:1k":`))
	require.Error(t, validateOptionValue("ModelPrice", `{"Nano Banana 2:1k":"0.02"}`))
}

func TestUpdateOptionMapInvalidatesPricingAfterModelPriceChange(t *testing.T) {
	originalPrices := ratio_setting.ModelPrice2JSONString()
	common.OptionMapRWMutex.Lock()
	originalOptionMap := common.OptionMap
	common.OptionMap = make(map[string]string)
	common.OptionMapRWMutex.Unlock()
	t.Cleanup(func() {
		common.OptionMapRWMutex.Lock()
		common.OptionMap = originalOptionMap
		common.OptionMapRWMutex.Unlock()
	})
	t.Cleanup(func() {
		require.NoError(t, updateOptionMap("ModelPrice", originalPrices))
	})
	pricingMap = []Pricing{{ModelName: "cached-model"}}
	lastGetPricingTime = time.Now()

	require.NoError(t, updateOptionMap("ModelPrice", `{"Nano Banana 2:1k":0.02}`))

	assert.Nil(t, pricingMap)
	assert.True(t, lastGetPricingTime.IsZero())
}
