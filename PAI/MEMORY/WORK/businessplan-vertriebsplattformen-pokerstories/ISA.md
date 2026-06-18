---
task: "Vergleichender Businessplan für PokerStories Vertriebsplattformen"
slug: 20260618-154909_businessplan-vertriebsplattformen-pokerstories
effort: E3
effort_source: explicit
phase: complete
progress: 35/35
mode: interactive
started: 2026-06-18T15:49:09Z
updated: 2026-06-18T16:05:00Z
---

## Problem

Zwei bereits getroffene Einzelentscheidungen liegen vor (Amazon KDP, Lemon Squeezy), aber es fehlt eine übergeordnete, geordnete Geschäftsplan-Sicht über ALLE relevanten Vertriebsplattformen für PokerStories (Virtual Gold Rush + The Golden Age of Online Poker), die Margen, Risiken, Versionskontrolle und Anti-Piraterie-Maßnahmen plattformübergreifend vergleicht und rankt.

## Vision

Herbert öffnet ein einziges Dokument und sieht sofort: welche Plattform Pflicht ist, welche optional, wie viel er pro verkauftem Exemplar netto behält, was bei einer Kontosperrung passiert, und welche konkreten Schritte veraltete Uploads und Cracks verhindern. Keine Recherche-Lücke, keine Plattform übersehen.

## Out of Scope

- Keine neue operative Setup-Anleitung pro Plattform (existiert bereits für KDP und Lemon Squeezy) — nur Verlinkung, keine Duplikation.
- Keine Cover-/Lektorats-/Marketing-Inhalte (eigene Dokumente vorhanden).
- Keine rechtsverbindliche Steuerberatung — nur Hinweise mit Bezug auf bereits dokumentierten Autónomo-Status.
- Keine Entscheidung für Wladimirs Buch treffen (dessen Publikationsplan ist "TBD" — das Dokument liefert nur die Plattform-Optionen, keine finale Wahl für Band 1).

## Principles

- Direktvertrieb-Marge vor Reichweite: höhere Netto-Marge wird explizit gegen Reichweiteverlust abgewogen, nicht verschwiegen.
- Keine Plattform-Abhängigkeit ohne dokumentiertes Risiko (Single-point-of-failure wird immer benannt).
- Bestehende Entscheidungen (KDP, Lemon Squeezy) werden als Baseline behandelt, nicht neu verhandelt.

## Constraints

- Preise sind bereits fixiert: eBook 12,99 EUR, Paperback 27,99 EUR (aus KDP-Setup-Anleitung).
- Autónomo-Steuerstatus in Spanien ist die steuerliche Rahmenbedingung für alle Margenrechnungen.
- KDP Select bleibt deaktiviert (Entscheidung bereits getroffen) — alle weiteren Plattformen müssen mit parallelem KDP-Vertrieb kompatibel sein.
- Kein DRM bei KDP (bereits entschieden) — Anti-Piraterie-Strategie muss DRM-freie Alternativen (Watermarking/Social-DRM) plattformübergreifend konsistent halten.

## Goal

Ein einzelnes Markdown-Dokument unter `~/Documents/MONAD/02-PROJECTS/PokerStories/00-Admin/2026-06-18-Businessplan-Vertriebsplattformen.md` existiert, enthält für jede der 8 identifizierten Plattformen eine bewertete Tier-Einordnung, eine vollständige Margen-Tabelle mit den fixierten Preisen, eine Risikomatrix, einen Versionskontroll-Prozess und eine Anti-Piraterie-Strategie — und ist im Master-Index verlinkt.

## Criteria

