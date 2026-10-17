package helper

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	relayconstant "github.com/QuantumNous/new-api/relay/constant"
	"github.com/QuantumNous/new-api/relaykit/types"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGrsaiImageResolutionPreconsume(t *testing.T) {
	prepareImageResolutionPrices(t, "banana-alias")
	for _, test := range []struct {
		name       string
		fields     string
		resolution string
		quota      int
	}{
		{"默认按 1K 预扣", ``, "1k", 10000},
		{"尺寸档位按 2K 预扣", `,"size":"2K"`, "2k", 20000},
		{"原生别名按 4K 预扣", `,"imageSize":"4K"`, "4k", 40000},
		{"下划线别名按 2K 预扣", `,"image_size":"2k"`, "2k", 20000},
		{"像素尺寸与别名一致", `,"size":"2048x2048","imageSize":"2K"`, "2k", 20000},
	} {
		t.Run(test.name, func(t *testing.T) {
			ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
			ctx.Request = httptest.NewRequest(http.MethodPost, "/v1/images/generations", strings.NewReader(`{"model":"banana-alias","prompt":"猫"`+test.fields+`}`))
			ctx.Request.Header.Set("Content-Type", "application/json")
			common.SetContextKey(ctx, constant.ContextKeyChannelType, constant.ChannelTypeGrsai)
			request, err := GetAndValidOpenAIImageRequest(ctx, relayconstant.RelayModeImagesGenerations)
			require.NoError(t, err)
			info := imagePricingRelayInfo(request, "banana-alias", relayconstant.RelayModeImagesGenerations)
			price, err := ModelPriceHelper(ctx, info, 1, request.GetTokenCountMeta())
			require.NoError(t, err)
			assert.Equal(t, test.resolution, price.ImageResolution)
			assert.Equal(t, test.quota, price.QuotaToPreConsume)
			assert.Equal(t, 1.0, price.OtherRatios()["n"])
		})
	}
}

func TestGrsaiImageRequestRejectsInvalidParameters(t *testing.T) {
	for _, test := range []struct{ name, fields string }{
		{"拒绝多张", `,"n":2`},
		{"拒绝显式零张", `,"n":0`},
		{"拒绝整数溢出数量", `,"n":18446744073686646784`},
		{"拒绝负数", `,"n":-1`},
		{"拒绝流式", `,"stream":true`},
		{"拒绝异步", `,"replyType":"async"`},
		{"拒绝 Base64 输出", `,"response_format":"b64_json"`},
		{"拒绝尺寸档位冲突", `,"size":"1K","imageSize":"4K"`},
		{"拒绝别名冲突", `,"image_size":"1K","imageSize":"4K"`},
		{"拒绝非法档位", `,"imageSize":"8K"`},
		{"拒绝空档位", `,"imageSize":null`},
		{"拒绝像素乘法溢出", `,"size":"9223372036854775807x2"`},
	} {
		t.Run(test.name, func(t *testing.T) {
			ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
			ctx.Request = httptest.NewRequest(http.MethodPost, "/v1/images/generations", strings.NewReader(`{"model":"nano-banana-2","prompt":"猫"`+test.fields+`}`))
			ctx.Request.Header.Set("Content-Type", "application/json")
			common.SetContextKey(ctx, constant.ContextKeyChannelType, constant.ChannelTypeGrsai)
			_, err := GetAndValidOpenAIImageRequest(ctx, relayconstant.RelayModeImagesGenerations)
			var apiErr *types.NewAPIError
			require.ErrorAs(t, err, &apiErr)
			assert.Equal(t, http.StatusBadRequest, apiErr.StatusCode)
			assert.True(t, types.IsSkipRetryError(apiErr))
		})
	}
}
