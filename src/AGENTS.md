<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-25 | Updated: 2026-03-25 -->

# src/ — QMD Plugin Source

## Purpose

Root composition layer wiring all domain, UI, types, utils, and shared modules into the Obsidian plugin entry point. The plugin manages QMD process communication, auto-sync orchestration, settings persistence, and search/related-notes UI.

## Key Files

| File | Purpose |
|------|---------|
| `main.ts` | Plugin entry point (load/unload), command registration, vault watchers, status bar, settings management |

## Subdirectories

- `domain/` — Business logic (auto-sync, path resolution, settings constants), no obsidian imports
- `ui/` — Obsidian-dependent UI modules (search modal, related view, settings tab, process adapter)
- `types/` — Pure TypeScript type definitions
- `utils/` — Stateless utility functions (parsing, query building)

## For AI Agents

**obsidian-developer:** Implements domain logic, wiring, and infrastructure. Owns composition root, command registration, vault event handling.

**obsidian-ui:** Designs and implements Obsidian-dependent views, modals, settings tabs, status bar UX.

**obsidian-qa:** Runs static code review, runtime verification via obsidian-cli, screenshots.

## Dependencies

- `domain/`: No external deps
- `ui/`: Depends on `obsidian` API, `domain/`, `types/`, and `utils/`
- `main.ts`: Imports from all layers (composition root)

## Architecture Notes

**One-way dependency flow:**
```
utils/ ──┐
types/ ──┼── domain/ ── ui/ ── main.ts
         └───────────────────┘
```

**Key patterns:**
- `AutoSyncController`: Debounced sync orchestration without obsidian imports
- `QmdProcessAdapter`: Child process I/O and parsing (ui/ layer — has obsidian imports for notices)
- `VaultPathResolver`: Bidirectional slug↔path mapping for search result resolution
- Notices catalog in `main.ts`: Centralized user-facing messages
