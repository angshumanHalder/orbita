package proxy

import (
	"crypto/tls"
	"net/http/httptest"
	"testing"
)

func TestWebSocketTargetURL(t *testing.T) {
	for raw, want := range map[string]string{
		"ws://example.com/socket?q=1":    "ws://example.com/socket?q=1",
		"https://example.com/socket?q=1": "wss://example.com/socket?q=1",
	} {
		r := httptest.NewRequest("GET", raw, nil)
		got := websocketURL(r)
		if got != want {
			t.Fatalf("%s: got %s, want %s", raw, got, want)
		}
	}
	r := httptest.NewRequest("GET", "/socket", nil)
	r.Host = "example.com"
	r.TLS = &tls.ConnectionState{}
	if got := websocketURL(r); got != "wss://example.com/socket" {
		t.Fatalf("origin form: got %s", got)
	}
}