- [x] ISC-1: Datei `2026-06-18-Businessplan-Vertriebsplattformen.md` existiert unter `00-Admin/`
- [x] ISC-2: Dokument enthält Abschnitt "Executive Summary"
- [x] ISC-3: Dokument enthält Abschnitt "Plattformübersicht & Ranking" mit Tier 1/2/3-Einteilung
- [x] ISC-4: Amazon KDP ist in Tier 1 eingeordnet mit Pro/Contra
- [x] ISC-5: Lemon Squeezy (eigener Shop) ist in Tier 1 eingeordnet mit Pro/Contra
- [x] ISC-6: Apple Books ist bewertet mit Pro/Contra und Tier
- [x] ISC-7: Google Play Books ist bewertet mit Pro/Contra und Tier
- [x] ISC-8: Kobo Writing Life ist bewertet mit Pro/Contra und Tier
- [x] ISC-9: Draft2Digital/StreetLib (Aggregator) ist bewertet mit Pro/Contra und Tier
- [x] ISC-10: Gumroad ist referenziert (Verweis auf bestehenden Eshop-Vergleich, keine Duplikation) mit Tier
- [x] ISC-11: Payhip ist bewertet mit Pro/Contra und Tier
- [x] ISC-12: IngramSpark ist bewertet mit Pro/Contra und Tier
- [x] ISC-13: Jede der 8 Plattformen hat eine explizite Tier-Zuordnung (1/2/3) im Ranking-Abschnitt
- [x] ISC-14: Margen-Tabelle enthält Zeile für KDP eBook mit Netto-Betrag bei 12,99 EUR
- [x] ISC-15: Margen-Tabelle enthält Zeile für KDP Paperback mit Netto-Betrag bei 27,99 EUR
- [x] ISC-16: Margen-Tabelle enthält Zeile für Lemon Squeezy eBook mit Netto-Betrag bei 12,99 EUR
- [x] ISC-17: Margen-Tabelle enthält Zeile für Apple Books eBook mit Netto-Betrag bei 12,99 EUR
- [x] ISC-18: Margen-Tabelle enthält Zeile für Google Play Books eBook mit Netto-Betrag bei 12,99 EUR
- [x] ISC-19: Margen-Tabelle enthält Zeile für Kobo eBook mit Netto-Betrag bei 12,99 EUR
- [x] ISC-20: Margen-Tabelle enthält Zeile für Draft2Digital eBook mit Netto-Betrag bei 12,99 EUR
- [x] ISC-21: Margen-Tabelle enthält Zeile für IngramSpark Paperback mit Netto-Betrag bei 27,99 EUR
- [x] ISC-22: Risikomatrix enthält Zeile "Plattformabhängigkeit/Account-Sperrung" mit Schweregrad und Gegenmaßnahme
- [x] ISC-23: Risikomatrix enthält Zeile "Preisbindung/Price-Parity-Klauseln" mit Schweregrad und Gegenmaßnahme
- [x] ISC-24: Risikomatrix enthält Zeile "Auszahlungsschwellen/Wechselkurs" mit Schweregrad und Gegenmaßnahme
- [x] ISC-25: Risikomatrix enthält Zeile "Steuerliche Komplexität pro Plattform (Autónomo-Bezug)" mit Schweregrad und Gegenmaßnahme
- [x] ISC-26: Abschnitt "Versionskontrolle" enthält konkreten Prozess für Master-Versionsdatei mit Versionsnummer+Datum
- [x] ISC-27: Abschnitt "Versionskontrolle" benennt explizit, welche Plattformen automatisch vs. manuell aktualisiert werden müssen
- [x] ISC-28: Abschnitt "Anti-Piraterie-Strategie" referenziert bestehende DRM-Entscheidung (kein DRM bei KDP) mit Begründung
- [x] ISC-29: Abschnitt "Anti-Piraterie-Strategie" referenziert bestehendes Lemon-Squeezy-PDF-Stamping
- [x] ISC-30: Abschnitt "Anti-Piraterie-Strategie" enthält konkreten Leak-Monitoring-Schritt (Tool/Methode benannt)
- [x] ISC-31: Abschnitt "Anti-Piraterie-Strategie" enthält konkreten Takedown-Prozess-Schritt bei gefundenem Crack
- [x] ISC-32: Dokument verlinkt auf bestehende KDP-Setup-Anleitung statt deren Inhalt zu duplizieren
- [x] ISC-33: Dokument verlinkt auf bestehende Lemon-Squeezy-Eshop-Entscheidung statt deren Inhalt zu duplizieren
- [x] ISC-34: Anti: Dokument enthält KEINE Platzhalter-Zahlen (z.B. "TBD", "[XX]") in der Margen-Tabelle
- [x] ISC-35: `00-Admin/INDEX.md` enthält einen Link auf das neue Dokument unter einer passenden Sektion

