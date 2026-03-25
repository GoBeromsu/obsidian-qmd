<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-25 | Updated: 2026-03-25 -->

# tooling/ — Build and Development Tooling

## Purpose

Scripts and utilities for development, releases, and cross-plugin synchronization. Includes shared canonical dev/version scripts and sync engine.

## Subdirectories

- `shared/` — Canonical dev.mjs and version.mjs (synced to all plugins)
- `sync/` — Sync engine and workflow renderers (sync-to-plugins.mjs, templates)

## For AI Agents

**All agents:** Reference only. Build/release tasks use these scripts; never modify tooling directly without CI/release workflow coordination.

**obsidian-developer:** Understands boiler-template sync workflow; coordinates with root CI/release workflows.

**obsidian-qa:** Verifies CI/release workflows pass; tests dev mode and pnpm run ci locally.

## Key Scripts (via shared/)

| Script | Purpose |
|--------|---------|
| `dev.mjs` | Vault selection, esbuild watch, hot reload orchestration |
| `version.mjs` | Semver bump, manifest update, changelog generation |

## Sync Workflow

**Entry point:** `pnpm sync:plugins`

**Config:** `boiler.config.mjs` (per-repo)

**Synced targets:**
- `scripts/dev.mjs`
- `scripts/version.mjs`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`

**Options:**
- `--dry-run`: Preview without writing
- `--targets plugin-a,plugin-b`: Sync specific plugins only

## Dependencies

- Boiler-template is the canonical source
- All changes flow from boiler-template → plugins (never plugin → boiler-template directly)
- Sync engine is part of boiler-template; plugins import it

## Commands

```bash
pnpm dev                         # Run dev.mjs with vault selection
pnpm dev:build                   # Build without vault deploy
pnpm build                       # Type-check + production build
pnpm release:patch|minor|major   # CI → version bump → auto-push tag
pnpm sync:plugins --dry-run      # Preview sync changes
```
