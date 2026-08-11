package service

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestResolveTaskPollingHeaderOverride(t *testing.T) {
	headers := resolveTaskPollingHeaderOverride(map[string]interface{}{
		"Authorization": "Bearer {api_key}",
		"X-Empty":       "  ",
		"X-Number":      1,
	}, "sk-test")

	assert.Equal(t, "Bearer sk-test", headers["Authorization"])
	assert.NotContains(t, headers, "X-Empty")
	assert.NotContains(t, headers, "X-Number")
}
