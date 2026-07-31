package helper

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	relayconstant "github.com/QuantumNous/new-api/relay/constant"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
	"github.com/gin-gonic/gin"
)

func TestModelPriceHelperUsesImageResolutionPriceForGenerationAndEdit(t *testing.T) {
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
	setImageResolutionTestPrices(t, "image-model")

	for _, tt := range []struct {
		name      string
		relayMode int
	}{
		{name: "图片生成", relayMode: relayconstant.RelayModeImagesGenerations},
		{name: "图片编辑", relayMode: relayconstant.RelayModeImagesEdits},
	} {
		t.Run(tt.name, func(t *testing.T) {
			n := uint(2)
			request := &dto.ImageRequest{
				Model: "image-model",
				Size:  "2048x2048",
				N:     &n,
			}
			info := &relaycommon.RelayInfo{
				RelayMode:       tt.relayMode,
				OriginModelName: "image-model",
				UserGroup:       "default",
				UsingGroup:      "default",
				Request:         request,
			}
			ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
			ctx.Request = httptest.NewRequest(http.MethodPost, "/v1/images/generations", nil)

			priceData, err := ModelPriceHelper(ctx, info, 1, request.GetTokenCountMeta())
			if err != nil {
				t.Fatalf("ModelPriceHelper() error = %v", err)
			}
			if priceData.ImageResolution != "2k" {
				t.Fatalf("ImageResolution = %q, want 2k", priceData.ImageResolution)
			}
			if priceData.ImagePixels != 4_194_304 {
				t.Fatalf("ImagePixels = %d, want 4194304", priceData.ImagePixels)
			}
			if priceData.ModelPrice != 0.04 {
				t.Fatalf("ModelPrice = %v, want 0.04", priceData.ModelPrice)
			}
			if priceData.QuotaToPreConsume != 40_000 {
				t.Fatalf("QuotaToPreConsume = %d, want 40000", priceData.QuotaToPreConsume)
			}
			if priceData.OtherRatios["n"] != 2 {
				t.Fatalf("n ratio = %v, want 2", priceData.OtherRatios["n"])
			}
		})
	}
}

func TestModelPriceHelperDefaultsMissingImageSizeToOneKWithoutMutatingRequest(t *testing.T) {
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
	setImageResolutionTestPrices(t, "image-model")

	request := &dto.ImageRequest{Model: "image-model"}
	info := &relaycommon.RelayInfo{
		RelayMode:       relayconstant.RelayModeImagesGenerations,
		OriginModelName: "image-model",
		UserGroup:       "default",
		UsingGroup:      "default",
		Request:         request,
	}
	ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
	ctx.Request = httptest.NewRequest(http.MethodPost, "/v1/images/generations", nil)

	priceData, err := ModelPriceHelper(ctx, info, 1, request.GetTokenCountMeta())
	if err != nil {
		t.Fatalf("ModelPriceHelper() error = %v", err)
	}
	if priceData.ImageResolution != "1k" {
		t.Fatalf("ImageResolution = %q, want 1k", priceData.ImageResolution)
	}
	if priceData.ModelPrice != 0.02 {
		t.Fatalf("ModelPrice = %v, want 0.02", priceData.ModelPrice)
	}
	if priceData.QuotaToPreConsume != 10_000 {
		t.Fatalf("QuotaToPreConsume = %d, want 10000", priceData.QuotaToPreConsume)
	}
	if request.Size != "" {
		t.Fatalf("request.Size = %q, want empty", request.Size)
	}
}

func setImageResolutionTestPrices(t *testing.T, modelName string) {
	t.Helper()
	modelPrices := ratio_setting.GetModelPriceMap()
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
