# obsidian-qmd

Obsidian plugin for local QMD search, related notes, and auto-sync.

## Repo posture

- Keep plugin implementation local to this repo.
- Shared family assets may cover contracts, docs, and harness skeletons only.
- Do not reintroduce a `src/shared/` implementation layer by default.

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Build/watch and hot reload into an Obsidian vault |
| `pnpm build` | Type-check and production bundle |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest |
| `pnpm run ci` | Build + lint + test |
| `pnpm release:patch` | Run CI, bump version, push commit/tag |

## Release flow

`pnpm release:patch|minor|major` handles the supported release path:

1. `pnpm run ci`
2. `pnpm version <level>` updates `package.json`, `manifest.json`, and `versions.json`
3. `postversion` pushes the commit and tag
4. GitHub Actions publishes the release artifacts

Prefer the scripted release flow over manual tags or ad-hoc packaging.
