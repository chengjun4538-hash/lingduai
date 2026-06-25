package vidu

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/service"
	"github.com/gin-gonic/gin"
)

func TestNativeReference2VideoRequestDefaultsDuration(t *testing.T) {
	gin.SetMode(gin.TestMode)

	c := newNativeViduContext(`{"model":"viduq3","images":["https://example.com/a.png"],"resolution":"720p"}`)
	info := &relaycommon.RelayInfo{}
	adaptor := &TaskAdaptor{}

	if taskErr := adaptor.validateNativeReference2Video(c, info); taskErr != nil {
		t.Fatalf("validateNativeReference2Video returned error: %v", taskErr)
	}
	if info.Action != constant.TaskActionReferenceGenerate {
		t.Fatalf("action = %q, want %q", info.Action, constant.TaskActionReferenceGenerate)
	}
	req, err := relaycommon.GetTaskRequest(c)
	if err != nil {
		t.Fatalf("GetTaskRequest returned error: %v", err)
	}
	if req.Duration != 5 {
		t.Fatalf("duration = %d, want 5", req.Duration)
	}
	if req.Resolution != "720p" {
		t.Fatalf("resolution = %q, want 720p", req.Resolution)
	}
}

func TestBuildNativeReference2VideoBodyPreservesFields(t *testing.T) {
	gin.SetMode(gin.TestMode)

	c := newNativeViduContext(`{"model":"viduq3","images":["https://example.com/a.png"],"resolution":"540p","duration":0,"movement_amplitude":"auto"}`)
	info := &relaycommon.RelayInfo{ChannelMeta: &relaycommon.ChannelMeta{UpstreamModelName: "viduq3"}}
	adaptor := &TaskAdaptor{}

	bodyReader, err := adaptor.buildNativeReference2VideoBody(c, info)
	if err != nil {
		t.Fatalf("buildNativeReference2VideoBody returned error: %v", err)
	}
	body, err := io.ReadAll(bodyReader)
	if err != nil {
		t.Fatalf("read body returned error: %v", err)
	}

	var payload map[string]any
	if err := common.Unmarshal(body, &payload); err != nil {
		t.Fatalf("unmarshal body returned error: %v", err)
	}
	if payload["duration"].(float64) != 5 {
		t.Fatalf("duration = %v, want 5", payload["duration"])
	}
	if payload["movement_amplitude"] != "auto" {
		t.Fatalf("movement_amplitude = %v, want auto", payload["movement_amplitude"])
	}
	if payload["model"] != "viduq3" {
		t.Fatalf("model = %v, want viduq3", payload["model"])
	}
}

func TestRewriteNativeTaskID(t *testing.T) {
	body := rewriteNativeTaskID([]byte(`{"task_id":"upstream","state":"created"}`), "task_public")

	var payload map[string]any
	if err := common.Unmarshal(body, &payload); err != nil {
		t.Fatalf("unmarshal body returned error: %v", err)
	}
	if payload["task_id"] != "task_public" {
		t.Fatalf("task_id = %v, want task_public", payload["task_id"])
	}
}

func TestFetchTaskWithHeaderOverride(t *testing.T) {
	service.InitHttpClient()

	type capturedRequest struct {
		header http.Header
		path   string
	}
	requestCh := make(chan capturedRequest, 1)
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestCh <- capturedRequest{
			header: r.Header.Clone(),
			path:   r.URL.Path,
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"state":"success","creations":[]}`))
	}))
	defer server.Close()

	adaptor := &TaskAdaptor{}
	resp, err := adaptor.FetchTaskWithHeaderOverride(
		server.URL,
		"sk-test",
		map[string]any{"task_id": "task_123"},
		"",
		map[string]string{
			"Authorization": "Bearer sk-test",
			"X-Upstream":    "yunwu",
		},
	)
	if err != nil {
		t.Fatalf("FetchTaskWithHeaderOverride returned error: %v", err)
	}
	if resp != nil && resp.Body != nil {
		_ = resp.Body.Close()
	}

	request := <-requestCh
	if request.path != "/ent/v2/tasks/task_123/creations" {
		t.Fatalf("path = %q, want /ent/v2/tasks/task_123/creations", request.path)
	}
	if request.header.Get("Authorization") != "Bearer sk-test" {
		t.Fatalf("Authorization = %q, want Bearer sk-test", request.header.Get("Authorization"))
	}
	if request.header.Get("X-Upstream") != "yunwu" {
		t.Fatalf("X-Upstream = %q, want yunwu", request.header.Get("X-Upstream"))
	}
}

func newNativeViduContext(body string) *gin.Context {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/ent/v2/reference2video", strings.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")
	return c
}
