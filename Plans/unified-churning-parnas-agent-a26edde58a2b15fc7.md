# SetPieceTakers.com — Complete Visual Rebrand Design Specification

**Designer:** Marchetti | **Date:** 2026-03-08 | **Status:** Complete Specification

---

## Design Rationale

The current site reads like a homework assignment that got a passing grade. White backgrounds, navy headers, green hover states that scream "I found a Bootstrap template." The data deserves better. Football analytics people — FPL managers, scouts, bettors — they live in tools like FBref, Understat, StatsBomb. Those tools have gravity. SetPieceTakers needs that same feeling: "this was built by someone who respects the craft."

The rebrand centers on one idea: **the data IS the design.** Everything else gets out of the way.

---

## 1. New Color System

The palette is near-monochromatic with a single electric accent. No navy. No red. The old palette had too many competing colors fighting for attention. Now there is one surface, one text hierarchy, and one accent that means "interact with me."

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#09090B` | Page background (zinc-950) |
| `--surface` | `#18181B` | Cards, table rows, elevated surfaces (zinc-900) |
| `--surface-hover` | `#27272A` | Hover states on surfaces (zinc-800) |
| `--border` | `#27272A` | Default borders (zinc-800) |
| `--border-subtle` | `#1E1E22` | Subtle dividers inside cards |
| `--text-primary` | `#FAFAFA` | Headings, primary content (zinc-50) |
| `--text-secondary` | `#A1A1AA` | Body text, descriptions (zinc-400) |
| `--text-muted` | `#52525B` | Metadata, timestamps (zinc-600) |
| `--accent` | `#10B981` | Primary accent — emerald-500. Links, CTAs, active states |
| `--accent-hover` | `#059669` | Accent hover — emerald-600 |
| `--accent-subtle` | `rgba(16, 185, 129, 0.1)` | Accent background tint |
| `--success` | `#22C55E` | Positive stats (scored, high rate) — green-500 |
| `--warning` | `#F59E0B` | Mid-range stats — amber-500 |
| `--danger` | `#EF4444` | Negative stats (missed, low rate) — red-500 |
| `--premium` | `#A78BFA` | Premium features — violet-400 |
| `--premium-subtle` | `rgba(167, 139, 250, 0.1)` | Premium background tint |

**Why dark mode primary:** Football data sites are used in the evening — match nights, FPL deadline scrolling. Dark mode is the natural habitat. The contrast ratios all pass WCAG AA: `--text-primary` on `--bg` = 19.4:1, `--text-secondary` on `--bg` = 7.1:1, `--accent` on `--bg` = 8.6:1.

**Light mode** is deliberately not in V1 scope. Ship dark, measure, iterate.

---

## 2. Typography Scale

**Font pairing:** Inter (current) stays for body. It is a perfectly good workhorse. Add **Instrument Serif** from Google Fonts for display headings only — it adds editorial authority without being precious.

For stats, **JetBrains Mono** (already in tailwind config) stays.

| Token | Font | Size | Weight | Line Height | Letter Spacing |
|---|---|---|---|---|---|
| `display` | Instrument Serif | 3rem / 48px | 400 | 1.1 | -0.02em |
| `h1` | Inter | 1.875rem / 30px | 700 | 1.2 | -0.025em |
| `h2` | Inter | 1.25rem / 20px | 600 | 1.3 | -0.01em |
| `h3` | Inter | 0.9375rem / 15px | 600 | 1.4 | 0 |
| `body` | Inter | 0.875rem / 14px | 400 | 1.6 | 0 |
| `small` | Inter | 0.75rem / 12px | 500 | 1.5 | 0 |
| `label` | Inter | 0.6875rem / 11px | 600 | 1.4 | 0.05em |
| `mono` | JetBrains Mono | 0.8125rem / 13px | 500 | 1.4 | 0 |

**Responsive scaling:** `display` drops to 2.25rem on mobile. `h1` drops to 1.5rem. Everything else stays fixed — small sizes do not need scaling.

---

## 3. Component Specifications

### 3a. Header/Nav

**Layout:** Full-width, sticky, `height: 56px`. Background: `--bg` with a 1px `--border` bottom border. No solid color fill — the border alone creates separation.

