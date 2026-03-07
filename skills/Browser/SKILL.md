---
name: Browser
description: Debug-first browser automation with always-on visibility. Console logs, network requests, and errors captured by default. USE WHEN browser, screenshot, debug web, verify UI, troubleshoot frontend.
version: 3.0.0
---

## Customization

**Before executing, check for user customizations at:**
`~/.claude/skills/PAI/USER/SKILLCUSTOMIZATIONS/Browser/`

If this directory exists, load and apply any PREFERENCES.md, configurations, or resources found there. These override default behavior. If the directory does not exist, proceed with skill defaults.


## 🚨 MANDATORY: Voice Notification (REQUIRED BEFORE ANY ACTION)

**You MUST send this notification BEFORE doing anything else when this skill is invoked.**

1. **Send voice notification**:
   ```bash
   curl -s -X POST http://localhost:8888/notify \
     -H "Content-Type: application/json" \
     -d '{"message": "Running the WORKFLOWNAME workflow in the Browser skill to ACTION"}' \
     > /dev/null 2>&1 &
   ```

2. **Output text notification**:
   ```
   Running the **WorkflowName** workflow in the **Browser** skill to ACTION...
   ```

**This is not optional. Execute this curl command immediately upon skill invocation.**

# Browser v3.0.0 - playwright-cli First

**Default browser tool: `playwright-cli`** — token-efficient CLI that avoids loading accessibility trees and verbose schemas into context. Prefer it over the legacy BrowserSession approach for all standard browser tasks.

The legacy `bun run Browse.ts` tools remain available for diagnostics-heavy workflows (console log capture, network analysis) where their always-on debug visibility adds value.

---

## Philosophy

**playwright-cli is the default.** It is more token-efficient than both Playwright MCP and the legacy BrowserSession approach. Use it for navigation, interaction, screenshots, and form flows.

Use the legacy `Browse.ts` tools when you specifically need:
- Automatic console error/warning capture across a session
- Network request statistics and failure analysis
- The "load page and see all issues at once" debug workflow

**Headless by default.** Pass `--headed` to `open` when the user wants to see the browser.

---

## Quick Start (playwright-cli — DEFAULT)

```bash
# Open and navigate
playwright-cli open https://example.com

# Take a snapshot (see element refs)
playwright-cli snapshot

# Interact using element refs from snapshot
playwright-cli click e15
playwright-cli fill e5 "user@example.com"
playwright-cli press Enter

# Screenshot
playwright-cli screenshot

# Console and network debug
playwright-cli console
playwright-cli network

# Close
playwright-cli close
```

Session state is kept in memory between CLI calls. No explicit session management needed.

---

## Common Commands (playwright-cli)

### Navigation
```bash
playwright-cli open https://example.com
playwright-cli open https://example.com --headed    # visible browser
playwright-cli goto https://other.com
playwright-cli go-back
playwright-cli go-forward
playwright-cli reload
playwright-cli close
```

### Interaction
```bash
playwright-cli snapshot                      # get element refs
playwright-cli click e3                      # click by ref
playwright-cli fill e5 "text"                # fill input
playwright-cli type "text"                   # type into active element
playwright-cli press Enter
playwright-cli check e12
playwright-cli select e9 "value"
playwright-cli hover e4
playwright-cli drag e2 e8
```

### Screenshots & Capture
```bash
playwright-cli screenshot
playwright-cli screenshot --filename=page.png
playwright-cli pdf --filename=page.pdf
playwright-cli console                       # console messages
playwright-cli console warning               # warnings only
playwright-cli network                       # network requests
```

### Sessions (multi-project)
```bash
playwright-cli -s=myproject open https://example.com
playwright-cli -s=myproject click e6
playwright-cli list                          # list sessions
playwright-cli close-all
playwright-cli kill-all                      # force kill stale sessions
```

### Storage
```bash
playwright-cli cookie-list
playwright-cli localstorage-list
playwright-cli state-save auth.json
playwright-cli state-load auth.json
```

---

## Legacy Browse.ts (Diagnostics Mode)

Use when you need always-on console/network capture:

```bash
# Navigate with full diagnostics (errors, warnings, failed requests, network stats)
bun run ~/.claude/skills/Browser/Tools/Browse.ts https://example.com

# Query commands
bun run Browse.ts errors      # Console errors only
bun run Browse.ts network     # Network activity
bun run Browse.ts failed      # Failed requests (4xx, 5xx)

# Interaction
bun run Browse.ts click <selector>
bun run Browse.ts fill <selector> <value>
bun run Browse.ts screenshot [path]
bun run Browse.ts eval "<javascript>"
```

---

## Decision Guide

| Task | Use |
|------|-----|
| Navigate and interact with a page | `playwright-cli` |
| Fill forms, click buttons | `playwright-cli` |
| Screenshot a page | `playwright-cli screenshot` |
| Test web application flows | `playwright-cli` |
| Debug "why isn't this loading?" | `Browse.ts <url>` (full diagnostics) |
| Capture all console errors in a session | `Browse.ts` |
| Network request analysis | `playwright-cli network` or `Browse.ts network` |
| Multi-project sessions | `playwright-cli -s=<name>` |

---

## VERIFY Phase Integration

**MANDATORY for verifying web changes:**

```bash
# Quick verify with playwright-cli
playwright-cli open https://example.com/changed-page
playwright-cli screenshot
playwright-cli console    # check for errors

# Deep verify with Browse.ts (full diagnostics)
bun run Browse.ts https://example.com/changed-page
```

**If you haven't LOOKED at the rendered page and its diagnostics, you CANNOT claim it works.**
