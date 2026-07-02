package middleware

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	relayconstant "github.com/QuantumNous/new-api/relay/constant"
	"github.com/gin-gonic/gin"
)

func TestGetModelRequestNativeViduVideoSubmitPaths(t *testing.T) {
	gin.SetMode(gin.TestMode)

	paths := []string{
		"/ent/v2/text2video",
		"/ent/v2/img2video",
		"/ent/v2/reference2video",
		"/ent/v2/start-end2video",
	}

	for _, path := range paths {
		t.Run(path, func(t *testing.T) {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = httptest.NewRequest(http.MethodPost, path, strings.NewReader(`{"model":"viduq3"}`))
			c.Request.Header.Set("Content-Type", "application/json")

			req, shouldSelectChannel, err := getModelRequest(c)
			if err != nil {
				t.Fatalf("getModelRequest returned error: %v", err)
			}
			if !shouldSelectChannel {
				t.Fatal("shouldSelectChannel = false, want true")
			}
			if req.Model != "viduq3" {
				t.Fatalf("model = %q, want viduq3", req.Model)
			}
			if relayMode := c.GetInt("relay_mode"); relayMode != relayconstant.RelayModeVideoSubmit {
				t.Fatalf("relay_mode = %d, want %d", relayMode, relayconstant.RelayModeVideoSubmit)
			}
		})
	}
}
