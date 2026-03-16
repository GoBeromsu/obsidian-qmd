# Obsidian QMD

Obsidian wrapper for the local [`qmd`](https://github.com/tobi/qmd) CLI.

## Features

- Search modal with QMD modes:
  - Keyword (`qmd search`)
  - Semantic (`qmd vsearch`)
  - Hybrid (`qmd query`)
  - Advanced structured queries (`lex:`, `vec:`, `hyde:`, `intent:`)
- Related-notes sidebar for the active note
- Debounced auto-sync that runs `qmd update` and `qmd embed` after note changes
- Manual commands for rescan, sync, update, and embed

## Development

```bash
pnpm install
pnpm run dev
```

Set `VAULT_PATH` or use the shared dev tooling prompts from the boiler template workflow.

## Requirements

- Obsidian desktop
- Local `qmd` binary installed and available on `PATH`, or configured in plugin settings
- A qmd collection whose path matches the current vault path

## License

MIT
