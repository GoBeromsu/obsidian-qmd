<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-25 | Updated: 2026-03-25 -->

# src/types/ — Pure Type Definitions

## Purpose

TypeScript type definitions only. No obsidian imports, no runtime code, no external dependencies. Imported by domain/, ui/, utils/, and main.ts.

## Key Files

| File | Purpose |
|------|---------|
| `index.ts` | All type exports: QmdSearchResult, QmdCollectionInfo, SyncState, QmdPluginSettings, RelatedQuerySource, NoteMetadata (shim), FileRef (shim) |

## For AI Agents

**All agents:** Read-only reference. Types are interface contracts for function signatures and API data shapes.

**obsidian-developer:** Adds new types when domain logic requires new data structures.

**obsidian-ui:** Uses types to ensure compile-time safety on plugin methods and adapter outputs.

## Constraints

- **NO obsidian imports** — not even type imports from obsidian package
- **NO runtime code** — only interface/type definitions
- **NO external deps** — pure TypeScript
- **Structural shims** — NoteMetadata and FileRef are minimal interfaces for domain code to avoid obsidian imports

## Key Types

**Search:**
- `QmdSearchMode`: 'keyword' | 'semantic' | 'hybrid' | 'advanced'
- `QmdSearchResult`: docid, score, file (virtual path), title, snippet
- `QmdOpenTarget`: 'current' | 'tab' | 'split'

**Collections:**
- `QmdCollectionInfo`: name, path, pattern, include, contexts

**Sync State:**
- `SyncPhase`: 'idle' | 'syncing' | 'embedding' | 'error'
- `SyncState`: phase, message, error (optional)

**Settings:**
- `QmdPluginSettings`: All user-configurable plugin behavior

**Queries:**
- `RelatedQuerySource`: title, aliases, tags, headings (extracted from note frontmatter)
- `CachedRelatedResult`: results array, timestamp

**Domain Shims:**
- `FileRef`: { path: string } — minimal Obsidian TFile interface
- `NoteMetadata`: { frontmatter?, tags?, headings? } — minimal Obsidian CachedMetadata interface