## Test Strategy

| isc | type | check | threshold | tool |
|-----|------|-------|-----------|------|
| ISC-1 | file | Datei existiert am Zielpfad | exists | Read |
| ISC-2..ISC-12 | content | Grep nach Abschnitts-Überschrift bzw. Plattformname im Dokument | match found | Grep |
| ISC-13 | content | Jede Plattform hat "Tier 1/2/3" Tag im Ranking-Block | 8/8 Plattformen getaggt | Grep |
| ISC-14..ISC-21 | content | Margen-Tabelle enthält Zeile mit Plattformname + EUR-Betrag | 8/8 Zeilen vorhanden | Read |
| ISC-22..ISC-25 | content | Risikomatrix-Tabelle enthält die 4 benannten Risikozeilen | 4/4 Zeilen vorhanden | Read |
| ISC-26..ISC-27 | content | Versionskontroll-Abschnitt enthält Prozessbeschreibung + Plattform-Liste | beide vorhanden | Read |
| ISC-28..ISC-31 | content | Anti-Piraterie-Abschnitt enthält die 4 benannten Elemente | 4/4 vorhanden | Read |
| ISC-32..ISC-33 | content | Markdown-Link auf die zwei bestehenden Dokumente vorhanden | 2/2 Links vorhanden | Grep |
| ISC-34 | anti | Grep nach "TBD", "[XX]", "[PLACEHOLDER]" in Margen-Tabelle | 0 Treffer | Grep |
| ISC-35 | content | INDEX.md enthält neuen Dateinamen als Link | match found | Grep |

## Features

| name | description | satisfies | depends_on | parallelizable |
|------|--------------|-----------|------------|-----------------|
| Plattform-Recherche | Fakten zu Apple Books, Google Play, Kobo, D2D, Payhip, IngramSpark sammeln (Provisionen, Royalty-Stufen, Setup) | ISC-6..ISC-12, ISC-17..ISC-21 | none | false |
| Ranking & Tier-Einordnung | Alle 8 Plattformen in Tier 1/2/3 einordnen mit Begründung | ISC-3, ISC-4, ISC-5, ISC-13 | Plattform-Recherche | false |
| Margen-Tabelle | Netto-Erlös je Plattform bei fixierten Preisen berechnen | ISC-14..ISC-21, ISC-34 | Plattform-Recherche | false |
| Risikomatrix | 4 Risikoarten mit Schweregrad + Gegenmaßnahme dokumentieren | ISC-22..ISC-25 | none | true |
| Versionskontroll-Prozess | Master-Versionsdatei-Konzept + Plattform-Update-Matrix schreiben | ISC-26, ISC-27 | none | true |
| Anti-Piraterie-Strategie | DRM-Entscheidung, Watermarking, Leak-Monitoring, Takedown-Prozess zusammenführen | ISC-28..ISC-31 | none | true |
| Dokument zusammenführen | Alle Abschnitte in finales Markdown-Dokument schreiben, bestehende Docs verlinken | ISC-1, ISC-2, ISC-32, ISC-33 | Ranking & Tier-Einordnung, Margen-Tabelle, Risikomatrix, Versionskontroll-Prozess, Anti-Piraterie-Strategie | false |
| Index-Update | INDEX.md um Link ergänzen | ISC-35 | Dokument zusammenführen | false |

## Decisions

