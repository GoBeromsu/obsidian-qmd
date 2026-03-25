<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-25 | Updated: 2026-03-25 -->

# src/domain/ — Business Logic (No Obsidian Imports)

## Purpose

Pure business logic layer: auto-sync orchestration, vault path resolution, and settings constants. Importable only by `ui/`, `main.ts`, and testable in isolation without Obsidian runtime.

## Key Files

| File | Purpose |
|------|---------|
| `auto-sync.ts` | Debounced sync controller: tracks dirty state, queues retries, orchestrates update/embed phases |
| `path-resolver.ts` | Bidirectional slug↔path mapping for QMD virtual paths (qmd://collection/…) to vault-relative paths |
| `settings.ts` | Settings constants (search mode labels, descriptions, DEFAULT_SETTINGS) |

## For AI Agents

**obsidian-developer:** Owns all domain logic. Implements pure functions and stateful controllers (no obsidian imports, no side effects except via dependency injection).

**obsidian-ui:** Reads domain constants; passes callbacks to orchestrators. Does not modify domain code.

**obsidian-qa:** Unit tests all domain code with minimal stubs; verifies no obsidian imports leak in.

## Constraints

- **NO obsidian imports** — not even type imports
- **Dependency injection only** — side effects passed as callbacks, not internal calls
- **Pure functions** in `path-resolver.ts` and `settings.ts`
- **Stateful orchestrator** in `auto-sync.ts` with clear lifecycle

## Key Patterns

**AutoSyncController:**
- Debounces vault mutations (default 7000ms)
- Tracks dirty/running/rerun states to avoid race conditions
- Calls update() then embed() in sequence
- Notifies UI via callbacks (phase, message, error)

**VaultPathResolver:**
- Lazy rebuild when dirty (not on every resolve)
- Handles emoji-to-hex conversion (mirrors QMD's handelize)
- Maps slugified search result paths back to vault-relative paths

**Settings:**
- All defaults in one place (DEFAULT_SETTINGS)
- Search mode labels and descriptions for UI
