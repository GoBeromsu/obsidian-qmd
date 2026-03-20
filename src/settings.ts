import type { QmdPluginSettings, QmdSearchMode } from './types';

export const SEARCH_MODE_LABELS: Record<QmdSearchMode, string> = {
  keyword: 'Exact match',
  semantic: 'Meaning-based',
  hybrid: 'Best of both',
  advanced: 'Custom query',
};

export const SEARCH_MODE_DESCRIPTIONS: Record<QmdSearchMode, string> = {
  keyword: 'BM25 keyword search for exact terms',
  semantic: 'Vector search for conceptual similarity',
  hybrid: 'Combined keyword + semantic (recommended)',
  advanced: 'Structured query with lex/vec/hyde fields',
};

export const DEFAULT_SETTINGS: QmdPluginSettings = {
  qmdExecutablePath: 'auto',
  collectionOverride: '',
  defaultSearchMode: 'hybrid',
  lastSearchMode: 'hybrid',
  previewResultLimit: 8,
  relatedResultLimit: 8,
  autoSyncEnabled: true,
  autoSyncDebounceMs: 7000,
  persistLastMode: true,
  showModeSelector: true,
  showSyncStatusBar: true,
};
