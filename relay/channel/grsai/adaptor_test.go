package grsai

import (
	"bytes"
	"io"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/QuantumNous/new-api/common"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	relayconstant "github.com/QuantumNous/new-api/relay/constant"
	"github.com/QuantumNous/new-api/relaykit/dto"
	"github.com/QuantumNous/new-api/relaykit/types"
	hosttypes "github.com/QuantumNous/new-api/types"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestConvertImageRequest(t *testing.T) {
	for _, test := range []struct{ name, input, want string }{
		{
			"默认同步返回链接",
			`{"model":"nano-banana-2","prompt":"猫"}`,
			`{"model":"nano-banana-2","prompt":"猫","aspectRatio":"auto","imageSize":"1K","replyType":"json"}`,
		},
		{
			"保留参考图并映射尺寸和比例",
			`{"model":"nano-banana-pro","prompt":"猫","size":"2K","aspect_ratio":"16:9","images":["https://example.com/input.png","data:image/png;base64,aGVsbG8="],"response_format":"url","n":1,"stream":false}`,
			`{"model":"nano-banana-pro","prompt":"猫","aspectRatio":"16:9","imageSize":"2K","replyType":"json","images":["https://example.com/input.png","data:image/png;base64,aGVsbG8="]}`,
		},
		{
			"转换像素尺寸和单张参考图",
			`{"model":"nano-banana-2","prompt":"猫","size":"1536x1024","image":"https://example.com/input.png"}`,
			`{"model":"nano-banana-2","prompt":"猫","aspectRatio":"3:2","imageSize":"1K","replyType":"json","images":["https://example.com/input.png"]}`,
		},
		{
			"支持原生参数与第二代超宽比例",
			`{"model":"nano-banana-2","prompt":"猫","imageSize":"4K","aspectRatio":"8:1"}`,
			`{"model":"nano-banana-2","prompt":"猫","aspectRatio":"8:1","imageSize":"4K","replyType":"json"}`,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			var request dto.ImageRequest
			require.NoError(t, common.UnmarshalJsonStr(test.input, &request))
			adaptor := &Adaptor{}
			converted, err := adaptor.ConvertImageRequest(nil, &relaycommon.RelayInfo{RelayMode: relayconstant.RelayModeImagesGenerations}, request)
			require.NoError(t, err)
			body, err := common.Marshal(converted)
			require.NoError(t, err)
			assert.JSONEq(t, test.want, string(body))
		})
	}
}

func TestConvertImageRequestRejectsUnsupportedInput(t *testing.T) {
	for _, input := range []string{
		`{"model":"gpt-image-1","prompt":"猫"}`,
		`{"model":"nano-banana","prompt":"猫","aspectRatio":"8:1"}`,
		`{"model":"nano-banana-2","prompt":"猫","aspect_ratio":"invalid"}`,
		`{"model":"nano-banana-2","prompt":"猫","aspectRatio":"1:1","aspect_ratio":"16:9"}`,
		`{"model":"nano-banana-2","prompt":"猫","images":[123]}`,
		`{"model":"nano-banana-2","prompt":"猫","images":[""]}`,
		`{"model":"nano-banana-2","prompt":"猫","image":"a","images":["b"]}`,
	} {
		t.Run(input, func(t *testing.T) {
			var request dto.ImageRequest
			require.NoError(t, common.UnmarshalJsonStr(input, &request))
			_, err := (&Adaptor{}).ConvertImageRequest(nil, &relaycommon.RelayInfo{RelayMode: relayconstant.RelayModeImagesGenerations}, request)
			var apiErr *types.NewAPIError
			require.ErrorAs(t, err, &apiErr)
			assert.Equal(t, http.StatusBadRequest, apiErr.StatusCode)
			assert.True(t, types.IsSkipRetryError(apiErr))
		})
	}
}

