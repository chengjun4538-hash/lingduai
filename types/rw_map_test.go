package types

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestLoadFromJsonStringWithCallbackPreservesCurrentDataOnInvalidJSON(t *testing.T) {
	values := NewRWMap[string, float64]()
	values.Set("image-model:1k", 0.02)
	callbackCalled := false

	err := LoadFromJsonStringWithCallback(values, `{"image-model:1k":`, func() {
		callbackCalled = true
	})

	require.Error(t, err)
	assert.Equal(t, map[string]float64{"image-model:1k": 0.02}, values.ReadAll())
	assert.False(t, callbackCalled)
}
