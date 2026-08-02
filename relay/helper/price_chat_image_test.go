package helper

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	relayconstant "github.com/QuantumNous/new-api/relay/constant"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
	"github.com/gin-gonic/gin"
)

func TestModelPriceHelperUsesChatImageResolutionPrices(t *testing.T) {
	gin.SetMode(gin.TestMode)
	defaultPrice := 0.04
	prepareChatImagePricingTest(t, "chat-image-model", &defaultPrice)

	tests := []struct {
		name       string
		apply      func(*dto.GeneralOpenAIRequest)
		wantTier   string
		wantPixels int64
		wantPrice  float64
		wantQuota  int
		wantCount  float64
	}{
		{
			name: "size 像素尺寸",
			apply: func(request *dto.GeneralOpenAIRequest) {
				request.Size = "2048x2048"
				request.N = common.GetPointer(2)
			},
			wantTier:   "2k",
			wantPixels: 4_194_304,
			wantPrice:  0.04,
			wantQuota:  40_000,
			wantCount:  2,
		},
		{
			name: "output_resolution 档位",
			apply: func(request *dto.GeneralOpenAIRequest) {
				request.OutputResolution = common.GetPointer("4K")
			},
			wantTier:  "4k",
			wantPrice: 0.08,
			wantQuota: 40_000,
			wantCount: 1,
		},
		{
			name: "image_size 档位",
			apply: func(request *dto.GeneralOpenAIRequest) {
				request.ImageSize = common.GetPointer("1K")
			},
			wantTier:  "1k",
			wantPrice: 0.02,
			wantQuota: 10_000,
			wantCount: 1,
		},
		{
			name: "image_config 档位",
			apply: func(request *dto.GeneralOpenAIRequest) {
				request.ImageConfig = json.RawMessage(`{"image_size":"2K"}`)
			},
			wantTier:  "2k",
			wantPrice: 0.04,
			wantQuota: 20_000,
			wantCount: 1,
		},
		{
			name: "Gemini extra_body 档位",
			apply: func(request *dto.GeneralOpenAIRequest) {
				request.ExtraBody = json.RawMessage(`{"google":{"image_config":{"image_size":"4K"}}}`)
			},
			wantTier:  "4k",
			wantPrice: 0.08,
			wantQuota: 40_000,
			wantCount: 1,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			request := &dto.GeneralOpenAIRequest{Model: "chat-image-model"}
			tt.apply(request)
			info := newChatImagePricingRelayInfo(request)
			ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
			ctx.Request = httptest.NewRequest(http.MethodPost, "/v1/chat/completions", nil)

			priceData, err := ModelPriceHelper(ctx, info, 1, request.GetTokenCountMeta())
			if err != nil {
				t.Fatalf("ModelPriceHelper() error = %v", err)
			}
			if priceData.ImageResolution != tt.wantTier {
				t.Fatalf("ImageResolution = %q, want %q", priceData.ImageResolution, tt.wantTier)
			}
			if priceData.ImagePixels != tt.wantPixels {
				t.Fatalf("ImagePixels = %d, want %d", priceData.ImagePixels, tt.wantPixels)
			}
			if priceData.ModelPrice != tt.wantPrice {
				t.Fatalf("ModelPrice = %v, want %v", priceData.ModelPrice, tt.wantPrice)
			}
			if priceData.QuotaToPreConsume != tt.wantQuota {
				t.Fatalf("QuotaToPreConsume = %d, want %d", priceData.QuotaToPreConsume, tt.wantQuota)
			}
			if priceData.OtherRatios["n"] != tt.wantCount {
				t.Fatalf("n ratio = %v, want %v", priceData.OtherRatios["n"], tt.wantCount)
			}
		})
	}
}

func TestModelPriceHelperUsesDefaultPriceWhenChatImageSizeMissing(t *testing.T) {
	gin.SetMode(gin.TestMode)
	defaultPrice := 0.04
	prepareChatImagePricingTest(t, "chat-image-model", &defaultPrice)

	request := &dto.GeneralOpenAIRequest{
		Model:     "chat-image-model",
		N:         common.GetPointer(2),
		Size:      "16:9",
		ImageSize: common.GetPointer("auto"),
	}
	info := newChatImagePricingRelayInfo(request)
	ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
	ctx.Request = httptest.NewRequest(http.MethodPost, "/v1/chat/completions", nil)

	priceData, err := ModelPriceHelper(ctx, info, 1, request.GetTokenCountMeta())
	if err != nil {
		t.Fatalf("ModelPriceHelper() error = %v", err)
	}
	if priceData.ImageResolution != "" {
		t.Fatalf("ImageResolution = %q, want empty", priceData.ImageResolution)
	}
	if priceData.ModelPrice != defaultPrice {
		t.Fatalf("ModelPrice = %v, want %v", priceData.ModelPrice, defaultPrice)
	}
	if priceData.QuotaToPreConsume != 40_000 {
		t.Fatalf("QuotaToPreConsume = %d, want 40000", priceData.QuotaToPreConsume)
	}
	if priceData.OtherRatios["n"] != 2 {
		t.Fatalf("n ratio = %v, want 2", priceData.OtherRatios["n"])
	}
}