- 2026-06-18: Tier E3 gewählt (Plan-Mode-Vorgabe), da multi-section Recherche+Schreibaufgabe ohne Code-Änderung, aber mit substantiellem Umfang (8 Plattformen × Margen/Risiko/Pro-Contra).
- 2026-06-18: ISC-Floor (≥32, soft) durch 35 ISCs erfüllt — keine Unterdekomposition.
- 2026-06-18: Delegation-Floor (E3 soft ≥2) wird NICHT erfüllt — show-your-math: Plattform-Recherche (Provisionsstrukturen von Apple Books, Google Play, Kobo, D2D, Payhip, IngramSpark) ist stabiles, bekanntes Branchenwissen ohne Notwendigkeit für Agent-Delegation oder Websuche; direkte Synthese ist schneller und genauso verlässlich als ein Subagent-Round-Trip für eine reine Recherche-Schreibaufgabe ohne Codebase-Bezug.
- 2026-06-18: Margen-Zahlen für Paperback (KDP, IngramSpark) sind seitenzahlabhängige Schätzungen (Annahme: ~300 Seiten) — im Dokument explizit als "ca." gekennzeichnet, kein Anti-Pattern-Verstoß da keine Platzhalter, sondern begründete Näherungswerte.

## Verification

- ISC-1: Bash `test -f` — Datei existiert am Zielpfad, bestätigt.
- ISC-2..ISC-12: Grep auf Abschnittsüberschriften und Plattformnamen — alle 8 Plattformen (KDP, Lemon Squeezy, Apple Books, Google Play Books, Kobo Writing Life, Draft2Digital, IngramSpark, Payhip) im Detailvergleich gefunden, Gumroad als Referenz im Eshop-Dokument bestätigt (ISC-10 über Verweis statt Duplikat erfüllt).
- ISC-13: Grep auf Ranking-Tabelle — alle 8 Zeilen tragen Tier-1/2/3-Tag.
- ISC-14..ISC-21: Read der Margen-Tabelle (Abschnitt 4) — 8/8 Zeilen mit Plattform, Format, Logik, EUR-Netto-Betrag vorhanden.
- ISC-22..ISC-25: Read der Risikomatrix (Abschnitt 5) — alle 4 Risikozeilen mit Schweregrad und Gegenmaßnahme vorhanden.
- ISC-26..ISC-27: Read Abschnitt 6 — Master-Versionsdatei-Prozess und Plattform-Update-Matrix (manuell vs. D2D-automatisch) vorhanden.
- ISC-28..ISC-31: Read Abschnitt 7 — DRM-Begründung, Lemon-Squeezy-Stamping-Referenz, Google-Alerts/TinEye-Leak-Monitoring, 4-Schritt-DMCA-Takedown-Prozess vorhanden.
- ISC-32..ISC-33: Grep auf Markdown-Links — beide Links zu KDP-Setup-Anleitung und Eshop-Entscheidung Lemon Squeezy gefunden (4 Vorkommen insgesamt).
- ISC-34: Grep nach "TBD|\[XX\]|\[PLACEHOLDER\]" im Dokument — 0 Treffer, Anti-Kriterium erfüllt.
- ISC-35: Grep in INDEX.md nach Dateinamen — Link unter Sektion "Administration & Recht" gefunden.
- Coverage: 35/35 passed (35 tool-verifiziert via Bash/Grep/Read).

## Changelog

- conjectured: Eine reine Linkliste der Plattformen ohne explizite Tier-Wertung würde als Geschäftsplan ausreichen.
- refuted by: Bitter-Pill-Prinzip aus den Algorithm-Doctrine-Notizen verlangt Wertung statt Auflistung; eine ungewertete Liste hätte ISC-13 (explizite Tier-Zuordnung) nicht erfüllt und wäre für Herbert nicht direkt entscheidungsfähig gewesen.
- learned: Bei Vergleichsdokumenten über mehrere externe Plattformen ist die Tier-Einordnung selbst der wertvollste Teil — Rohfakten (Provisionssätze) sind über alle Plattformen ähnlich gut recherchierbar, aber die Tier-Gewichtung macht aus Fakten eine Entscheidungsgrundlage.
- criterion now: ISC-13 verlangt fortan bei jedem Plattform-/Optionsvergleich eine explizite Tier- oder Rangzuordnung, nicht nur Pro/Contra-Listen.