func TestImageRoundTripReturnsURLWithoutDownloading(t *testing.T) {
	var downloads atomic.Int32
	imageServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		downloads.Add(1)
		w.WriteHeader(http.StatusTeapot)
	}))
	defer imageServer.Close()
	imageURL := imageServer.URL + "/image.png"
	requests := make(chan *http.Request, 1)
	bodies := make(chan []byte, 1)
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		requests <- r
		bodies <- body
		w.Header().Set("Content-Type", "application/json")
		_, _ = io.WriteString(w, `{"id":"task-1","status":"succeeded","results":[{"url":"`+imageURL+`"}]}`)
	}))
	defer upstream.Close()

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/v1/images/generations", nil)
	info := &relaycommon.RelayInfo{
		RelayMode:   relayconstant.RelayModeImagesGenerations,
		StartTime:   time.Unix(1700000000, 0),
		ChannelMeta: &relaycommon.ChannelMeta{ChannelBaseUrl: upstream.URL + "/", ApiKey: "test-key"},
		PriceData:   hosttypes.PriceData{UsePrice: true, ImageResolution: "2k"},
	}
	adaptor := &Adaptor{}
	converted, err := adaptor.ConvertImageRequest(ctx, info, dto.ImageRequest{Model: "nano-banana-2", Prompt: "猫", Size: "2K"})
	require.NoError(t, err)
	body, err := common.Marshal(converted)
	require.NoError(t, err)
	response, err := adaptor.DoRequest(ctx, info, bytes.NewReader(body))
	require.NoError(t, err)
	usage, apiErr := adaptor.DoResponse(ctx, response.(*http.Response), info)
	require.Nil(t, apiErr)
	assert.Equal(t, &dto.Usage{}, usage)
	var result dto.ImageResponse
	require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &result))
	assert.EqualValues(t, 1700000000, result.Created)
	require.Len(t, result.Data, 1)
	assert.Equal(t, imageURL, result.Data[0].Url)
	assert.Empty(t, result.Data[0].B64Json)
	assert.Equal(t, 1.0, info.PriceData.OtherRatios()["n"])
	assert.Zero(t, downloads.Load(), "返回链接不应触发网关下载图片")
	request := <-requests
	assert.Equal(t, "/v1/api/generate", request.URL.Path)
	assert.Equal(t, http.MethodPost, request.Method)
	assert.Equal(t, "Bearer test-key", request.Header.Get("Authorization"))
	assert.Equal(t, "application/json", request.Header.Get("Content-Type"))
	assert.Equal(t, "application/json", request.Header.Get("Accept"))
	assert.JSONEq(t, `{"model":"nano-banana-2","prompt":"猫","imageSize":"2K","aspectRatio":"auto","replyType":"json"}`, string(<-bodies))
}

func TestDoRequestRejectsUnsafeOverrides(t *testing.T) {
	for _, fields := range []string{
		`,"imageSize":"4K"`,
		`,"imageSize":"1K","n":2`,
		`,"imageSize":"1K","n":18446744073686646784`,
		`,"imageSize":"1K","replyType":"async"`,
		`,"imageSize":"1K","stream":true`,
	} {
		t.Run(fields, func(t *testing.T) {
			info := &relaycommon.RelayInfo{RelayMode: relayconstant.RelayModeImagesGenerations, PriceData: hosttypes.PriceData{UsePrice: true}}
			adaptor := &Adaptor{}
			_, err := adaptor.ConvertImageRequest(nil, info, dto.ImageRequest{Model: "nano-banana-2", Prompt: "猫"})
			require.NoError(t, err)
			_, err = adaptor.DoRequest(nil, info, strings.NewReader(`{"model":"nano-banana-2","prompt":"猫"`+fields+`}`))
			var apiErr *types.NewAPIError
			require.ErrorAs(t, err, &apiErr)
			assert.Equal(t, http.StatusBadRequest, apiErr.StatusCode)
			assert.True(t, types.IsSkipRetryError(apiErr))
		})
	}
}

func TestImageResponseRejectsFailedOrEmptyResults(t *testing.T) {
	for _, test := range []struct {
		name, body string
		status     int
	}{
		{"任务失败", `{"status":"failed","error":"generation failed"}`, 502},
		{"内容违规", `{"status":"violation","error":"blocked"}`, 400},
		{"意外异步响应", `{"status":"running","id":"task-1"}`, 502},
		{"空结果", `{"status":"succeeded","results":[]}`, 502},
		{"空 URL", `{"status":"succeeded","results":[{"url":""}]}`, 502},
		{"非 URL 结果", `{"status":"succeeded","results":[{"url":"data:image/png;base64,aGVsbG8="}]}`, 502},
		{"无效 JSON", `not json`, 502},
	} {
		t.Run(test.name, func(t *testing.T) {
			recorder := httptest.NewRecorder()
			ctx, _ := gin.CreateTestContext(recorder)
			resp := &http.Response{StatusCode: 200, Body: io.NopCloser(strings.NewReader(test.body))}
			usage, err := (&Adaptor{}).DoResponse(ctx, resp, &relaycommon.RelayInfo{})
			require.NotNil(t, err)
			assert.Nil(t, usage)
			assert.Equal(t, test.status, err.StatusCode)
			assert.True(t, types.IsSkipRetryError(err))
			assert.Empty(t, recorder.Body.String(), "失败响应不能先写成功正文，否则会错误结算")
		})
	}
}

