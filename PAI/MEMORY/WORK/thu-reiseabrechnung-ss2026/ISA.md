---
task: THU-Reiseabrechnung SS2026 als Google Sheet + spanische Steuerübersicht
slug: thu-reiseabrechnung-ss2026
effort: E2
phase: complete
progress: 17/17
mode: standard
started: 2026-07-10T09:45:00+02:00
updated: 2026-07-10T09:45:00+02:00
---

## Problem

Herbert muss seinen THU-Lehrauftrag SS2026 abrechnen (PDF-Formular füllt er manuell), hat aber keine konsolidierte Übersicht: Termine, Stunden, Bahnkosten und Belege liegen verstreut in Q2-Zip, Downloads, Q1-CSV und Gmail. Zusätzlich fehlt für die spanische Renta eine Trennung in erstattete (Zugtickets) und nicht erstattete Reisekosten (Flüge, Aerobus).

## Goal

Ein Google Sheet `SS2026_THU_Reiseabrechnung` im THU-Drive-Ordner mit Tab 1 (alle 15 Termine, je 4 Std., Bahnkosten mit Beleg-Links, Summenzeilen) und Tab 2 (Steuer ES: erstattet vs. nicht erstattet), alle Reisebelege im Ordner "Kosten & Belege", plus Markdown-Report in MONAD.

## Criteria

- [x] ISC-1: Sheet `SS2026_THU_Reiseabrechnung` existiert im Drive-Ordner `1aanKgsKKlgs3-WDCnwc1cA9uv3EhjGgn` (Probe: gws drive files list)
- [x] ISC-2: Tab 1 enthält Kopfdaten Name, geb. 31.10.1978, Titel, Lehrauftrag 01.03.-31.08.2026 (Probe: gws sheets get)
- [x] ISC-3: Tab 1 enthält alle 15 Termine chronologisch von 17.03. bis 07.07. (Probe: gws sheets get, Zeilenzählung)
- [x] ISC-4: Jeder Termin hat 4 Std., Summenzeile zeigt 60 mit Hinweis auf 64-Std.-Vertragswert (Probe: gws sheets get)
- [x] ISC-5: Jede Präsenzreise hat Bahnkosten-Beträge, die den Beleg-PDFs entsprechen (Probe: Abgleich gegen PDF-Reads)
- [x] ISC-6: Jeder Bahnkosten-Eintrag hat einen funktionierenden Drive-Link auf den Beleg (Probe: Link-IDs gegen Ordnerlisting)
- [x] ISC-7: Summenzeile "Kosten Nutzung öffentlicher Nahverkehr" stimmt mit Summe der Einzelbeträge überein (Probe: Nachrechnung)
- [x] ISC-8: Alle DB-Ticket-Belege (April, Juni, ggf. Juli) liegen im Ordner "Kosten & Belege" ohne Duplikate (Probe: gws drive files list)
- [x] ISC-9: Gmail wurde nach Juli-Belegen (DB, Aerobus, Vueling) durchsucht; Funde hochgeladen oder Fehlen dokumentiert (Probe: gws gmail Suchergebnis)
- [x] ISC-10: Fehlende Belege sind im Sheet explizit als FEHLT markiert, nicht weggelassen (Probe: gws sheets get)
- [x] ISC-11: Tab 2 Abschnitt A listet alle Zugtickets mit Datum, Betrag, Beleg-Link, Termin-Zuordnung und Summe (Probe: gws sheets get)
- [x] ISC-12: Tab 2 Abschnitt B listet Flüge und Aerobus mit Summe (Probe: gws sheets get)
- [x] ISC-13: Tab 2 hat Kopfnotiz zu Renta/IRPF und Nicht-Absetzbarkeit erstatteter Kosten (Probe: gws sheets get)
- [x] ISC-14: MONAD-Report `2026-07-10-THU-Reiseabrechnung-SS2026.md` existiert mit beiden Summen und Sheet-Link (Probe: Read)
- [x] ISC-15: MonadIndex wurde nach dem Report-Write regeneriert (Probe: Bash-Output)
- [x] ISC-16: Anti: Das bestehende Google Doc "SS2026__Abrechnungsformular" und dessen PDF wurden nicht verändert (Probe: modifiedTime unverändert)
- [x] ISC-17: Anti: Kein Text-Output (Sheet, Report, Nachricht) enthält em dashes (Probe: grep auf Report + Sheet-Werte)

