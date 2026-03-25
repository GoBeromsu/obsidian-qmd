<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-25 | Updated: 2026-03-25 -->

# tooling/sync

## Purpose
Sync engine (copied from obsidian-boiler-template) that pulls shared file updates into this plugin. Run `pnpm sync:check` to detect drift against the canonical boiler-template source.

## Key Files

| File | Description |
|------|-------------|
| `index.mjs` | Sync runner — applies shared file updates from boiler-template |

## For AI Agents

### Working In This Directory
- Do NOT edit `index.mjs` directly — it is synced from boiler-template
- Run `pnpm sync:check` to detect drift
- To update shared files, modify boiler-template first, then propagate

## Dependencies
- `obsidian-boiler-template/tooling/sync/` — canonical source
