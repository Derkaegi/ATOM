# Scientific Research Workflow

**Mode:** OpenAlex API — free, no key required | 250M+ academic works

## When to Use

- User says "find papers", "scientific research", "literature search", "academic search"
- User says "academic papers on X", "search openalex", "find me papers on"
- Explicit paper/literature searches — NOT for general web research

## Workflow

### Step 1: Parse Query

Extract the search term and any modifiers from the user's request:

| User says | Filter to add |
|-----------|--------------|
| "open access only" | `&filter=open_access.is_oa:true` |
| "since YYYY" | `&filter=publication_year:>YYYY` |
| "sort by citations" | `&sort=cited_by_count:desc` |
| (default) | `&sort=relevance_score:desc` |

Construct the final URL:
```
BASE = "https://api.openalex.org/works"
URL  = "{BASE}?search={ENCODED_QUERY}&per-page=10&sort=relevance_score:desc&mailto=herboko@gmail.com"
```
Append filters as needed.

### Step 2: Query OpenAlex API

Run the following (replace `{URL}` with the constructed URL):

```bash
curl -s "{URL}" | python3 -c "
import sys, json
data = json.load(sys.stdin)
total = data.get('meta', {}).get('count', 0)
results = data.get('results', [])
print(f'TOTAL:{total}')
for i, work in enumerate(results, 1):
    title = work.get('title', 'No title')
    year = work.get('publication_year', '?')
    loc = work.get('primary_location') or {}
    src = loc.get('source') or {}
    journal_name = src.get('display_name', 'Unknown venue')
    authorships = work.get('authorships', [])
    authors = ', '.join([a['author']['display_name'] for a in authorships[:3]])
    if len(authorships) > 3:
        authors += ' et al.'
    doi = work.get('doi', '')
    oa = work.get('open_access') or {}
    oa_url = oa.get('oa_url', '')
    print(f'---RESULT {i}---')
    print(f'TITLE:{title}')
    print(f'YEAR:{year}')
    print(f'AUTHORS:{authors}')
    print(f'JOURNAL:{journal_name}')
    if doi:
        print(f'DOI:{doi}')
    if oa_url:
        print(f'PDF:{oa_url}')
"
```

### Step 3: Display Results

Format the parsed output as:

```
🔬 OPENALEX: [N] results for "[query]"

1. Title (Year)
   Authors
   Journal
   DOI: ...
   PDF: https://... (if open access)

2. ...
```

Show all results returned (up to 10). If `oa_url` is present, it's a free PDF — highlight it.

### Step 4: Offer Zotero Import

After listing results, ask:

> "Add any to Zotero? Reply with numbers (e.g. '1 3 5') or 'all'."

**If user confirms**, load env vars and batch-add selected items:

```bash
source ~/.env
```

Map OpenAlex fields to Zotero item schema:

| OpenAlex field | Zotero field |
|----------------|-------------|
| `work.type` | `itemType` (see map below) |
| `title` | `title` |
| `authorships[].author.display_name` | `creators` (type: `author`) |
| `publication_year` | `date` |
| primary_location source name | `publicationTitle` |
| `doi` | `DOI` |
| `abstract_inverted_index` | `abstractNote` (reconstructed) |
| `open_access.oa_url` | `url` |

**itemType mapping** (fallback: `journalArticle`):

| OpenAlex `type` | Zotero `itemType` |
|-----------------|------------------|
| `journal-article` | `journalArticle` |
| `book` | `book` |
| `book-chapter` | `bookSection` |
| `proceedings-article` | `conferencePaper` |
| `preprint` | `preprint` |
| anything else | `journalArticle` |

**Reconstruct abstract** from inverted index (if present):

```python
def reconstruct_abstract(inverted_index):
    if not inverted_index:
        return ''
    positions = {}
    for word, pos_list in inverted_index.items():
        for pos in pos_list:
            positions[pos] = word
    return ' '.join(positions[k] for k in sorted(positions))
```

**POST to Zotero API:**

```bash
curl -s -X POST \
  "https://api.zotero.org/users/${ZOTERO_USER_ID}/items" \
  -H "Zotero-API-Key: ${ZOTERO_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "itemType": "journalArticle",
      "title": "...",
      "creators": [{"creatorType": "author", "name": "..."}],
      "date": "YYYY",
      "publicationTitle": "...",
      "DOI": "...",
      "abstractNote": "...",
      "url": "..."
    }
  ]'
```

**On success:** Confirm "Added [N] item(s) to Zotero (zotero.org/derkaegi)."

## Notes

- `mailto=herboko@gmail.com` is included in every request — places Herbert in OpenAlex's "polite pool" (better rate limits: 10 req/s vs shared pool)
- OpenAlex is free, open-access, no API key required
- Abstract reconstruction: OpenAlex stores abstracts as `{word: [positions]}` inverted index — reconstruct by sorting positions
- Total result count from `meta.count` can be in the millions; we show top 10 by relevance
