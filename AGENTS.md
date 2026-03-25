<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-25 | Updated: 2026-03-25 -->

# obsidian-qmd

## Purpose
QMD — Obsidian plugin integrating a local QMD semantic search process into the vault. Surfaces related notes via a **Related** side view and a fuzzy/semantic **Search** modal. Runs `qmd` as a child process (desktop-only), auto-syncing vault markdown files to keep the index fresh.

## Key Files

| File | Description |
|------|-------------|
| `src/main.ts` | Composition root — QMDPlugin class, onload/onunload, commands, views |
| `src/domain/settings.ts` | DEFAULT_SETTINGS, SmartSettings interface |
| `src/domain/path-resolver.ts` | Resolves vault-relative paths to absolute (QMD process boundary) |
| `src/domain/auto-sync.ts` | Debounced auto-sync logic — triggers QMD reindex on file changes |
| `src/ui/related-view.ts` | Related notes side panel (ItemView) |
| `src/ui/search-modal.ts` | Semantic + fuzzy search modal (SuggestModal) |
| `src/ui/settings-tab.ts` | Settings tab — QMD binary path, sync options |
| `src/ui/qmd-process-adapter.ts` | Spawns and communicates with the QMD child process |
| `src/ui/result-renderer.ts` | Renders search/related results with score badges |
| `src/ui/result-actions.ts` | Context menu actions on results (open, copy path) |
| `src/ui/highlight.ts` | Search term highlighting in result text |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `src/domain/` | Business logic — NO obsidian imports |
| `src/ui/` | Obsidian-dependent views, modals, settings, process adapter |
| `src/types/` | Pure type definitions |
| `src/utils/` | Pure utility functions |
| `src/shared/` | Boiler-template synced files — DO NOT EDIT |

## For AI Agents

### Working In This Directory
- 4-layer architecture: `domain/` must not import `obsidian`
- `qmd-process-adapter.ts` is the only file that spawns child processes — keep I/O boundary here
- `path-resolver.ts` handles the vault-relative → absolute path translation; always use it at the boundary
- `src/shared/` synced from `obsidian-boiler-template` — never edit directly
- `isDesktopOnly: true` — Node.js child_process APIs are safe to use

### Testing Requirements
```bash
pnpm run ci       # build + lint + test
pnpm run lint     # ESLint — 0 errors required
pnpm run build    # tsc type-check + esbuild
```

### Common Patterns
- Auto-sync uses a debounce controller from `src/shared/` — do not add raw setTimeout
- Results rendered with `result-renderer.ts` — extend there, not in individual views

## Dependencies

### Internal
- `obsidian-boiler-template` — source of truth for `src/shared/`

### External
- `obsidian` — Obsidian Plugin API
- `qmd` CLI — external binary, path configured in settings
