import { PluginSettingTab, Setting } from 'obsidian';
import type QmdPlugin from '../main';
import { SEARCH_MODE_LABELS } from '../domain/settings';
import type { QmdSearchMode } from '../types';

export class QmdSettingTab extends PluginSettingTab {
  constructor(app: QmdPlugin['app'], private readonly plugin: QmdPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.classList.add('qmd-settings');

    containerEl.createEl('h2', { text: 'QMD Settings' });
    containerEl.createEl('p', {
      text: this.plugin.describeBackend(),
      cls: 'qmd-settings-summary',
    });
    containerEl.createEl('p', {
      text: this.plugin.describeExecutableResolution(),
      cls: 'qmd-settings-summary',
    });

    new Setting(containerEl)
      .setName('QMD executable path')
      .setDesc('Leave blank, "auto", or "qmd" to auto-detect npm, bun, nvm, and common PATH installs.')
      .addText((text) => {
        text.setPlaceholder('auto');
        text.setValue(this.plugin.settings.qmdExecutablePath);
        text.onChange(async (value) => {
          this.plugin.settings.qmdExecutablePath = value.trim();
          await this.plugin.saveSettings();
          await this.plugin.refreshBackendState();
          this.display();
        });
      });

    new Setting(containerEl)
      .setName('Collection override')
      .setDesc('Optional qmd collection name to force instead of vault-path auto-detection.')
      .addText((text) => {
        text.setPlaceholder('obsidian');
        text.setValue(this.plugin.settings.collectionOverride);
        text.onChange(async (value) => {
          this.plugin.settings.collectionOverride = value.trim();
          await this.plugin.saveSettings();
          await this.plugin.refreshBackendState();
          this.display();
        });
      });

    new Setting(containerEl)
      .setName('Default search mode')
      .setDesc('Mode selected when the search modal opens.')
      .addDropdown((dropdown) => {
        for (const [mode, label] of Object.entries(SEARCH_MODE_LABELS)) {
          dropdown.addOption(mode, label);
        }
        dropdown.setValue(this.plugin.settings.defaultSearchMode);
        dropdown.onChange(async (value) => {
          this.plugin.settings.defaultSearchMode = value as QmdSearchMode;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Search result limit')
      .setDesc('Number of results shown in the search modal.')
      .addText((text) => {
        text.setPlaceholder('8');
        text.setValue(String(this.plugin.settings.previewResultLimit));
        text.onChange(async (value) => {
          this.plugin.settings.previewResultLimit = this.parsePositiveInt(value, this.plugin.settings.previewResultLimit);
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Related note limit')
      .setDesc('Number of related notes shown in the sidebar view.')
      .addText((text) => {
        text.setPlaceholder('8');
        text.setValue(String(this.plugin.settings.relatedResultLimit));
        text.onChange(async (value) => {
          this.plugin.settings.relatedResultLimit = this.parsePositiveInt(value, this.plugin.settings.relatedResultLimit);
          await this.plugin.saveSettings();
          await this.plugin.refreshRelatedView();
        });
      });

    new Setting(containerEl)
      .setName('Auto-sync')
      .setDesc('Run qmd update and qmd embed after vault changes.')
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.autoSyncEnabled);
        toggle.onChange(async (value) => {
          this.plugin.settings.autoSyncEnabled = value;
          await this.plugin.saveSettings();
          this.plugin.refreshStatusBar();
        });
      });

    new Setting(containerEl)
      .setName('Auto-sync debounce (ms)')
      .setDesc('Wait time after the last change before running qmd update and qmd embed.')
      .addText((text) => {
        text.setPlaceholder('7000');
        text.setValue(String(this.plugin.settings.autoSyncDebounceMs));
        text.onChange(async (value) => {
          this.plugin.settings.autoSyncDebounceMs = this.parsePositiveInt(value, this.plugin.settings.autoSyncDebounceMs);
          this.plugin.configureAutoSync();
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Persist last mode')
      .setDesc('Remember the last mode used in the search modal.')
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.persistLastMode);
        toggle.onChange(async (value) => {
          this.plugin.settings.persistLastMode = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Show mode selector')
      .setDesc('Display the search mode pill in the search modal.')
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.showModeSelector);
        toggle.onChange(async (value) => {
          this.plugin.settings.showModeSelector = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Show sync status bar item')
      .setDesc('Display QMD status in the Obsidian status bar.')
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.showSyncStatusBar);
        toggle.onChange(async (value) => {
          this.plugin.settings.showSyncStatusBar = value;
          await this.plugin.saveSettings();
          this.plugin.refreshStatusBar();
        });
      });
  }

  private parsePositiveInt(value: string, fallback: number): number {
    const parsed = Number.parseInt(value.trim(), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }
}
