import type { QmdPluginSettings, QmdSearchMode } from './types';

export const SEARCH_MODE_LABELS: Record<QmdSearchMode, string> = {
  keyword: 'Keyword',
  semantic: 'Semantic',
  hybrid: 'Hybrid',
  advanced: 'Advanced',
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
  showSyncStatusBar: true,
};
