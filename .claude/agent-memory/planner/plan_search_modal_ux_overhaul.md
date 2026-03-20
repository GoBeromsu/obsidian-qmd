---
name: QMD Search Modal UX Overhaul Plan
description: Detailed implementation plan for simplifying the QMD search modal - removing banner, collapsing mode tabs into dropdown, Omnisearch-style clean search
type: project
---

# Implementation Plan: QMD Search Modal UX Overhaul

## Overview

Transform the QMD search modal from a cluttered, mode-centric UI into a clean, Omnisearch-style "just search" experience. The default Hybrid mode should work transparently, mode selection becomes a secondary control, the banner is removed, and the overall chrome is reduced so users see: input field, then results. All existing functionality is preserved.

## Decision Table

| Topic | Decision |
|-------|----------|
| Default mode | Hybrid (already the default in settings, but now also the visual default) |
| Mode exposure | Collapsed into a small dropdown/indicator on the right side of the input row, not prominent tabs |
| Banner | Removed entirely. Setup errors use inline notice inside the meta area |
| Mode labels | Rename to user-friendly: "Exact match", "Meaning-based", "Best of both" (default), "Custom query" |
| Tab key behavior | Keep Tab to cycle modes (power user shortcut), but no visible tabs |
| Advanced mode | Still accessible via dropdown; advanced panel appears below input when selected |
| Auto-mode suggestion | Deferred to a future iteration (too complex for this pass) |
| Placeholder text | Single generic placeholder: "Search your vault..." regardless of mode |
| Instructions bar | Keep but simplify: remove "tab switch mode" since modes are now in dropdown |
| Settings changes | Add `showModeSelector` toggle (default: true). Rename mode labels in SEARCH_MODE_LABELS |
| Animation | Keep staggered fade-in, keep snippet highlighting |
| Keyboard shortcuts | All existing shortcuts preserved |

## Architecture Changes

### Files Modified

1. **`src/ui/search-modal.ts`** — Major changes: remove banner, replace tabs with dropdown, update placeholders, update instructions
2. **`styles.css`** — Remove banner styles, remove tab styles, add dropdown/mode-indicator styles
3. **`src/settings.ts`** — Update SEARCH_MODE_LABELS to user-friendly names, add `showModeSelector` setting
4. **`src/types.ts`** — Add `showModeSelector` to QmdPluginSettings interface
5. **`src/ui/settings-tab.ts`** — Add toggle for `showModeSelector`

### Files NOT Modified

- `src/ui/result-renderer.ts` — No changes needed, results rendering stays the same
- `src/main.ts` — No changes needed, search/mode logic stays the same
- `src/qmd/` — No backend changes

## Detailed Design

### 1. Remove the Banner

The banner (`qmd-search-banner`) currently shows "Collection: obsidian . Hybrid" or setup error messages. This wastes vertical space for information the user never needs during search.

**Change:**
- Remove `bannerEl` field and all `renderBanner()` calls from `search-modal.ts`
- Setup error messages move into the `metaEl` area (already used for "Searching..." and result counts)
- Remove `.qmd-search-banner` CSS entirely
- In `submitCurrentQuery()`, the setup message check already calls `new Notice()` — that's sufficient

### 2. Replace Mode Tabs with Inline Dropdown

Instead of 4 prominent pill buttons taking a full row, replace with a small mode indicator inside the search input row.

**Layout change for `.qmd-search-input-row`:**
```
[search-icon] [input field] [mode-dropdown-button] [clear-button]
```

The mode dropdown button shows the current mode icon/label and opens a small popover or native `<select>` on click.

**Implementation approach — Use a clickable mode indicator + popover menu:**

```html
<div class="qmd-search-input-row">
  <div class="qmd-search-icon"><!-- search icon --></div>
  <input class="qmd-search-input" placeholder="Search your vault..." />
  <button class="qmd-mode-indicator">
    <span class="qmd-mode-label">Best of both</span>
    <svg><!-- chevron-down --></svg>
  </button>
  <button class="qmd-search-clear"><!-- x icon --></button>
</div>
```

