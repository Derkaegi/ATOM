---
task: "Create Band 2 Co-Author Contract v2 and Wladimir Email"
slug: pokerstories-band2-vertrag-v2
effort: E2
phase: complete
progress: 18/18
mode: algorithm
started: 2026-05-29
updated: 2026-05-29
---

## Problem

The original Band 2 co-author contract template uses a 50/50 royalty split and treats both authors as equal co-authors. The actual arrangement has changed: Herbert writes 100% of the content (chapters 6-10, excursuses), while Wladimir's sole contribution is fact-checking via spreadsheet and writing his own biography. This asymmetry demands a revised contract (70/30 split) and a companion email to Wladimir requesting signature.

## Vision

Herbert has two ready-to-send documents: a legally clear, professionally worded co-author contract reflecting his role as sole author and publisher (70% share) vs. Wladimir's supporting contributor role (30% share), plus a friendly English email that lands collegially and moves Wladimir to sign and request his Ansässigkeitsbescheinigung.

## Out of Scope

- Legal review or actual legal advice
- German tax filings or tax calculations
- Band 1 contract or other PokerStories contracts
- Translations into other languages

## Constraints

- No em dashes anywhere (use comma, colon, or parenthesis)
- German for the contract body (legal document)
- English for the email
- Royalty: 70% Herbert / 30% Wladimir
- Not KDP Select
- Quarterly accounting
- German law, venue at Wladimir's domicile
- 10% Quellensteuer if no Ansässigkeitsbescheinigung

## Goal

Produce two files: (1) a revised Co-Autoren-Vertrag Band 2 v2 at the specified path, adapted from the existing template with 70/30 split and Wladimir as contributing fact-checker; (2) a short English email draft to Wladimir requesting signature by June 7, 2026 and reminding him to obtain his Ansässigkeitsbescheinigung.

## Criteria

- [ ] ISC-1: Contract file written to correct absolute path
- [ ] ISC-2: Email file written to correct absolute path
- [ ] ISC-3: Contract royalty split reads 70% Herbert / 30% Wladimir
- [ ] ISC-4: Contract §2 reflects Herbert as primary author (100% content), Wladimir as contributor
- [ ] ISC-5: Contract §6 task table updated: Wladimir's tasks limited to Fact-Check-Spreadsheet + Autorenbiografie
- [ ] ISC-6: Contract §3 KDP Select clause unchanged (NICHT eingeschrieben)
- [ ] ISC-7: Contract §4 quarterly accounting retained
- [ ] ISC-8: Contract §4 Quellensteuer clause mentions 10% and Ansässigkeitsbescheinigung
- [ ] ISC-9: Contract §10 cover name order TBD retained
- [ ] ISC-10: Contract §11 German law and Wladimir's domicile as venue
- [ ] ISC-11: No em dashes in contract text
- [ ] ISC-12: No em dashes in email text
- [ ] ISC-13: Email subject line matches specified format (double hyphen not em dash)
- [ ] ISC-14: Email deadline for signing: 7. Juni 2026
- [ ] ISC-15: Email mentions Ansässigkeitsbescheinigung request at Finanzamt
- [ ] ISC-16: Email tone is collegial English, not stiff
- [ ] ISC-17: Anti: Contract does NOT contain 50/50 split language
- [ ] ISC-18: Anti: No "Exkurs" in email (English text uses "Excursus" or "Digression" if needed)

## Test Strategy

| isc | type | check | threshold | tool |
|-----|------|-------|-----------|------|
| ISC-1 | file | Read path exists | file readable | Read |
| ISC-2 | file | Read path exists | file readable | Read |
| ISC-3 | content | Grep "70%" in contract | found | Grep/Read |
| ISC-4 | content | Read §2 text | correct framing | Read |
| ISC-5 | content | Read §6 table | Wladimir rows limited | Read |
| ISC-6 | content | Grep "NICHT" + "KDP Select" | found | Grep |
| ISC-7 | content | Grep "Quartal" | found | Grep |
| ISC-8 | content | Grep "10%" + "Ansässigkeitsbescheinigung" | found | Grep |
| ISC-9 | content | Grep "TBD" or "wird gemeinsam festgelegt" | found | Grep |
| ISC-10 | content | Grep "deutsches Recht" + venue placeholder | found | Grep |
| ISC-11 | content | Grep " -- " or " — " in contract | NOT found | Grep |
| ISC-12 | content | Grep " -- " or " — " in email | NOT found | Grep |
| ISC-13 | content | Grep subject line in email | matches | Read |
| ISC-14 | content | Grep "7. Juni" or "June 7" in email | found | Grep |
| ISC-15 | content | Grep "Ansässigkeitsbescheinigung" in email | found | Grep |
| ISC-16 | content | Read email tone | collegial | Read |
| ISC-17 | anti | Grep "50%" in contract | NOT found | Grep |
| ISC-18 | anti | Grep "Exkurs" in email | NOT found | Grep |

## Verification

(to be filled at EXECUTE)