## Test Strategy

| isc | type | check | threshold | tool |
|-----|------|-------|-----------|------|
| 1 | api | Datei im Ordner gelistet | exakt 1 Treffer | gws drive |
| 2-4 | api | Zellwerte lesen | Werte identisch | gws sheets |
| 5,7 | calc | Beträge gegen PDFs nachrechnen | centgenau | Read + Bash |
| 6,8 | api | Ordnerlisting vs. Links | alle IDs auflösbar | gws drive |
| 9 | api | Gmail-Query ausgeführt | Ergebnis dokumentiert | gws gmail |
| 10-13 | api | Zellwerte lesen | Muster vorhanden | gws sheets |
| 14 | file | Report lesen | Summen + Link enthalten | Read |
| 15 | cmd | Index-Regeneration | Exit 0 | Bash |
| 16 | api | modifiedTime des Docs | unverändert | gws drive |
| 17 | text | em-dash-Suche | 0 Treffer | grep |

## Decisions

- 2026-07-10 09:45 Delegation-Floor (E2 ≥1) verzichtet, show-your-math: sequentieller gws-Workflow mit gemeinsamem Auth- und Datenkontext; ein Subagent müsste die komplette Beleg-Zuordnung duplizieren und würde keine Zeit sparen.
- 2026-07-10 09:45 Tier E2 per context-override statt Classifier: Plan bereits interaktiv genehmigt, Exploration abgeschlossen, verbleibende Arbeit ist Ausführung.

## Verification

(wird während EXECUTE/VERIFY befüllt)

ISC-1: gws drive list zeigt Sheet 1kygtYQJN5I... im Ordner 1aanKg... nach addParents
ISC-2-4: values get: B25=60, Kopfzeilen geschrieben (154 Zellen, A1:E42), Hinweis auf 64 Std. in D25
ISC-5,7: C42=547,59 gleich Handrechnung 44,99+42,99+42,99+64,99+34+32,70+40,99+45,99+67,99+24,99+24,99+39,99+39,99
ISC-6,8: Ordnerlisting zeigt 19 Dateien mit sprechenden Namen, IDs stammen aus Upload-Responses, keine Duplikate
ISC-9: Gmail durchsucht: 2 DB-Buchungen 06.07. (je 39,99) + Vueling-Factura 151,98 gefunden und hochgeladen
ISC-10: Fehlende Aerobus-Belege in Tab 2 Zeile 33 als FEHLENDE BELEGE gelistet
ISC-11-13: Tab 2: D19=547,59 (erstattet), D29=624,17 (nicht erstattet), D31=1.171,76, Renta-Hinweis Zeile 2
ISC-14: Report geschrieben, Read-State bestätigt; ISC-15: MonadIndex Exit 0, 1541 Dateien
ISC-16: Doc modifiedTime 2026-03-18T06:28:47Z, unverändert
ISC-17: grep em dash in Report + Sheet-Payload: 0 Treffer

## Changelog

- conjectured: Die zwei 24,99-Tickets vom 14.06. (BEL+EIN) seien Duplikate desselben Tickets.
  refuted by: pdftotext beider PDFs: Landau(Isar)>Ulm vs. Ulm>MUC Flughafen, beide Reisedatum 16.06.
  learned: BEL/EIN-Doppelungen in Q-Zips nie nach Dateiname beurteilen, immer Ticketinhalt lesen.
  criterion now: ISC-5 verlangt Betrag-Strecken-Abgleich per PDF-Inhalt, nicht per Dateiname.