When clicked, the mode indicator shows a small dropdown menu below it with 4 options. Each option has:
- The friendly label ("Exact match", "Meaning-based", "Best of both", "Custom query")
- A subtle description line underneath

**Why not a native `<select>`?** Native selects can't show descriptions, can't be styled to match Obsidian's design language, and look out of place.

**Dropdown implementation:** Use Obsidian's `Menu` class (from `obsidian` module). It's the standard way to show context menus and dropdown menus in Obsidian plugins. This is simpler than building a custom popover and matches the platform.

```typescript
import { Menu } from 'obsidian';

private showModeMenu(): void {
  const menu = new Menu();
  for (const mode of SEARCH_MODE_ORDER) {
    menu.addItem((item) => {
      item.setTitle(SEARCH_MODE_LABELS[mode]);
      item.setChecked(this.mode === mode);
      item.onClick(() => this.setMode(mode));
    });
  }
  const rect = this.modeIndicatorEl.getBoundingClientRect();
  menu.showAtPosition({ x: rect.left, y: rect.bottom + 4 });
}
```

### 3. Update Mode Labels

In `src/settings.ts`, change from technical to user-friendly labels:

```typescript
export const SEARCH_MODE_LABELS: Record<QmdSearchMode, string> = {
  keyword: 'Exact match',
  semantic: 'Meaning-based',
  hybrid: 'Best of both',
  advanced: 'Custom query',
};
```

Add a secondary description map for the dropdown hover/tooltip or settings:

```typescript
export const SEARCH_MODE_DESCRIPTIONS: Record<QmdSearchMode, string> = {
  keyword: 'BM25 keyword search for exact terms',
  semantic: 'Vector search for conceptual similarity',
  hybrid: 'Combined keyword + semantic (recommended)',
  advanced: 'Structured query with lex/vec/hyde fields',
};
```

### 4. Simplify the Search Input

- Remove mode-specific placeholders. Use a single: `"Search your vault..."`
- The input should feel large and inviting (already 46px min-height, which is good)
- When in Advanced mode, the simple input hides and the advanced textarea appears (same as now, but the transition is triggered from the dropdown instead of tabs)

### 5. Update Instructions Bar

Remove the "tab switch mode" instruction. Keep the rest. Also, since Tab still works as a shortcut, power users who discover it will benefit, but it's not advertised.

Updated instructions:
```
[up/down] navigate  |  [enter] open  |  [cmd/ctrl+enter] new tab  |  [alt+enter] split  |  [alt+o] open, keep modal  |  [shift+enter] insert link
```

For advanced mode, same as now (cmd/ctrl+enter to run query).

### 6. Settings Changes

**New setting: `showModeSelector`** (boolean, default: `true`)
- When `true`: the mode indicator button is visible in the input row
- When `false`: it's hidden, and the default mode is always used (pure Omnisearch-style)
- This allows power users to completely hide mode switching if they want

**Setting tab:** Add a toggle "Show mode selector in search" under "Persist last mode".

### 7. CSS Changes Summary

**Remove:**
- `.qmd-search-banner` and `.qmd-search-banner.is-visible`
- `.qmd-search-tabs`
- `.qmd-search-tab` and `.qmd-search-tab:hover` and `.qmd-search-tab.is-active`

**Add:**
- `.qmd-mode-indicator` — small pill-style button in the input row
- `.qmd-mode-label` — text inside the indicator

**Modify:**
- `.qmd-search-input-row` grid — change from `20px 1fr auto` to `20px 1fr auto auto` to accommodate mode indicator before clear button
- `.qmd-search-shell` — reduce gap from 12px to 8px (less chrome between elements)

### 8. Interaction Flow

**Default experience:**
1. User opens search modal (Cmd+Shift+O or command palette)
2. Sees: clean search input with "Search your vault..." placeholder
3. Types query, results appear below (Hybrid mode, transparent)
4. Uses arrow keys or mouse to navigate, Enter to open

**Power user flow:**
1. Clicks the mode indicator pill (e.g., "Best of both") in the input row
2. Obsidian Menu appears with 4 options, current one checked
3. Selects a different mode, menu closes, search re-runs
4. OR presses Tab to cycle modes (no visual tabs, but mode indicator updates)

