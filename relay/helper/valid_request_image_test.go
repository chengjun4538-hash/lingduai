package helper

import (
	"bytes"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	relayconstant "github.com/QuantumNous/new-api/relay/constant"
	"github.com/gin-gonic/gin"
)

func TestImageRequestDoesNotAddMissingSize(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("图片生成", func(t *testing.T) {
		ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
		ctx.Request = httptest.NewRequest(
			http.MethodPost,
			"/v1/images/generations",
			strings.NewReader(`{"model":"dall-e-3","prompt":"测试"}`),
		)
		ctx.Request.Header.Set("Content-Type", "application/json")

		request, err := GetAndValidOpenAIImageRequest(ctx, relayconstant.RelayModeImagesGenerations)
		if err != nil {
			t.Fatalf("GetAndValidOpenAIImageRequest() error = %v", err)
		}
		if request.Size != "" {
			t.Fatalf("request.Size = %q, want empty", request.Size)
		}
	})

	t.Run("图片编辑", func(t *testing.T) {
		var body bytes.Buffer
		writer := multipart.NewWriter(&body)
		if err := writer.WriteField("model", "image-model"); err != nil {
			t.Fatalf("写入 model 字段失败: %v", err)
		}
		if err := writer.WriteField("prompt", "测试"); err != nil {
			t.Fatalf("写入 prompt 字段失败: %v", err)
		}
		if err := writer.Close(); err != nil {
			t.Fatalf("关闭 multipart writer 失败: %v", err)
		}

		ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
		ctx.Request = httptest.NewRequest(http.MethodPost, "/v1/images/edits", &body)
		ctx.Request.Header.Set("Content-Type", writer.FormDataContentType())

		request, err := GetAndValidOpenAIImageRequest(ctx, relayconstant.RelayModeImagesEdits)
		if err != nil {
			t.Fatalf("GetAndValidOpenAIImageRequest() error = %v", err)
		}
		if request.Size != "" {
			t.Fatalf("request.Size = %q, want empty", request.Size)
		}
	})
}
