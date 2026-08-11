package middleware

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	relayconstant "github.com/QuantumNous/new-api/relay/constant"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetModelRequestNativeViduVideoSubmitPaths(t *testing.T) {
	for _, path := range []string{
		"/ent/v2/text2video",
		"/ent/v2/img2video",
		"/ent/v2/reference2video",
		"/ent/v2/start-end2video",
	} {
		t.Run(path, func(t *testing.T) {
			gin.SetMode(gin.TestMode)
			recorder := httptest.NewRecorder()
			ctx, _ := gin.CreateTestContext(recorder)
			ctx.Request = httptest.NewRequest(http.MethodPost, path, strings.NewReader(`{"model":"viduq3"}`))
			ctx.Request.Header.Set("Content-Type", "application/json")

			request, shouldSelectChannel, err := getModelRequest(ctx)
			require.NoError(t, err)
			assert.True(t, shouldSelectChannel)
			assert.Equal(t, "viduq3", request.Model)
			assert.Equal(t, relayconstant.RelayModeVideoSubmit, ctx.GetInt("relay_mode"))
		})
	}
}
