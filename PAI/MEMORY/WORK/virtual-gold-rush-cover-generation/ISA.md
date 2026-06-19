---
task: Cover-Referenz erweitern, Google API Key Anleitung, eigene Cover-Vorschläge generieren
slug: virtual-gold-rush-cover-generation
effort: E2
phase: build
progress: 2/4
mode: build
started: 2026-06-19T10:24:00Z
updated: 2026-06-19T10:30:00Z
---

## Problem
Herbert hat ein zusätzliches Pokerbuch-Cover ("Let There Be Range!") zur Referenzsammlung beigetragen, das noch nicht in der Sammlung dokumentiert ist. Außerdem will er selbst Cover-Vorschläge für "Virtual Gold Rush" generieren lassen, weiß aber nicht, wie er den dafür nötigen Google/Gemini API Key (für das nano-banana-pro Modell im Art-Skill) bekommt. Aktuell ist in `~/.env` kein `GOOGLE_API_KEY`, `OPENAI_API_KEY` oder `REPLICATE_API_TOKEN` gesetzt — keines der vier Generate.ts-Modelle ist aktuell funktionsfähig.

## Goal
1) Das neue Cover ist in `poker-books/` gespeichert und in OVERVIEW.md + STYLE-GUIDE.md dokumentiert. 2) Herbert hat eine konkrete Schritt-für-Schritt-Anleitung zum Beschaffen eines Google AI Studio API Keys. 3) Sobald der Key vorhanden ist, generiere ich Cover-Vorschläge via Art-Skill (`nano-banana-pro`) basierend auf den STYLE-GUIDE.md-Empfehlungen.

## Criteria
- [x] ISC-1: Datei `poker-books/let-there-be-range-nguyen-south-2008.jpg` existiert, valides JPEG
- [x] ISC-2: OVERVIEW.md enthält neue Tabellenzeile + Quellenangabe für das neue Cover
- [x] ISC-3: STYLE-GUIDE.md enthält neue Vergleichszeile + aktualisierte Muster-/Vermeiden-Abschnitte
- [ ] ISC-4: Anti: Keine Cover-Generierung wird ohne gültigen API-Key als "erledigt" gemeldet — Status bleibt transparent blockiert

## Test Strategy
| ISC | Type | Check | Threshold | Tool |
|-----|------|-------|-----------|------|
| ISC-1 | file | Datei existiert, `file` zeigt JPEG | >10KB | Bash file/ls |
| ISC-2 | content | Read OVERVIEW.md zeigt neue Zeile | 1 neue Zeile | Read |
| ISC-3 | content | Read STYLE-GUIDE.md zeigt neue Zeile + Anpassungen | 3 Stellen aktualisiert | Read |
| ISC-4 | anti | grep "GOOGLE_API_KEY" in ~/.env | 0 Treffer = Block bestätigt | Bash grep |

## Decisions
- 2026-06-19: Tier E2 gewählt (Single-Domain Content-Edit + Recherche + Tool-Readiness-Check, kein mehrstufiges Architektur-Problem).
- 2026-06-19: Geprüft, dass weder GOOGLE_API_KEY noch OPENAI_API_KEY noch REPLICATE_API_TOKEN in ~/.env existieren — keines der vier Generate.ts-Modelle (flux, nano-banana, nano-banana-pro, gpt-image-1) ist aktuell nutzbar. Cover-Generierung daher als ISC-4 (Anti) explizit als blockiert dokumentiert statt fälschlich als erledigt zu melden.
- 2026-06-19: Herbert lieferte GOOGLE_API_KEY direkt im Chat → in ~/.env eingetragen. Live-Testaufruf von nano-banana-pro durchgeführt zur Verifikation statt Spekulation: Ergebnis `429 RESOURCE_EXHAUSTED`, `limit: 0` für `generate_content_free_tier_requests`/`generate_content_free_tier_input_token_count` bei Modell `gemini-3-pro-image`. Bestätigt: kein Free-Tier-Kontingent existiert für dieses Modell, Billing ist Pflicht-Voraussetzung, nicht optional für hohe Auflösung.

## Verification
- ISC-1: `file` zeigt "JPEG image data... 277x349", 37379 bytes
- ISC-2: Edit-Tool-Output bestätigt neue Tabellenzeile + Quellenzeile in OVERVIEW.md
- ISC-3: Edit-Tool-Output bestätigt neue Vergleichszeile, Muster-Update und Vermeiden-Update in STYLE-GUIDE.md
- ISC-4: `grep -o "^[A-Z_]*=" ~/.env` zeigt kein GOOGLE_API_KEY/OPENAI_API_KEY/REPLICATE_API_TOKEN — Block bestätigt, Herbert erhält Anleitung statt Fake-Generierung