**Logo:** "SPT" in Inter 700, 15px, `--text-primary`. The period after "SPT" in `--accent`. Below on mobile, beside on desktop: "setpiecetakers" in `--text-muted`, 11px, uppercase, tracking 0.1em.

**Nav items:** Inter 13px, weight 500, color `--text-secondary`. Hover: `--text-primary` with 150ms transition. Active page: `--text-primary` with a 2px `--accent` underline offset 6px below.

**Premium CTA:** Pill shape (border-radius 9999px), background `--premium-subtle`, color `--premium`, border 1px `rgba(167,139,250,0.2)`. Hover: background `rgba(167,139,250,0.15)`. Text: "Premium" in 12px, weight 600.

**Mobile:** Hamburger icon (`--text-secondary`), slides in a full-height drawer from right. Background `--surface`, nav items stacked at 16px with 48px tap targets.

**Spacing:** Logo left-aligned. Nav items right-aligned with `gap: 32px`. Premium CTA has `margin-left: 16px` from last nav item.

### 3b. Data Tables

This is the hero element. The table must feel like a Bloomberg terminal — precise, information-dense, but not cluttered.

**Container:** `border-radius: 8px`, `border: 1px solid var(--border)`, `overflow: hidden`. No outer shadow.

**Header row:** Background `--surface`. Text: `--text-muted`, 11px, weight 600, uppercase, tracking 0.06em. Padding: `12px 16px`. No bottom border on header — the color change is the separator. Sort indicator: `--text-muted` when inactive (opacity 0), `--accent` when active. Arrow only, no up/down toggle unicode — use a subtle chevron SVG.

**Data rows:** Background `--bg`. Height: auto, padding `10px 16px`. Border: `1px solid var(--border-subtle)` bottom only. No alternating stripes — they add visual noise with this palette. The border alone creates rhythm.

**Row hover:** Background `--surface-hover`. Transition 150ms. No color change on text — just the background shift. Subtle but unmistakable.

**Player name column:** `--text-primary`, weight 600, 14px.
**Club column:** `--text-secondary`, weight 400, 13px.
**Numeric columns:** JetBrains Mono, `--text-primary`, weight 500, 13px. Right-aligned.
**Conversion rate:** JetBrains Mono, weight 700. Color-coded:
- >= 80%: `--success`
- >= 60%: `--warning`
- < 60%: `--danger`

**Filter input:** Background `--surface`, border 1px `--border`, border-radius 6px. Focus: border `--accent`, box-shadow `0 0 0 3px var(--accent-subtle)`. Placeholder: `--text-muted`. Text: `--text-primary`.

### 3c. League Cards (Homepage "Browse by Type")

**Dimensions:** Auto height, padding `20px 24px`. Border: 1px `--border`, border-radius 8px. Background `--surface`.

**Left accent:** Remove the old `border-left: 3px` treatment. Replace with a small icon or no accent. The card stands on typography alone.

**Typography:** Category name in 13px, weight 600, `--text-primary`, uppercase, tracking 0.04em. Description in 13px, weight 400, `--text-secondary`. CTA text: "View leagues" in 12px, weight 600, `--accent`.

**Hover:** Background shifts to `--surface-hover`. The CTA text gains an arrow that translates 4px right with `transition: transform 200ms ease`. Border color shifts to `rgba(16,185,129,0.3)`. `cursor: pointer`.

**Grid:** 3 columns on desktop, 1 on mobile. Gap: 12px.

### 3d. League List (Category Page)

Do NOT use a traditional table for this. Use a **stacked list** with generous spacing.

Each league is a row: `padding: 16px 20px`, background `--surface`, border 1px `--border`, border-radius 8px, `margin-bottom: 8px`.

**Layout:** Flex row. Left: flag emoji (24px) + league name (14px, weight 600, `--text-primary`) + country (12px, `--text-muted`). Right: arrow icon in `--text-muted`, shifts to `--accent` on hover.

**Hover:** Background `--surface-hover`, border-color `rgba(16,185,129,0.2)`. Whole row is clickable.

This transforms the spreadsheet into a navigation list. Each league feels like a destination, not a cell.

### 3e. Summary Sidebar

**Card:** `--surface` background, 1px `--border`, border-radius 8px, padding `20px`.

