---
name: WordPressScrape
description: Scrape a WordPress site's posts or pages to categorized Obsidian Markdown files. USE WHEN: scrape wordpress, save articles to obsidian, archive website content, import blog posts, save pages as markdown, website to markdown.
---

# WordPressScrape Skill

Scrapes any WordPress site via its REST API and saves all content as categorized `.md` files in the Obsidian MONAD vault.

## When to Use

- User asks to scrape/archive/import a website into Obsidian
- User wants to save blog posts or pages as Markdown
- User wants to create an offline Obsidian archive of a site

## How It Works

Uses the WordPress REST API (`/wp-json/wp/v2/`). No browser needed. Converts HTML → Markdown via `turndown`. Writes frontmatter + body to dated files organized by category.

## Script Location

`/tmp/griffl-work/wp-scraper.ts` (recreate from template below if missing)

## Quick Usage

```bash
cd /tmp/griffl-work
bun run wp-scraper.ts \
  --url https://example.com \
  --output ~/Documents/MONAD/04-CONTENT/ProjectName/05-Published \
  --type posts \
  --name "Site Name"
```

For pages (portfolio sites with no blog posts):
```bash
bun run wp-scraper.ts \
  --url https://example.com \
  --output ~/Documents/MONAD/02-PROJECTS/ProjectName/Published-Pages \
  --type pages \
  --name "Site Name"
```

## Parameters

| Flag | Description | Example |
|------|-------------|---------|
| `--url` | WordPress site URL | `https://griffl.org` |
| `--output` | Obsidian output directory (expands `~`) | `~/Documents/MONAD/04-CONTENT/Griffl/05-Published` |
| `--type` | `posts` (blog articles) or `pages` (static pages) | `posts` |
| `--name` | Label used in index file header | `griffl.org` |

## Output Structure

**For posts** (auto-generates category subfolders from WP API):
```
output-dir/
├── Category-Name/
│   └── YYYY-MM-DD-post-slug.md
└── _INDEX.md
```

**For pages** (flat structure):
```
output-dir/
├── YYYY-MM-DD-page-slug.md
└── _INDEX.md
```

## File Frontmatter

```yaml
---
title: "Article Title"
date: 2025-10-18
url: https://example.com/slug/
categories: ["Category Name"]
author: Herbert
reading_time: "4 min"   # from Yoast if available
tags: ["tag1", "tag2"]
source: example.com
---
```

## Known Limitations

- **ModSecurity WAF** on some hosts blocks `per_page=100`. Script uses `per_page=10` with pagination loop — handles this automatically.
- **Non-WordPress sites** are not supported (Ghost, custom CMS). Check for `/wp-json/` endpoint first.
- **Private/password-protected posts** are excluded (scrapes `status=publish` only).
- **Media files** are not downloaded — image references remain as remote URLs.

## MONAD Target Conventions

| Site Type | Target Path |
|-----------|-------------|
| Content site (blog) | `~/Documents/MONAD/04-CONTENT/[SiteName]/05-Published/` |
| Portfolio/pages site | `~/Documents/MONAD/02-PROJECTS/[ProjectName]/Published-Pages/` |
| Single-category blog | `~/Documents/MONAD/04-CONTENT/[SiteName]/05-Published/` (flat or one subfolder) |

## Scraped Sites Archive

| Site | Type | Posts | MONAD Path | Date |
|------|------|-------|------------|------|
| griffl.org | posts | 49 | `04-CONTENT/Griffl/05-Published/` | 2026-06-26 |
| herbertokolowitz.com | pages | 11 | `02-PROJECTS/Personal-Website/Published-Pages/` | 2026-06-26 |
| horse-sheep-ranch-wasching.online | posts | 1 | `04-CONTENT/HorseAndSheepRanch/Published/` | 2026-06-26 |
| pokerstories.wtf | posts | 10 | `04-CONTENT/PokerStories/05-Published/` | 2026-06-26 |

## Setup (first time)

```bash
mkdir -p /tmp/griffl-work
cd /tmp/griffl-work
bun init -y
bun add turndown
bun add -d @types/turndown
# Then write wp-scraper.ts (see PAI/Skills/WordPressScrape/ for template)
```

## Verification

```bash
# Count files
find <output-dir> -name "*.md" | wc -l

# Category breakdown
for d in <output-dir>/*/; do echo "$(basename "$d"): $(ls "$d" | wc -l)"; done

# Check frontmatter
head -12 <output-dir>/**/*.md | head -20
```
