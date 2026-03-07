# Download herbertokolowitz.com Content Files

## Context
Download only user-generated content from the WordPress site herbertokolowitz on Bluehost — no WP core, no stock themes, no plugins. SSH access via `bluehost` alias is working.

## What to Download

1. **wp-content/uploads** — 143 files, ~11 MB (images, PDFs, media 2023-2026)
2. **wp-content/themes/optics-child** — 40 KB custom child theme
3. **Root HTML/CSS files** — multilingual static pages (de/es/it/ca/index.html + style.css, certificates.css, colors.css)

## Destination
`~/Downloads/herbertokolowitz-backup/`

## Commands

```bash
mkdir -p ~/Downloads/herbertokolowitz-backup

# Uploads (media/images)
rsync -avz --progress bluehost:~/public_html/herbertokolowitz/wp-content/uploads/ \
  ~/Downloads/herbertokolowitz-backup/uploads/

# Custom child theme
rsync -avz --progress bluehost:~/public_html/herbertokolowitz/wp-content/themes/optics-child/ \
  ~/Downloads/herbertokolowitz-backup/themes/optics-child/

# Root HTML/CSS files
rsync -avz --progress \
  bluehost:~/public_html/herbertokolowitz/index.html \
  bluehost:~/public_html/herbertokolowitz/de.html \
  bluehost:~/public_html/herbertokolowitz/es.html \
  bluehost:~/public_html/herbertokolowitz/it.html \
  bluehost:~/public_html/herbertokolowitz/ca.html \
  bluehost:~/public_html/herbertokolowitz/style.css \
  bluehost:~/public_html/herbertokolowitz/certificates.css \
  bluehost:~/public_html/herbertokolowitz/colors.css \
  ~/Downloads/herbertokolowitz-backup/
```

## Verification
- Check file count matches: `find ~/Downloads/herbertokolowitz-backup -type f | wc -l`
- Spot-check images opened correctly
- Total size should be ~11.5 MB
