export interface NoticeDefinition {
  template: string;
  timeout?: number;
  immutable?: boolean;
}

export type NoticeCatalog = Record<string, NoticeDefinition>;

export interface NoticeShowOptions {
  timeout?: number;
  button?: { text: string; callback: () => void };
}

export interface PluginNoticesHost {
  settings: Record<string, unknown>;
  saveSettings(): Promise<void>;
}