func TestDoRequestPreservesHTTPErrorAndSkipsRetry(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusBadRequest)
		_, _ = io.WriteString(w, `{"status":"failed","error":"generate failed"}`)
	}))
	defer upstream.Close()
	ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
	ctx.Request = httptest.NewRequest(http.MethodPost, "/v1/images/generations", nil)
	info := &relaycommon.RelayInfo{
		RelayMode:   relayconstant.RelayModeImagesGenerations,
		ChannelMeta: &relaycommon.ChannelMeta{ChannelBaseUrl: upstream.URL},
		PriceData:   hosttypes.PriceData{UsePrice: true},
	}
	adaptor := &Adaptor{}
	converted, err := adaptor.ConvertImageRequest(ctx, info, dto.ImageRequest{Model: "nano-banana-2", Prompt: "猫"})
	require.NoError(t, err)
	body, err := common.Marshal(converted)
	require.NoError(t, err)
	_, err = adaptor.DoRequest(ctx, info, bytes.NewReader(body))
	var apiErr *types.NewAPIError
	require.ErrorAs(t, err, &apiErr)
	assert.Equal(t, http.StatusBadRequest, apiErr.StatusCode)
	assert.Contains(t, apiErr.Error(), "generate failed")
	assert.True(t, types.IsSkipRetryError(apiErr))
}

func TestImageResponseBoundsActualBillingCount(t *testing.T) {
	for _, count := range []int{2, dto.MaxImageN + 1} {
		t.Run(strconv.Itoa(count), func(t *testing.T) {
			recorder := httptest.NewRecorder()
			ctx, _ := gin.CreateTestContext(recorder)
			results := strings.TrimSuffix(strings.Repeat(`{"url":"https://example.com/image.png"},`, count), ",")
			resp := &http.Response{StatusCode: http.StatusOK, Body: io.NopCloser(strings.NewReader(`{"status":"succeeded","results":[` + results + `]}`))}
			info := &relaycommon.RelayInfo{PriceData: hosttypes.PriceData{UsePrice: true}}
			_, err := (&Adaptor{}).DoResponse(ctx, resp, info)
			if count > dto.MaxImageN {
				require.NotNil(t, err)
				assert.Equal(t, http.StatusBadGateway, err.StatusCode)
				assert.Empty(t, info.PriceData.OtherRatios())
				assert.Empty(t, recorder.Body.String())
				return
			}
			require.Nil(t, err)
			assert.Equal(t, float64(count), info.PriceData.OtherRatios()["n"])
			var response dto.ImageResponse
			require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &response))
			assert.Len(t, response.Data, count)
		})
	}
}

func TestDoRequestRequiresConversionAndFixedPricing(t *testing.T) {
	info := &relaycommon.RelayInfo{RelayMode: relayconstant.RelayModeImagesGenerations}
	adaptor := &Adaptor{}
	_, err := adaptor.DoRequest(nil, info, nil)
	require.ErrorContains(t, err, "关闭请求体透传")

	_, err = adaptor.ConvertImageRequest(nil, info, dto.ImageRequest{Model: "nano-banana-2", Prompt: "猫"})
	require.NoError(t, err)
	_, err = adaptor.DoRequest(nil, info, nil)
	require.ErrorContains(t, err, "配置按次或分辨率价格")
}

func TestConvertImageRequestRejectsMismatchedPrecharge(t *testing.T) {
	info := &relaycommon.RelayInfo{
		RelayMode: relayconstant.RelayModeImagesGenerations,
		PriceData: hosttypes.PriceData{UsePrice: true, ImageResolution: "1k"},
	}
	_, err := (&Adaptor{}).ConvertImageRequest(nil, info, dto.ImageRequest{Model: "nano-banana-2", Prompt: "猫", Size: "4K"})
	require.ErrorContains(t, err, "预扣费档位不一致")
}
