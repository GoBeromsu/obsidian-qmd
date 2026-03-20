# Obsidian QMD

Augmented search for Obsidian powered by [QMD](https://github.com/tobi/qmd) -- combines BM25 keyword search, semantic vector search, and hybrid queries to find notes by exact terms or by meaning.

## Features

- **Search modal** with four modes: keyword (BM25), semantic (vector), hybrid (combined), and advanced (structured `lex:`/`vec:`/`hyde:` queries)
- **Related notes sidebar** -- shows semantically related notes for the active file
- **Snippet highlighting** -- search results include highlighted text snippets with context
- **Wikilink insert** -- insert a wikilink to any search result directly into the active editor
- **Auto-sync** -- debounced background sync runs `qmd update` and `qmd embed` after note changes
- **Status bar** -- real-time sync and collection status indicator
- **Hover preview** -- hover over search results and related notes to preview content

## Prerequisites

- Obsidian desktop (desktop only)
- Local [`qmd`](https://github.com/tobi/qmd) binary installed and available on `PATH`, or configured in plugin settings
- A QMD collection whose path matches the current vault path

## Installation

This plugin is not yet available in the Obsidian community plugin directory.

### Manual Installation

```bash
cd <your-vault>/.obsidian/plugins
git clone https://github.com/GoBeromsu/obsidian-qmd.git obsidian-qmd
cd obsidian-qmd
pnpm install && pnpm build
```

Reload Obsidian and enable the plugin under **Settings > Community plugins**.

## Usage

1. Install and configure the `qmd` CLI on your system
2. Create a QMD collection pointing to your vault folder
3. Open the search modal with the command palette or hotkey
4. Type your query and switch between search modes using the mode selector
5. Click a result to open the note, or use the wikilink action to insert a link

## Commands

| Command | Description |
|---------|-------------|
| QMD: Open search | Open the search modal |
| QMD: Open related notes | Open the related notes sidebar |
| QMD: Refresh related notes | Refresh the related notes view |
| QMD: Sync qmd now | Run `qmd update` + `qmd embed` immediately |
| QMD: Run qmd update | Index new and changed files |
| QMD: Run qmd embed | Generate embeddings for unembedded documents |
| QMD: Re-scan qmd collections | Re-detect QMD collections for this vault |

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| QMD executable path | `auto` | Path to the `qmd` binary, or `auto` to detect from PATH |
| Collection override | _(empty)_ | Force a specific QMD collection name instead of auto-detecting |
| Default search mode | `hybrid` | Initial search mode when opening the modal |
| Preview result limit | `8` | Maximum number of results shown in search |
| Related result limit | `8` | Maximum number of related notes shown in the sidebar |
| Auto-sync enabled | `true` | Automatically run update + embed after note changes |
| Auto-sync debounce | `7000ms` | Delay before auto-sync triggers after the last change |
| Show mode selector | `true` | Show the search mode toggle in the search modal |
| Persist last mode | `true` | Remember the last-used search mode across sessions |
| Show sync status bar | `true` | Display QMD status in the status bar |

## Tech Stack

| Category | Technology |
|----------|------------|
| Platform | Obsidian Plugin API |
| Language | TypeScript 5 |
| Bundler | esbuild |
| Search engine | QMD CLI (BM25 + vector + hybrid) |
| Testing | Vitest |
| Linting | ESLint + Husky + lint-staged |

## Project Structure

```
obsidian-qmd/
├── src/
│   ├── main.ts              # Plugin entry point (QmdPlugin)
│   ├── settings.ts           # Default settings and mode labels
│   ├── types.ts              # Shared TypeScript types
│   ├── qmd/                  # QMD CLI adapter, auto-sync, query builder, path resolver
│   ├── ui/                   # Search modal, settings tab, result actions/renderer
│   ├── views/                # Related notes sidebar view
│   └── shared/               # Shared utilities (plugin-logger, plugin-notices)
├── scripts/                  # dev.mjs, version.mjs, release.mjs
├── boiler.config.mjs         # Per-repo config
└── manifest.json             # Obsidian plugin manifest
```

## Development

```bash
pnpm install
pnpm dev          # vault selection + esbuild watch + hot reload
pnpm build        # tsc type-check + production build
pnpm test         # Vitest unit tests
pnpm lint         # ESLint
pnpm run ci       # build + lint + test
```

## License

MIT
