import { type HoverPopover, ItemView, Notice, TFile, WorkspaceLeaf, setIcon } from 'obsidian';
import type QmdPlugin from '../main';
import type { QmdSearchResult } from '../types';
import { renderResultItem } from '../ui/result-renderer';

export const QMD_RELATED_VIEW_TYPE = 'qmd-related-view';

export class QmdRelatedView extends ItemView {
	hoverPopover: HoverPopover | null = null;
	private container!: HTMLDivElement;
	private requestTicket = 0;

	constructor(leaf: WorkspaceLeaf, private readonly plugin: QmdPlugin) {
		super(leaf);
		this.navigation = false;
	}

	static getView(workspace: QmdPlugin['app']['workspace']): QmdRelatedView | null {
		const leaf = workspace.getLeavesOfType(QMD_RELATED_VIEW_TYPE)[0];
		return leaf?.view instanceof QmdRelatedView ? leaf.view : null;
	}

	static async open(workspace: QmdPlugin['app']['workspace']): Promise<void> {
		const existing = QmdRelatedView.getView(workspace);
		if (existing) {
			await existing.renderView();
			await workspace.revealLeaf(existing.leaf);
			return;
		}

		const leaf = workspace.getRightLeaf(false) ?? workspace.getLeaf(false);
		await leaf.setViewState({ type: QMD_RELATED_VIEW_TYPE, active: true });
		await workspace.revealLeaf(leaf);
	}

	getViewType(): string {
		return QMD_RELATED_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'QMD Related';
	}

	getIcon(): string {
		return 'network';
	}

	async onOpen(): Promise<void> {
		this.containerEl.children[1].empty();
		this.container = this.containerEl.children[1] as HTMLDivElement;
		this.container.classList.add('qmd-related-view');

		this.registerEvent(
			this.app.workspace.on('file-open', () => {
				void this.renderView();
			}),
		);

		await this.renderView();
	}

	async onClose(): Promise<void> {
		this.container?.empty();
	}

	async renderView(): Promise<void> {
		if (!this.container) {
			return;
		}

		const activeFile = this.app.workspace.getActiveFile();
		const ticket = ++this.requestTicket;
		this.renderShell(activeFile);

		if (!(activeFile instanceof TFile) || activeFile.extension !== 'md') {
			this.renderEmpty('Open a markdown note to see related results.');
			return;
		}

		const setupMessage = this.plugin.getSetupMessage();
		if (setupMessage) {
			this.renderEmpty(setupMessage);
			return;
		}

		this.renderLoading('Finding related notes...');

		try {
			const results = await this.plugin.findRelatedNotes(activeFile);
			if (ticket !== this.requestTicket) {
				return;
			}

			this.renderResults(activeFile, results);
		} catch (error) {
			if (ticket !== this.requestTicket) {
				return;
			}

			const message = error instanceof Error ? error.message : String(error);
			this.renderEmpty(message);
		}
	}

	private renderShell(file: TFile | null): void {
		this.container.empty();

		const header = this.container.createDiv({ cls: 'qmd-related-header' });
		header.createSpan({
			cls: 'qmd-related-filename',
			text: file?.basename ?? 'No active note',
		});

		const refreshBtn = header.createEl('button', {
			cls: 'clickable-icon',
			attr: { 'aria-label': 'Refresh related notes', type: 'button' },
		});
		setIcon(refreshBtn, 'refresh-cw');
		refreshBtn.addEventListener('click', () => {
			void this.renderView();
		});
	}

	private renderLoading(message: string): void {
		const stateEl = this.container.createDiv({ cls: 'qmd-state' });
		stateEl.createDiv({ cls: 'qmd-spinner' });
		stateEl.createEl('p', { cls: 'qmd-state-text', text: message });
	}

	private renderEmpty(message: string): void {
		const stateEl = this.container.createDiv({ cls: 'qmd-state' });
		const iconEl = stateEl.createDiv({ cls: 'qmd-state-icon' });
		setIcon(iconEl, 'search-x');
		stateEl.createEl('p', { cls: 'qmd-state-text', text: message });
	}

	private renderResults(file: TFile, results: QmdSearchResult[]): void {
		if (results.length === 0) {
			this.renderEmpty(`No related notes for ${file.basename}.`);
			return;
		}

		const list = this.container.createDiv({
			cls: 'qmd-related-results',
			attr: { role: 'list' },
		});

		for (const [index, result] of results.entries()) {
			renderResultItem({
				plugin: this.plugin,
				result,
				index,
				container: list,
				sourceId: QMD_RELATED_VIEW_TYPE,
				hoverParent: this,
				onOpen: (_i, target) => {
					void this.plugin.openSearchResult(result, target).catch((error) => {
						const message = error instanceof Error ? error.message : String(error);
						new Notice(message);
					});
				},
			});
		}
	}
}
