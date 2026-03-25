<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-25 | Updated: 2026-03-25 -->

# src/utils/ — Pure Utility Functions

## Purpose

Stateless, side-effect-free utility functions for parsing QMD output, formatting, and query validation. No obsidian imports, no external dependencies except Node.js stdlib.

## Key Files

| File | Purpose |
|------|---------|
| `parser.ts` | Parse QMD CLI output (collections, search results), path normalization, snippet formatting, query term extraction, structured query validation |
| `query-builder.ts` | Extract note metadata into query source, build related-notes queries from frontmatter/tags/headings, sanitize for vec/hyde modes |

## For AI Agents

**obsidian-developer:** Adds new parsers when QMD CLI changes or new search modes are added.

**obsidian-ui:** Calls parser functions to deserialize adapter output; calls query-builder to construct search documents.

**obsidian-qa:** Unit tests all parsing edge cases (malformed JSON, emoji paths, frontmatter variance).

## Constraints

- **NO obsidian imports**
- **NO state** — all functions pure and deterministic
- **Minimal Node.js stdlib only** — path, no fs/os/child_process
- **No external deps** — testable without mocks

## Key Functions

**Parsing (parser.ts):**
- `normalizeFsPath(value)`: Resolve and normalize filesystem paths
- `parseCollectionList(stdout)`: Extract collection names from qmd collection list output
- `parseCollectionShow(stdout)`: Extract QmdCollectionInfo from collection show output
- `parseSearchResults(stdout)`: Parse JSON array of search results
- `toVaultRelativePath(value, collectionName)`: Convert qmd://collection/path to vault-relative
- `formatSnippet(snippet)`: Strip frontmatter, emoji markers, normalize whitespace
- `extractQueryTerms(query)`: Split query into significant words (no stop words, min 3 chars)
- `validateStructuredQueryDocument(input)`: Validate lex:/vec:/hyde:/intent: line format and syntax

**Query Building (query-builder.ts):**
- `buildRelatedQuerySource(filePath, _content, metadata)`: Extract title, aliases, tags, headings from note
- `buildRelatedQueryDocument(source)`: Generate structured lex:/vec:/hyde: document for related search
- `asArray(value)`: Coerce frontmatter field to string array (handle comma-split, nested)
- `unique(values, limit)`: Deduplicate and limit results
- `formatLexTerm(value)`: Quote terms with spaces for keyword search
- `sanitizeForVec(value)`: Remove hyphens (QMD rejects -term negation in vec/hyde)

## Edge Cases

**Emoji handling:** Converts emoji runs to hex codepoints (mirrors QMD's handelize)

**Frontmatter variance:** Aliases may be string, array, or comma-separated; tags may be prefixed with #

**Query sanitization:** Vec/hyde queries reject hyphens; must replace with spaces (safe for semantic queries)

**Stop words:** Filters 50 common English words to reduce noise in query term extraction
