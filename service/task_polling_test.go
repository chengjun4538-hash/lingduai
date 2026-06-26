package service

import "testing"

func TestResolveTaskPollingHeaderOverride(t *testing.T) {
	headers := resolveTaskPollingHeaderOverride(map[string]interface{}{
		"Authorization": "Bearer {api_key}",
		"X-Empty":       "  ",
		"X-Number":      1,
	}, "sk-test")

	if headers["Authorization"] != "Bearer sk-test" {
		t.Fatalf("Authorization = %q, want Bearer sk-test", headers["Authorization"])
	}
	if _, ok := headers["X-Empty"]; ok {
		t.Fatal("expected empty header to be skipped")
	}
	if _, ok := headers["X-Number"]; ok {
		t.Fatal("expected non-string header to be skipped")
	}
}
