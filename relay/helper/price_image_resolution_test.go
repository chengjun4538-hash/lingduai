package helper

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	relayconstant "github.com/QuantumNous/new-api/relay/constant"
	"github.com/QuantumNous/new-api/relaykit/dto"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestModelPriceHelperUsesImageResolutionPrice(t *testing.T) {
	prepareImageResolutionPrices(t, "image-model")
	n := uint(2)
	request := &dto.ImageRequest{Model: "image-model", Size: "2048x2048", N: &n}
	info := imagePricingRelayInfo(request, "image-model", relayconstant.RelayModeImagesGenerations)
	ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
	ctx.Request = httptest.NewRequest(http.MethodPost, "/v1/images/generations", nil)

	priceData, err := ModelPriceHelper(ctx, info, 1, request.GetTokenCountMeta())
	require.NoError(t, err)
	assert.Equal(t, "2k", priceData.ImageResolution)
	assert.Equal(t, int64(4_194_304), priceData.ImagePixels)
	assert.Equal(t, 0.04, priceData.ModelPrice)
	assert.Equal(t, 40_000, priceData.QuotaToPreConsume)
	assert.Equal(t, 2.0, priceData.OtherRatios()["n"])
}

func TestModelPriceHelperKeepsMissingImageSizeAndBillsOneK(t *testing.T) {
	prepareImageResolutionPrices(t, "image-model")
	request := &dto.ImageRequest{Model: "image-model"}
	info := imagePricingRelayInfo(request, "image-model", relayconstant.RelayModeImagesEdits)
	ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
	ctx.Request = httptest.NewRequest(http.MethodPost, "/v1/images/edits", nil)

	priceData, err := ModelPriceHelper(ctx, info, 1, request.GetTokenCountMeta())
	require.NoError(t, err)
	assert.Equal(t, "1k", priceData.ImageResolution)
	assert.Equal(t, 10_000, priceData.QuotaToPreConsume)
	assert.Empty(t, request.Size)
}

func TestModelPriceHelperUsesChatImageDefaultsAndRejectsConflicts(t *testing.T) {
	prepareImageResolutionPrices(t, "chat-image-model")
	request := &dto.GeneralOpenAIRequest{Model: "chat-image-model", N: common.GetPointer(2)}
	info := imagePricingRelayInfo(request, "chat-image-model", relayconstant.RelayModeChatCompletions)
	ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
	ctx.Request = httptest.NewRequest(http.MethodPost, "/v1/chat/completions", nil)

	priceData, err := ModelPriceHelper(ctx, info, 1, request.GetTokenCountMeta())
	require.NoError(t, err)
	assert.Equal(t, "2k", priceData.ImageResolution)
	assert.Equal(t, 40_000, priceData.QuotaToPreConsume)

	request.Size = "1024x1024"
	request.OutputResolution = common.GetPointer("4K")
	_, err = ModelPriceHelper(ctx, info, 1, request.GetTokenCountMeta())
	require.Error(t, err)
	assert.Contains(t, err.Error(), "图片计费分辨率字段冲突")
}