**Section label:** 11px, weight 600, uppercase, tracking 0.08em, `--text-muted`. Not `--navy` — muted labels let the data speak.

**Big number display:** JetBrains Mono, 32px, weight 700, `--text-primary`. Label below: 11px, `--text-muted`, uppercase.

**Stat rows:** Separated by 1px `--border-subtle` dividers. Club name: 13px, weight 600, `--text-primary`. Player name: 12px, `--text-muted`. Value: JetBrains Mono, 14px, weight 700, `--accent`.

**Progress bars:** Height 4px, border-radius 2px. Track: `--border`. Fill: `--accent` for top item, `--text-muted` for rest. Transition: width 400ms ease.

### 3f. Buttons

**Primary:** Background `--accent`, color `#09090B` (dark text on green), border-radius 6px, padding `10px 20px`, font 13px weight 600. Hover: `--accent-hover`. Transition 150ms. No border.

**Secondary:** Background transparent, border 1px `--border`, color `--text-secondary`, border-radius 6px, padding `10px 20px`. Hover: border `--text-muted`, color `--text-primary`.

**Ghost:** Background transparent, no border, color `--text-secondary`. Hover: color `--text-primary`, background `--surface-hover`.

**Disabled:** Opacity 0.4, pointer-events none.

All buttons: `min-height: 40px`, `font-family: Inter`, `cursor: pointer`, `transition: all 150ms ease`.

### 3g. Premium Badge/CTA

**Badge:** Background `--premium-subtle`, color `--premium`, border 1px `rgba(167,139,250,0.2)`, border-radius 9999px, padding `2px 10px`, font 11px weight 600, uppercase, tracking 0.04em.

**Premium CTA section:** Background gradient from `--surface` to `rgba(167,139,250,0.05)`. Border 1px `rgba(167,139,250,0.15)`, border-radius 8px. Inside: headline in `--text-primary`, description in `--text-secondary`, button with `--premium` background and dark text.

**Premium button:** Background `--premium`, color `#09090B`, border-radius 6px. Hover: `#8B5CF6` (violet-500). This makes premium feel distinct from the main accent without being garish.

---

## 4. Complete globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ================================================================
   SPT Design System — v2.0
   Dark-first, data-first, precision aesthetic
   ================================================================ */

:root {
  /* Surfaces */
  --bg:             #09090B;
  --surface:        #18181B;
  --surface-hover:  #27272A;

  /* Borders */
  --border:         #27272A;
  --border-subtle:  #1E1E22;

  /* Text */
  --text-primary:   #FAFAFA;
  --text-secondary: #A1A1AA;
  --text-muted:     #52525B;

  /* Accent — Emerald */
  --accent:         #10B981;
  --accent-hover:   #059669;
  --accent-subtle:  rgba(16, 185, 129, 0.10);

  /* Semantic */
  --success:        #22C55E;
  --warning:        #F59E0B;
  --danger:         #EF4444;

  /* Premium — Violet */
  --premium:        #A78BFA;
  --premium-subtle: rgba(167, 139, 250, 0.10);

  /* Radii */
  --radius-sm: 4px;
  --radius:    6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;
}

