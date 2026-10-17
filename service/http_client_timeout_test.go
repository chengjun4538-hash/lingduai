package service

import (
	"context"
	"math"
	"net"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestRelayResponseHeaderTimeoutSettings(t *testing.T) {
	original := common.RelayResponseHeaderTimeout
	t.Cleanup(func() { common.RelayResponseHeaderTimeout = original })

	for _, tc := range []struct {
		name    string
		seconds int
		want    time.Duration
	}{
		{name: "零值关闭超时", seconds: 0, want: 0},
		{name: "负值关闭超时", seconds: -1, want: 0},
		{name: "秒数转换", seconds: 1800, want: 30 * time.Minute},
		{name: "超大配置不会溢出为短超时", seconds: math.MaxInt, want: time.Duration(math.MaxInt64/int64(time.Second)) * time.Second},
	} {
		t.Run(tc.name, func(t *testing.T) {
			common.RelayResponseHeaderTimeout = tc.seconds
			transport := newRelayHTTPTransport()
			t.Cleanup(transport.CloseIdleConnections)
			assert.Equal(t, tc.want, transport.ResponseHeaderTimeout)
		})
	}
}

func TestRelayResponseHeaderTimeoutReleasesStalledRequest(t *testing.T) {
	original := common.RelayResponseHeaderTimeout
	common.RelayResponseHeaderTimeout = 1
	t.Cleanup(func() { common.RelayResponseHeaderTimeout = original })

	// 模拟上游已接收请求却始终不返回响应头；客户端断开后服务端也应结束等待。
	server := httptest.NewServer(http.HandlerFunc(func(_ http.ResponseWriter, r *http.Request) {
		<-r.Context().Done()
	}))
	t.Cleanup(server.Close)
	transport := newRelayHTTPTransport()
	t.Cleanup(transport.CloseIdleConnections)
	client := &http.Client{Transport: transport}

	// 外层截止时间仅防止回归时测试挂起，断言必须由响应头超时提前终止请求。
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	t.Cleanup(cancel)
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, server.URL, nil)
	require.NoError(t, err)
	response, err := client.Do(request)
	if response != nil {
		response.Body.Close()
	}
	require.Error(t, err)
	var timeoutError net.Error
	require.ErrorAs(t, err, &timeoutError)
	assert.True(t, timeoutError.Timeout())
	assert.NoError(t, ctx.Err(), "应由响应头超时释放请求，而不是依赖外层截止时间")
}