**Advanced mode flow:**
1. User selects "Custom query" from dropdown
2. Simple input hides, advanced panel (chips + textarea) appears
3. User writes structured query, presses Cmd+Enter to run
4. Results appear below

## Wave Execution

### Wave 1: Foundation (Types + Settings + Labels)

**Agents:** obsidian-developer
**Files owned:** `src/types.ts`, `src/settings.ts`
**Checkpoint:** `pnpm build`

1. **Update QmdPluginSettings** (File: `src/types.ts`, Owner: obsidian-developer)
   - Add `showModeSelector: boolean` to the interface
   - Risk: Low

2. **Update settings defaults and labels** (File: `src/settings.ts`, Owner: obsidian-developer)
   - Change `SEARCH_MODE_LABELS` to user-friendly names
   - Add `SEARCH_MODE_DESCRIPTIONS` map
   - Add `showModeSelector: true` to `DEFAULT_SETTINGS`
   - Risk: Low — labels are used in settings tab dropdown and search modal; both will be updated

### Wave 2: Search Modal Restructure

**Agents:** obsidian-developer (files: `src/ui/search-modal.ts`), obsidian-ui (files: `styles.css`)
**Checkpoint:** `pnpm build` -> `plugin:reload` -> `dev:errors` -> `dev:screenshot`

3. **Remove banner from search modal** (File: `src/ui/search-modal.ts`, Owner: obsidian-developer)
   - Remove `bannerEl` field declaration
   - Remove banner creation in `onOpen()`
   - Remove `renderBanner()` method entirely
   - Remove `renderBanner()` call from `setMode()`
   - Show setup errors in `metaEl` instead (modify `onOpen` to check `getSetupMessage()` and display in meta)
   - Risk: Low

4. **Replace tabs with mode dropdown** (File: `src/ui/search-modal.ts`, Owner: obsidian-developer)
   - Remove tab creation loop in `onOpen()`
   - Remove `modeButtons` Map field
   - Add `modeIndicatorEl` field (HTMLButtonElement)
   - Create mode indicator button inside `qmd-search-input-row` (between input and clear button)
   - Import `Menu` from obsidian
   - Add `showModeMenu()` method using Obsidian's Menu class
   - Wire click event on mode indicator to `showModeMenu()`
   - In `setMode()`, update the indicator label text instead of toggling tab active states
   - Respect `settings.showModeSelector` — hide indicator if false
   - Risk: Medium — careful with input row grid layout and focus management

5. **Simplify placeholders and instructions** (File: `src/ui/search-modal.ts`, Owner: obsidian-developer)
   - Change `getInputPlaceholder()` to return `'Search your vault...'` for all non-advanced modes
   - In `renderInstructions()`, remove the "tab switch mode" instruction
   - Risk: Low

6. **Update CSS** (File: `styles.css`, Owner: obsidian-ui)
   - Remove: `.qmd-search-banner`, `.qmd-search-banner.is-visible`
   - Remove: `.qmd-search-tabs`, `.qmd-search-tab`, `.qmd-search-tab:hover`, `.qmd-search-tab.is-active`
   - Modify: `.qmd-search-input-row` grid to `20px minmax(0, 1fr) auto auto`
   - Modify: `.qmd-search-shell` gap from `12px` to `8px`
   - Add: `.qmd-mode-indicator` styling:
     ```css
     .qmd-mode-indicator {
       display: flex;
       align-items: center;
       gap: 4px;
       padding: 4px 10px;
       border: 1px solid var(--background-modifier-border);
       border-radius: 999px;
       background: var(--background-primary);
       color: var(--text-muted);
       font-size: var(--font-smallest);
       font-weight: 500;
       cursor: pointer;
       transition: background-color 120ms ease, color 120ms ease;
       white-space: nowrap;
     }
     .qmd-mode-indicator:hover {
       background: var(--background-modifier-hover);
       color: var(--text-normal);
     }
     .qmd-mode-indicator .qmd-mode-chevron {
       width: 12px;
       height: 12px;
       color: var(--text-faint);
     }
     .qmd-mode-indicator.is-hidden { display: none; }
     ```
   - Risk: Low