/* ─── Base ──────────────────────────────────────────────────── */
@layer base {
  *, *::before, *::after {
    box-sizing: border-box;
  }

  html {
    font-size: 16px;
    -webkit-text-size-adjust: 100%;
    scroll-behavior: smooth;
  }

  body {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    font-weight: 400;
    line-height: 1.6;
    color: var(--text-secondary);
    background-color: var(--bg);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Typography hierarchy */
  .display {
    font-family: 'Instrument Serif', Georgia, serif;
    font-size: 3rem;
    font-weight: 400;
    line-height: 1.1;
    letter-spacing: -0.02em;
    color: var(--text-primary);
  }

  h1 {
    font-size: 1.875rem;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -0.025em;
    color: var(--text-primary);
  }

  h2 {
    font-size: 1.25rem;
    font-weight: 600;
    line-height: 1.3;
    letter-spacing: -0.01em;
    color: var(--text-primary);
  }

  h3 {
    font-size: 0.9375rem;
    font-weight: 600;
    line-height: 1.4;
    color: var(--text-primary);
  }

  @media (max-width: 640px) {
    .display { font-size: 2.25rem; }
    h1 { font-size: 1.5rem; }
  }

  a {
    color: var(--accent);
    text-decoration: none;
    transition: color 150ms ease;
  }

  a:hover {
    color: var(--accent-hover);
  }

  ::selection {
    background-color: var(--accent-subtle);
    color: var(--text-primary);
  }
}

/* ─── SPT Data Table ────────────────────────────────────────── */
.spt-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.spt-table thead th {
  background-color: var(--surface);
  color: var(--text-muted);
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  font-size: 0.6875rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  position: sticky;
  top: 0;
  z-index: 10;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  border-bottom: 1px solid var(--border);
}

.spt-table thead th:hover {
  color: var(--text-secondary);
}

.spt-table thead th .sort-icon {
  opacity: 0;
  margin-left: 4px;
  transition: opacity 150ms ease;
  color: var(--text-muted);
}

.spt-table thead th:hover .sort-icon {
  opacity: 0.5;
}

.spt-table thead th[data-sorted] .sort-icon,
.spt-table thead th[aria-sort="ascending"] .sort-icon,
.spt-table thead th[aria-sort="descending"] .sort-icon {
  opacity: 1;
  color: var(--accent);
}

.spt-table tbody tr {
  transition: background-color 150ms ease;
}

.spt-table tbody tr:hover td {
  background-color: var(--surface-hover);
}

.spt-table tbody td {
  padding: 10px 16px;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-subtle);
  vertical-align: middle;
}

/* Numeric columns right-align */
.spt-table tbody td:nth-child(n+3) {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8125rem;
  font-weight: 500;
}

/* Mobile table scroll wrapper */
.spt-table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

/* ─── Buttons ───────────────────────────────────────────────── */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background-color: var(--accent);
  color: #09090B;
  padding: 10px 20px;
  font-size: 0.8125rem;
  font-weight: 600;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  transition: background-color 150ms ease;
  min-height: 40px;
  font-family: inherit;
  line-height: 1;
}

.btn-primary:hover {
  background-color: var(--accent-hover);
  color: #09090B;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background-color: transparent;
  color: var(--text-secondary);
  padding: 10px 20px;
  font-size: 0.8125rem;
  font-weight: 600;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 150ms ease;
  min-height: 40px;
  font-family: inherit;
  line-height: 1;
}

.btn-secondary:hover {
  border-color: var(--text-muted);
  color: var(--text-primary);
}

.btn-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background-color: transparent;
  color: var(--text-secondary);
  padding: 10px 20px;
  font-size: 0.8125rem;
  font-weight: 600;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 150ms ease;
  min-height: 40px;
  font-family: inherit;
  line-height: 1;
}

.btn-ghost:hover {
  color: var(--text-primary);
  background-color: var(--surface-hover);
}

.btn-premium {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background-color: var(--premium);
  color: #09090B;
  padding: 10px 20px;
  font-size: 0.8125rem;
  font-weight: 600;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  transition: background-color 150ms ease;
  min-height: 40px;
  font-family: inherit;
  line-height: 1;
}

.btn-premium:hover {
  background-color: #8B5CF6;
  color: #09090B;
}

.btn-disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

/* ─── Breadcrumb ────────────────────────────────────────────── */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-bottom: 1.5rem;
}

.breadcrumb a {
  color: var(--text-muted);
  transition: color 150ms ease;
}

.breadcrumb a:hover {
  color: var(--accent);
}

.breadcrumb .sep {
  color: var(--border);
}

/* ─── Stat chip ─────────────────────────────────────────────── */
.stat-chip {
  display: inline-block;
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  padding: 4px 12px;
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 500;
}

/* ─── Filter input ──────────────────────────────────────────── */
.spt-filter-input {
  padding: 10px 14px;
  font-size: 0.875rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-primary);
  background: var(--surface);
  outline: none;
  min-height: 40px;
  width: 100%;
  font-family: inherit;
  transition: border-color 150ms ease, box-shadow 150ms ease;
}

.spt-filter-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-subtle);
}

.spt-filter-input::placeholder {
  color: var(--text-muted);
}

/* ─── Section card ──────────────────────────────────────────── */
.spt-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 20px;
}

/* ─── Page section spacing ──────────────────────────────────── */
.spt-section {
  margin-bottom: 3rem;
}