func TestModelPriceHelperRejectsChatImageResolutionConflicts(t *testing.T) {
	gin.SetMode(gin.TestMode)
	defaultPrice := 0.04
	prepareChatImagePricingTest(t, "chat-image-model", &defaultPrice)

	request := &dto.GeneralOpenAIRequest{
		Model:            "chat-image-model",
		Size:             "1024x1024",
		OutputResolution: common.GetPointer("4K"),
	}
	info := newChatImagePricingRelayInfo(request)
	ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
	ctx.Request = httptest.NewRequest(http.MethodPost, "/v1/chat/completions", nil)

	_, err := ModelPriceHelper(ctx, info, 1, request.GetTokenCountMeta())
	if err == nil || !strings.Contains(err.Error(), "图片计费分辨率字段冲突") {
		t.Fatalf("ModelPriceHelper() error = %v, want conflict error", err)
	}
}

func TestModelPriceHelperRequiresDefaultPriceWhenChatImageSizeMissing(t *testing.T) {
	gin.SetMode(gin.TestMode)
	prepareChatImagePricingTest(t, "chat-image-model", nil)

	request := &dto.GeneralOpenAIRequest{Model: "chat-image-model"}
	info := newChatImagePricingRelayInfo(request)
	ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
	ctx.Request = httptest.NewRequest(http.MethodPost, "/v1/chat/completions", nil)

	_, err := ModelPriceHelper(ctx, info, 1, request.GetTokenCountMeta())
	if err == nil || !strings.Contains(err.Error(), "默认价格未配置") {
		t.Fatalf("ModelPriceHelper() error = %v, want missing default price error", err)
	}
}

func TestModelPriceHelperLeavesOrdinaryChatPricingUnchanged(t *testing.T) {
	gin.SetMode(gin.TestMode)
	oldQuotaPerUnit := common.QuotaPerUnit
	oldModelPrice := ratio_setting.ModelPrice2JSONString()
	common.QuotaPerUnit = 500000
	t.Cleanup(func() {
		common.QuotaPerUnit = oldQuotaPerUnit
		if err := ratio_setting.UpdateModelPriceByJSONString(oldModelPrice); err != nil {
			t.Fatalf("恢复模型价格失败: %v", err)
		}
	})

	modelPrices := ratio_setting.GetModelPriceMap()
	modelPrices["ordinary-chat-model"] = 0.03
	data, err := common.Marshal(modelPrices)
	if err != nil {
		t.Fatalf("序列化模型价格失败: %v", err)
	}
	if err := ratio_setting.UpdateModelPriceByJSONString(string(data)); err != nil {
		t.Fatalf("更新模型价格失败: %v", err)
	}

	request := &dto.GeneralOpenAIRequest{
		Model: "ordinary-chat-model",
		Size:  "not-an-image-size",
	}
	info := newChatImagePricingRelayInfo(request)
	ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
	ctx.Request = httptest.NewRequest(http.MethodPost, "/v1/chat/completions", nil)

	priceData, err := ModelPriceHelper(ctx, info, 1, request.GetTokenCountMeta())
	if err != nil {
		t.Fatalf("ModelPriceHelper() error = %v", err)
	}
	if priceData.ImageResolution != "" {
		t.Fatalf("ImageResolution = %q, want empty", priceData.ImageResolution)
	}
	if priceData.QuotaToPreConsume != 15_000 {
		t.Fatalf("QuotaToPreConsume = %d, want 15000", priceData.QuotaToPreConsume)
	}
	if len(priceData.OtherRatios) != 0 {
		t.Fatalf("OtherRatios = %v, want empty", priceData.OtherRatios)
	}
}

func newChatImagePricingRelayInfo(request *dto.GeneralOpenAIRequest) *relaycommon.RelayInfo {
	return &relaycommon.RelayInfo{
		RelayMode:       relayconstant.RelayModeChatCompletions,
		OriginModelName: request.Model,
		UserGroup:       "default",
		UsingGroup:      "default",
		Request:         request,
	}
}

func prepareChatImagePricingTest(t *testing.T, modelName string, defaultPrice *float64) {
	t.Helper()
	oldQuotaPerUnit := common.QuotaPerUnit
	oldModelPrice := ratio_setting.ModelPrice2JSONString()
	common.QuotaPerUnit = 500000
	t.Cleanup(func() {
		common.QuotaPerUnit = oldQuotaPerUnit
		if err := ratio_setting.UpdateModelPriceByJSONString(oldModelPrice); err != nil {
			t.Fatalf("恢复模型价格失败: %v", err)
		}
	})

	modelPrices := ratio_setting.GetModelPriceMap()
	delete(modelPrices, modelName)
	if defaultPrice != nil {
		modelPrices[modelName] = *defaultPrice
	}
	modelPrices[ratio_setting.ImageResolutionPriceKey(modelName, "1k")] = 0.02
	modelPrices[ratio_setting.ImageResolutionPriceKey(modelName, "2k")] = 0.04
	modelPrices[ratio_setting.ImageResolutionPriceKey(modelName, "4k")] = 0.08
	data, err := common.Marshal(modelPrices)
	if err != nil {
		t.Fatalf("序列化模型价格失败: %v", err)
	}
	if err := ratio_setting.UpdateModelPriceByJSONString(string(data)); err != nil {
		t.Fatalf("更新模型价格失败: %v", err)
	}
}