### Wave 3: Settings Tab + Polish

**Agents:** obsidian-developer (files: `src/ui/settings-tab.ts`)
**Checkpoint:** `pnpm build` -> `plugin:reload` -> `dev:errors` -> `dev:screenshot`

7. **Add showModeSelector toggle to settings** (File: `src/ui/settings-tab.ts`, Owner: obsidian-developer)
   - Add a new `Setting` toggle for `showModeSelector` after the "Persist last mode" toggle
   - Name: "Show mode selector in search"
   - Desc: "Show the search mode selector in the search input. When hidden, the default mode is always used."
   - Risk: Low

8. **Final polish and edge cases** (File: `src/ui/search-modal.ts`, Owner: obsidian-developer)
   - Verify Tab key still cycles modes (should work since `cycleMode` is unchanged)
   - Verify mode indicator updates when Tab cycling
   - Verify Advanced mode transition works (panel shows/hides, input toggles)
   - Verify initial query flow works (opens with selected text pre-filled)
   - Verify clear button still works
   - Risk: Low

## Verification Strategy

- **Build verification:** `pnpm build` must pass after each wave
- **Runtime verification:** `obsidian plugin:reload id=obsidian-qmd` -> `obsidian dev:errors`
- **Visual verification:** `obsidian dev:screenshot` after Wave 2 and Wave 3
- **Functional checks:**
  - Open search modal with no query -> see clean input, no banner, no visible tabs
  - Type a query -> Hybrid results appear
  - Click mode indicator -> Menu appears with 4 options
  - Select "Exact match" -> mode changes, indicator updates, search re-runs
  - Press Tab -> mode cycles, indicator updates
  - Select "Custom query" -> advanced panel appears, simple input hides
  - Cmd+Enter in advanced -> search runs
  - All keyboard shortcuts (Enter, Cmd+Enter, Alt+Enter, Alt+O, Shift+Enter, arrows) work
  - Clear button works
  - Initial query (selected text) works
  - Settings: toggle showModeSelector off -> indicator hidden
  - Settings: mode labels show new friendly names in dropdown

## Risks & Mitigations

- **Risk:** Mode label changes break settings tab dropdown
  - Mitigation: `SEARCH_MODE_LABELS` is the single source of truth used by both the settings dropdown and the modal. Changing it changes both automatically.

- **Risk:** Obsidian Menu positioning looks wrong
  - Mitigation: Use `getBoundingClientRect()` on the indicator button for precise positioning. Menu is a well-tested Obsidian API.

- **Risk:** Grid layout breaks when mode indicator is added
  - Mitigation: Use `auto auto` for the last two columns (mode indicator + clear button), which naturally sizes to content.

- **Risk:** Users who memorized "Keyword/Semantic/Hybrid" confused by new labels
  - Mitigation: The settings tab still shows a "Default search mode" dropdown with the new labels. Power users who use Tab cycling will see the indicator update. The internal mode values (`keyword`, `semantic`, etc.) are unchanged.

- **Risk:** Tab key cycling without visible tabs feels invisible
  - Mitigation: The mode indicator pill updates its label as you Tab-cycle, providing visual feedback.

## Success Criteria

- [ ] `pnpm build` passes
- [ ] `obsidian dev:errors` returns no errors after reload
- [ ] `obsidian dev:screenshot` shows clean, banner-free, tab-free search modal
- [ ] Default search works immediately without mode selection (Hybrid)
- [ ] Mode indicator pill is visible and clickable
- [ ] Obsidian Menu dropdown shows 4 modes with friendly labels
- [ ] Tab key cycles modes with indicator feedback
- [ ] Advanced mode panel still works
- [ ] All keyboard shortcuts preserved
- [ ] Settings tab has new "Show mode selector" toggle
- [ ] Staggered fade-in animations work
- [ ] Snippet highlighting works
- [ ] Hover preview on results works