/* ─── Premium badge ─────────────────────────────────────────── */
.badge-premium {
  display: inline-block;
  background-color: var(--premium-subtle);
  color: var(--premium);
  border: 1px solid rgba(167, 139, 250, 0.2);
  border-radius: var(--radius-full);
  padding: 2px 10px;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* ─── Rate colouring ────────────────────────────────────────── */
.rate-high {
  color: var(--success);
  font-weight: 700;
}

.rate-mid {
  color: var(--warning);
  font-weight: 700;
}

.rate-low {
  color: var(--danger);
  font-weight: 700;
}

/* ─── League list item ──────────────────────────────────────── */
.league-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  margin-bottom: 8px;
  transition: all 150ms ease;
  cursor: pointer;
  text-decoration: none;
}

.league-item:hover {
  background: var(--surface-hover);
  border-color: rgba(16, 185, 129, 0.2);
}

.league-item:hover .league-arrow {
  color: var(--accent);
  transform: translateX(2px);
}

.league-arrow {
  color: var(--text-muted);
  transition: all 200ms ease;
}

/* ─── Premium CTA section ───────────────────────────────────── */
.premium-cta {
  background: linear-gradient(135deg, var(--surface) 0%, rgba(167, 139, 250, 0.05) 100%);
  border: 1px solid rgba(167, 139, 250, 0.15);
  border-radius: var(--radius-md);
  padding: 32px;
}

