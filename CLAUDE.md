# CLAUDE.md — Obsidian Boiler Template

> Git strategy, branch naming, commit convention, and release management are defined in the **root CLAUDE.md**. This file covers template-specific details only.

## Overview

Source-of-truth seed template for new Obsidian plugins. Changes here get propagated to all downstream plugins via the `obsidian-propagate` skill or `pnpm sync:plugins`.

## Build Commands

```bash
pnpm dev            # vault selection + esbuild watch + hot reload
pnpm dev:build      # esbuild build (no vault deploy)
pnpm build          # tsc type-check + production esbuild build
pnpm test           # Vitest unit tests
pnpm lint           # ESLint
pnpm lint:fix       # ESLint with auto-fix
pnpm ci             # build + lint + test
pnpm release:patch  # lint:fix → patch bump → auto-push tag
pnpm release:minor  # lint:fix → minor bump → auto-push tag
pnpm release:major  # lint:fix → major bump → auto-push tag
pnpm sync:plugins   # propagate template changes to downstream plugins
```

### sync:plugins options

```bash
node scripts/sync-to-plugins.mjs --dry-run                          # preview without writing
node scripts/sync-to-plugins.mjs --targets plugin-a,plugin-b        # sync specific targets only
```

Synced artifacts: `scripts/dev.mjs`, `scripts/version.mjs`, `.github/workflows/ci.yml`, `.github/workflows/release.yml`.

## Role

This repo serves as the canonical template. The workflow is:
1. Prove a new pattern here first
2. Propagate to downstream plugins via `sync:plugins` or the `obsidian-propagate` skill
3. Never diverge downstream plugins from this template without deliberate reason

## Project Layout

```
src/                  # Plugin source (entry: main.ts)
scripts/              # dev.mjs, version.mjs, sync-to-plugins.mjs
tooling/shared/       # Canonical dev.mjs & version.mjs (synced to plugins)
tooling/sync/         # Sync engine & workflow renderers
boiler.config.mjs     # Per-repo config (dev deploy, version staging, CI, release)
```

## Release

1. `pnpm ci` — MUST pass (build + lint + test)
2. `pnpm release:patch|minor|major` — lint:fix, version bump, auto-push tag (via `postversion`)
3. GitHub Actions handles CI + Release workflows (`ci.yml`, `release.yml`)

**DENIED by settings.json:** `git tag`, `git push --tags`, `gh release` — only `pnpm release:*` is allowed.

## Gotchas

- Default branch is `master` (not `main`)
- Tab indentation, width 4 (enforced by `.editorconfig`)
- `boiler.config.mjs` defines per-repo values — each downstream plugin has its own copy
