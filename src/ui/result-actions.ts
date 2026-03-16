import { Menu, Notice, TFile } from 'obsidian';
import type QmdPlugin from '../main';
import type { QmdSearchResult } from '../types';

export function showResultContextMenu(plugin: QmdPlugin, result: QmdSearchResult, event: MouseEvent): void {
  const relativePath = plugin.toVaultRelativePath(result.file);
  if (!relativePath) {
    new Notice('Search result does not map to the current vault.');
    return;
  }

  const abstractFile = plugin.app.vault.getAbstractFileByPath(relativePath);
  if (!(abstractFile instanceof TFile)) {
    new Notice(`Could not resolve ${relativePath}.`);
    return;
  }

  const menu = new Menu();

  menu.addItem((item) =>
    item
      .setTitle('Open')
      .setIcon('document')
      .onClick(() => {
        void plugin.openSearchResult(result, 'current');
      }),
  );

  menu.addItem((item) =>
    item
      .setTitle('Open in new tab')
      .setIcon('external-link')
      .onClick(() => {
        void plugin.openSearchResult(result, 'tab');
      }),
  );

  menu.addItem((item) =>
    item
      .setTitle('Open to the right')
      .setIcon('separator-vertical')
      .onClick(() => {
        void plugin.openSearchResult(result, 'split');
      }),
  );

  menu.addSeparator();

  menu.addItem((item) =>
    item
      .setTitle('Copy wikilink')
      .setIcon('link')
      .onClick(() => {
        void copyWikilink(relativePath);
      }),
  );

  menu.showAtMouseEvent(event);
}

async function copyWikilink(relativePath: string): Promise<void> {
  const wikilink = `[[${relativePath.replace(/\.md$/, '')}]]`;

  try {
    await navigator.clipboard.writeText(wikilink);
    new Notice('Copied wikilink.');
  } catch {
    new Notice('Failed to copy wikilink.');
  }
}