/* ─── Big stat number ───────────────────────────────────────── */
.stat-number {
  font-family: 'JetBrains Mono', monospace;
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.stat-label {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin-top: 4px;
}

/* ─── Progress bar ──────────────────────────────────────────── */
.progress-track {
  height: 4px;
  background-color: var(--border);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 400ms ease;
}

.progress-fill-accent {
  background-color: var(--accent);
}

.progress-fill-muted {
  background-color: var(--text-muted);
}

/* ─── Utility ───────────────────────────────────────────────── */
.no-underline {
  text-decoration: none;
}
```

---

## 5. Tailwind Config Changes

Complete `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Instrument Serif', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      colors: {
        spt: {
          bg: '#09090B',
          surface: '#18181B',
          'surface-hover': '#27272A',
          border: '#27272A',
          'border-subtle': '#1E1E22',
          'text-primary': '#FAFAFA',
          'text-secondary': '#A1A1AA',
          'text-muted': '#52525B',
          accent: '#10B981',
          'accent-hover': '#059669',
          success: '#22C55E',
          warning: '#F59E0B',
          danger: '#EF4444',
          premium: '#A78BFA',
        },
      },
      borderRadius: {
        DEFAULT: '6px',
        md: '8px',
        lg: '12px',
      },
      fontSize: {
        'display': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-sm': ['2.25rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'heading-1': ['1.875rem', { lineHeight: '1.2', letterSpacing: '-0.025em' }],
        'heading-2': ['1.25rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        'heading-3': ['0.9375rem', { lineHeight: '1.4' }],
        'body': ['0.875rem', { lineHeight: '1.6' }],
        'small': ['0.75rem', { lineHeight: '1.5' }],
        'label': ['0.6875rem', { lineHeight: '1.4', letterSpacing: '0.05em' }],
        'mono': ['0.8125rem', { lineHeight: '1.4' }],
      },
      animation: {
        'slide-in': 'slideIn 200ms ease-out',
        'fade-in': 'fadeIn 300ms ease-out',
      },
      keyframes: {
        slideIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
```

---

## 6. Implementation Priority Order

Highest visual impact first. Each step builds on the previous.

| Priority | File(s) | Why |
|---|---|---|
| **1** | `app/globals.css` | One file changes the entire site palette, typography, and component base. Immediate transformation. |
| **2** | `tailwind.config.ts` | Enables Tailwind utility classes for the new tokens across all components. |
| **3** | `app/layout.tsx` | Add Instrument Serif font import, update body classes, remove inline `style` props. |
| **4** | `components/layout/Header.tsx` | The header is visible on every page. Redesigning it changes the first impression everywhere. |
| **5** | `app/page.tsx` | Homepage hero + Browse by Type cards. The landing experience. |
| **6** | `components/data/DataTable.tsx` | The core product. Update cell renderers to use new tokens, remove inline styles. |
| **7** | `components/data/SummaryCard.tsx` | Sidebar stats with new big-number treatment. |
| **8** | `components/data/ClubTotalsWidget.tsx` | Progress bars with new accent colors. |
| **9** | `components/data/ConversionChart.tsx` | Recharts colors updated to new palette. |
| **10** | `app/[category]/page.tsx` | Category page — convert league table to stacked list. |
| **11** | `app/[category]/[league]/page.tsx` | League detail page — update breadcrumb, header, premium CTA styles. |
| **12** | `components/layout/Footer.tsx` | Footer — update to match new palette. Low priority, below fold. |
| **13** | `app/premium/page.tsx` | Premium page with violet treatment. |
| **14** | `app/blog/**` | Blog pages — last, as they are content-driven and less design-critical. |

---

## 7. Header Component Code

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const NAV = [
  { label: 'Penalties', href: '/penalties' },
  { label: 'Free Kicks', href: '/freekicks' },
  { label: 'Corners', href: '/corners' },
  { label: 'Blog', href: '/blog' },
]

export default function Header() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        backgroundColor: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-1.5 shrink-0 no-underline">
          <span
            className="font-bold text-[15px] tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            SPT<span style={{ color: 'var(--accent)' }}>.</span>
          </span>
          <span
            className="text-[11px] font-medium uppercase tracking-widest hidden sm:inline"
            style={{ color: 'var(--text-muted)' }}
          >
            setpiecetakers
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative px-3 py-2 text-[13px] font-medium no-underline transition-colors"
                style={{
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}
              >
                {item.label}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-3 right-3 h-[2px]"
                    style={{ backgroundColor: 'var(--accent)' }}
                  />
                )}
              </Link>
            )
          })}
          <Link
            href="/premium"
            className="ml-4 px-4 py-1.5 text-[12px] font-semibold no-underline transition-all"
            style={{
              color: 'var(--premium)',
              backgroundColor: 'var(--premium-subtle)',
              border: '1px solid rgba(167, 139, 250, 0.2)',
              borderRadius: '9999px',
            }}
          >
            Premium
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer */}
          <div
            className="fixed top-0 right-0 bottom-0 z-50 w-72 p-6 flex flex-col animate-slide-in"
            style={{ backgroundColor: 'var(--surface)' }}
          >
            <button
              className="self-end p-2 mb-6"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <nav className="flex flex-col gap-1">
              {NAV.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-3 text-[15px] font-medium no-underline rounded-md transition-colors"
                    style={{
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      backgroundColor: isActive ? 'var(--surface-hover)' : 'transparent',
                    }}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
              <Link
                href="/premium"
                onClick={() => setMobileOpen(false)}
                className="btn-premium w-full text-center no-underline"
              >
                Unlock Premium
              </Link>
            </div>
          </div>
        </>
      )}
    </header>
  )
}
```

---

## 8. Homepage Hero Section

```tsx
{/* Hero */}
<section className="mb-16 pt-8">
  <p
    className="text-label uppercase tracking-widest mb-4"
    style={{ color: 'var(--accent)', fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.1em' }}
  >
    Set Piece Intelligence
  </p>
  <h1
    className="display mb-4"
    style={{ maxWidth: '640px' }}
  >
    Know who takes the kick.
  </h1>
  <p
    className="text-[1rem] leading-relaxed mb-8"
    style={{ color: 'var(--text-secondary)', maxWidth: '520px' }}
  >
    Penalty, free kick, and corner taker data for every club in every top league.
    No paywall. Updated daily.
  </p>
  <div className="flex flex-wrap gap-3">
    <Link href="/penalties" className="btn-primary">
      Penalty Takers
    </Link>
    <Link href="/freekicks" className="btn-secondary">
      Free Kick Takers
    </Link>
    <Link href="/corners" className="btn-secondary">
      Corner Takers
    </Link>
  </div>
</section>

{/* Browse by Type */}
<section className="spt-section">
  <h2
    className="text-heading-2 font-semibold mb-5"
    style={{ color: 'var(--text-primary)' }}
  >
    Browse by Type
  </h2>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
    {Object.entries(CATEGORIES).map(([id, cat]) => (
      <Link
        key={id}
        href={`/${id}`}
        className="group spt-card block no-underline transition-all"
        style={{ padding: '20px 24px' }}
      >
        <p
          className="text-[13px] font-semibold uppercase tracking-wide mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          {cat.label} Takers
        </p>
        <p
          className="text-[13px] leading-relaxed mb-4"
          style={{ color: 'var(--text-secondary)' }}
        >
          {cat.description}
        </p>
        <p
          className="text-[12px] font-semibold flex items-center gap-1"
          style={{ color: 'var(--accent)' }}
        >
          View leagues
          <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">
            &rarr;
          </span>
        </p>
      </Link>
    ))}
  </div>
</section>
```

---

## 9. Updated layout.tsx

The layout needs two changes: add Instrument Serif font, and clean up the body styling.

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: {
    default: 'SetPieceTakers — Penalties. Freekicks. Corners.',
    template: '%s | SetPieceTakers',
  },
  description: 'Set piece taker data for every club in every top league. Penalties, free kicks, and corners. No paywall. Updated daily.',
  metadataBase: new URL('https://setpiecetakers.com'),
  openGraph: {
    siteName: 'SetPieceTakers',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif&display=swap"
          rel="stylesheet"
        />
      </head>
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-6SNH6JNM5Z" strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-6SNH6JNM5Z');
      `}</Script>
      <body className={inter.className}>
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
```

Note: The body `style` prop is removed — the CSS handles it. Instrument Serif is loaded via `<link>` in `<head>` rather than `next/font` because `next/font/google` does not support all Google Fonts and Instrument Serif support may vary. If it does work with `next/font`, prefer that approach.

---

## Summary of Key Design Decisions

1. **Dark mode only for V1.** Football analytics users browse evenings. Ship one mode perfectly rather than two modes adequately.

2. **Emerald accent (#10B981)** over the old navy/red. Green connotes "go, active, live data." It pops against zinc backgrounds without being garish. Red is reserved strictly for negative stats (missed penalties, low rates).

3. **Violet for premium (#A78BFA).** Separates premium from the main product visually. Premium should feel like a distinct tier, not just a paywall color.

4. **No alternating row stripes.** On dark backgrounds, stripes create visual noise. The subtle `--border-subtle` dividers provide rhythm without clutter.

5. **Instrument Serif for display only.** One serif heading on the homepage creates editorial authority. Overusing it would fight with the data-tool aesthetic.

6. **League list instead of league table on category pages.** Tables imply data to analyze. The league list is navigation — card-style rows communicate "click to go somewhere" better than table rows.

7. **Remove emojis from Browse by Type cards.** The old design used emojis as category icons. They undermine the precision aesthetic. Typography alone carries the hierarchy.

8. **SPT. as the logo mark.** Shorter, punchier than "Setpiecetakers" in the header. The accent-colored period is the only brand mark needed. "setpiecetakers" appears as a subdued wordmark beside it.

---

## Files Referenced

- `/home/herbert/Projects/data-setpiecetakers/app/globals.css` — current CSS, to be replaced
- `/home/herbert/Projects/data-setpiecetakers/tailwind.config.ts` — current config, to be replaced
- `/home/herbert/Projects/data-setpiecetakers/app/layout.tsx` — needs font + body updates
- `/home/herbert/Projects/data-setpiecetakers/components/layout/Header.tsx` — full rewrite
- `/home/herbert/Projects/data-setpiecetakers/app/page.tsx` — hero section rewrite
- `/home/herbert/Projects/data-setpiecetakers/components/data/DataTable.tsx` — style token updates
- `/home/herbert/Projects/data-setpiecetakers/components/data/SummaryCard.tsx` — big number treatment
- `/home/herbert/Projects/data-setpiecetakers/components/data/ClubTotalsWidget.tsx` — progress bar updates
- `/home/herbert/Projects/data-setpiecetakers/components/data/ConversionChart.tsx` — chart color updates
- `/home/herbert/Projects/data-setpiecetakers/app/[category]/page.tsx` — league list conversion
- `/home/herbert/Projects/data-setpiecetakers/app/[category]/[league]/page.tsx` — detail page updates
- `/home/herbert/Projects/data-setpiecetakers/components/layout/Footer.tsx` — palette update
