package pac

import (
	"strings"
	"testing"
)

func TestGenerate(t *testing.T) {
	got := Generate([]string{"api.example.com"}, "127.0.0.1:8080")
	for _, want := range []string{`dnsDomainIs(host, "api.example.com")`, `"PROXY 127.0.0.1:8080"`, `return "DIRECT"`} {
		if !strings.Contains(got, want) {
			t.Fatalf("generated PAC missing %q:\n%s", want, got)
		}
	}
}
