package cdp

import (
	"strings"
	"testing"
)

func TestGeneratePlaywright(t *testing.T) {
	session := &RecordSession{Events: []Event{
		{Type: EventNavigation, Navigation: &NavigationEvent{URL: "https://example.com"}},
		{Type: EventClick, Click: &ClickEvent{Selector: "#submit"}},
		{Type: EventInput, Input: &InputEvent{Selector: "#password", Masked: true}},
	}}
	got := GeneratePlaywright(session)
	for _, want := range []string{"page.goto('https://example.com')", "page.click('#submit')", "process.env.SECRET"} {
		if !strings.Contains(got, want) {
			t.Fatalf("generated test missing %q:\n%s", want, got)
		}
	}
}
