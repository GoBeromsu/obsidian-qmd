<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-25 | Updated: 2026-03-25 -->

# src/ui/ — Obsidian-Dependent Views, Modals, Settings

## Purpose

User-facing UI layer with direct Obsidian API access. Implements search modal, related-notes view, settings tab, status bar, and QMD process adapter. Imports from domain/, types/, utils/, shared/, and obsidian.

## Key Files

| File | Purpose |
|------|---------|
| `search-modal.ts` | Modal for keyword/semantic/hybrid/advanced search with mode switching, debounced results, keyboard nav |
| `related-view.ts` | Side panel view showing related notes for active file, with caching and file-open debounce |
| `settings-tab.ts` | Settings UI (executable path, search defaults, sync behavior, notice muting) |
| `qmd-process-adapter.ts` | Child process spawning, executable resolution, output parsing, collection discovery |
| `result-renderer.ts` | Renders individual search result items with title, snippet, score, action buttons |
| `result-actions.ts` | Copy wikilink, insert link, open in tab/split actions |
| `highlight.ts` | Query term highlighting in search result snippets |

## For AI Agents

**obsidian-ui:** Owns all UI design and implementation. Implements modals, views, settings, result rendering, and styling.

**obsidian-developer:** Implements process adapter and orchestration wiring (search/openResult methods on plugin). Integrates with domain controllers.

**obsidian-qa:** Screenshots views/modals, verifies result rendering accuracy, tests action flows (copy, insert, open).

## Dependencies

- Imports from: `obsidian`, `domain/`, `types/`, `utils/`, `shared/`
- No reverse imports from ui/ back to domain/
- Process adapter reads from utils/ parsers

## Key Patterns

**Search Modal:**
- Single active modal instance (static tracking)
- Debounced search with ticket-based deduplication
- Async search with in-flight queueing
- Keyboard navigation (arrow keys, enter, escape)
- Mode indicator and quick-chip insertion for advanced mode

**Related View:**
- LRU cache (20 entries, 60s TTL) to avoid repeated searches
- File-open debounce (300ms) to batch initial renders
- Ticket-based result deduplication for in-flight requests
- "Showing cached" indicator when results are stale

**Settings Tab:**
- Executable path with auto-detect description
- Inline backend status (resolved binary, active collection)
- Per-setting callbacks (onChange → saveSettings → refreshBackendState)

**Process Adapter:**
- Resolves executable via which/npm/bun/nvm/env PATH
- Falls back to @tobilu/qmd npm package
- Spawns child with 10MB output buffer
- Parses collection list, collection show, search results JSON
