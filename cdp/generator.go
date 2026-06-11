package cdp

import (
	"fmt"
	"strings"
)

func GeneratePlaywright(session *RecordSession) string {
	if session == nil || len(session.Events) == 0 {
		return ""
	}

	var sb strings.Builder

	sb.WriteString("import { test, expect } from '@playwright/test';\n\n")
	sb.WriteString("test('recorded session', async ({ page}) => {\n")

	for _, env := range session.Events {
		switch env.Type {
		case EventNavigation:
			fmt.Fprintf(&sb, "	await page.goto('%s');\n", env.Navigation.URL)
		case EventClick:
			fmt.Fprintf(&sb, "	await page.click('%s');\n", env.Click.Selector)
		case EventInput:
			if env.Input.Masked {
				fmt.Fprintf(&sb, "	await page.fill('%s', process.env.SECRET || '');\n", env.Input.Selector)
			} else {
				fmt.Fprintf(&sb, "	await page.fill('%s', '%s');\n", env.Input.Selector, env.Input.Value)
			}
		case EventNetwork:
			fmt.Fprintf(&sb, "	// network: %s %s -> %d\n", env.Network.Method, env.Network.URL, env.Network.Status)
		}
	}
	sb.WriteString("});\n")
	return sb.String()
}