func TestModelPriceHelperUsesGeminiImageResolutionPrice(t *testing.T) {
	prepareImageResolutionPrices(t, "gemini-image-model")
	tests := []struct {
		name       string
		config     []byte
		count      *int
		resolution string
		price      float64
		quota      int
	}{
		{
			name:       "未指定 imageSize 时使用 Gemini 默认 1K",
			resolution: "1k",
			price:      0.02,
			quota:      10_000,
		},
		{
			name:       "读取 camelCase imageSize 并按候选数量计费",
			config:     []byte(`{"imageSize":"4K"}`),
			count:      common.GetPointer(2),
			resolution: "4k",
			price:      0.08,
			quota:      80_000,
		},
		{
			name:       "兼容 snake_case image_size",
			config:     []byte(`{"image_size":"2K"}`),
			resolution: "2k",
			price:      0.04,
			quota:      20_000,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			requestPath := "/v1beta/models/gemini-image-model:generateContent"
			request := &dto.GeminiChatRequest{
				GenerationConfig: dto.GeminiChatGenerationConfig{
					CandidateCount: test.count,
					ImageConfig:    test.config,
				},
			}
			info := imagePricingRelayInfo(request, "gemini-image-model", relayconstant.Path2RelayMode(requestPath))
			ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
			ctx.Request = httptest.NewRequest(http.MethodPost, requestPath, nil)

			priceData, err := ModelPriceHelper(ctx, info, 1, request.GetTokenCountMeta())
			require.NoError(t, err)
			assert.Equal(t, test.resolution, priceData.ImageResolution)
			assert.Equal(t, test.price, priceData.ModelPrice)
			assert.Equal(t, test.quota, priceData.QuotaToPreConsume)
		})
	}
}

func TestModelPriceHelperRejectsOversizedChatImageCount(t *testing.T) {
	prepareImageResolutionPrices(t, "chat-image-model")
	request := &dto.GeneralOpenAIRequest{
		Model: "chat-image-model",
		N:     common.GetPointer(dto.MaxImageN + 1),
	}
	info := imagePricingRelayInfo(request, "chat-image-model", relayconstant.RelayModeChatCompletions)
	ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
	ctx.Request = httptest.NewRequest(http.MethodPost, "/v1/chat/completions", strings.NewReader("{}"))

	_, err := ModelPriceHelper(ctx, info, 1, request.GetTokenCountMeta())
	require.Error(t, err)
	assert.Contains(t, err.Error(), "n must be an integer")
}

func TestModelPriceHelperRejectsOversizedGeminiImageCount(t *testing.T) {
	prepareImageResolutionPrices(t, "gemini-image-model")
	requestPath := "/v1beta/models/gemini-image-model:generateContent"
	request := &dto.GeminiChatRequest{
		GenerationConfig: dto.GeminiChatGenerationConfig{
			CandidateCount: common.GetPointer(dto.MaxImageN + 1),
		},
	}
	info := imagePricingRelayInfo(request, "gemini-image-model", relayconstant.Path2RelayMode(requestPath))
	ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
	ctx.Request = httptest.NewRequest(http.MethodPost, requestPath, nil)

	_, err := ModelPriceHelper(ctx, info, 1, request.GetTokenCountMeta())
	require.Error(t, err)
	assert.Contains(t, err.Error(), "candidateCount 必须是")
}

func imagePricingRelayInfo(request dto.Request, modelName string, relayMode int) *relaycommon.RelayInfo {
	return &relaycommon.RelayInfo{
		RelayMode:       relayMode,
		OriginModelName: modelName,
		UserGroup:       "default",
		UsingGroup:      "default",
		Request:         request,
	}
}

func prepareImageResolutionPrices(t *testing.T, modelName string) {
	t.Helper()
	gin.SetMode(gin.TestMode)
	originalQuotaPerUnit := common.QuotaPerUnit
	originalPrices := ratio_setting.ModelPrice2JSONString()
	common.QuotaPerUnit = 500_000
	t.Cleanup(func() {
		common.QuotaPerUnit = originalQuotaPerUnit
		require.NoError(t, ratio_setting.UpdateModelPriceByJSONString(originalPrices))
	})

	prices := ratio_setting.GetModelPriceMap()
	prices[modelName] = 0.01
	prices[ratio_setting.ImageResolutionPriceKey(modelName, "1k")] = 0.02
	prices[ratio_setting.ImageResolutionPriceKey(modelName, "2k")] = 0.04
	prices[ratio_setting.ImageResolutionPriceKey(modelName, "4k")] = 0.08
	data, err := common.Marshal(prices)
	require.NoError(t, err)
	require.NoError(t, ratio_setting.UpdateModelPriceByJSONString(string(data)))
}
