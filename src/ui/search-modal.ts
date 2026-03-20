import { type HoverPopover, MarkdownView, Modal, Notice, setIcon } from 'obsidian';
import type QmdPlugin from '../main';
import { SEARCH_MODE_LABELS } from '../settings';
import { validateStructuredQueryDocument } from '../qmd/parser';
import type { QmdOpenTarget, QmdSearchMode, QmdSearchResult } from '../types';
import { renderResultItem } from './result-renderer';

const AUTO_SEARCH_DEBOUNCE_MS = 180;
const SEARCH_MODE_ORDER: QmdSearchMode[] = ['keyword', 'semantic', 'hybrid', 'advanced'];

export class QmdSearchModal extends Modal {
	hoverPopover: HoverPopover | null = null;

	private static activeModal: QmdSearchModal | null = null;

	private readonly modeButtons = new Map<QmdSearchMode, HTMLButtonElement>();
	private readonly advancedChips: Array<{ label: string; value: string }> = [
		{ label: 'lex:', value: 'lex: ' },
		{ label: 'vec:', value: 'vec: ' },
		{ label: 'hyde:', value: 'hyde: ' },
		{ label: 'intent:', value: 'intent: ' },
	];

	private mode: QmdSearchMode;
	private queryInputEl!: HTMLInputElement;
	private clearBtnEl!: HTMLButtonElement;
	private advancedInputEl!: HTMLTextAreaElement;
	private advancedPanelEl!: HTMLDivElement;
	private metaEl!: HTMLDivElement;
	private bannerEl!: HTMLDivElement;
	private resultsEl!: HTMLDivElement;
	private resultEls: HTMLElement[] = [];
	private results: QmdSearchResult[] = [];
	private selectedIndex = 0;
	private instructionsEl!: HTMLDivElement;
	private lastQueryText = '';
	private dirty = false;
	private searchTimer: number | null = null;
	private searchInFlight = false;
	private queuedRequest: { mode: QmdSearchMode; query: string; ticket: number } | null = null;
	private latestTicket = 0;

	constructor(
		app: QmdPlugin['app'],
		private readonly plugin: QmdPlugin,
		private readonly initialQuery = '',
	) {
		super(app);
		this.mode = this.plugin.getInitialSearchMode();
	}

	static open(plugin: QmdPlugin, initialQuery = ''): void {
		this.activeModal?.close();
		const modal = new QmdSearchModal(plugin.app, plugin, initialQuery);
		this.activeModal = modal;
		modal.open();
	}

	onOpen(): void {
		const { contentEl, modalEl } = this;
		modalEl.addClass('qmd-search-modal', 'prompt');
		modalEl.removeClass('modal');
		modalEl.tabIndex = -1;
		modalEl.querySelector('.modal-header')?.remove();
		modalEl.querySelector('.modal-close-button')?.remove();

		contentEl.empty();
		contentEl.classList.add('qmd-search-shell');

		this.bannerEl = contentEl.createDiv({ cls: 'qmd-search-banner' });

		const inputRow = contentEl.createDiv({ cls: 'qmd-search-input-row' });
		const iconEl = inputRow.createDiv({ cls: 'qmd-search-icon' });
		setIcon(iconEl, 'search');

		this.queryInputEl = inputRow.createEl('input', {
			type: 'text',
			cls: 'qmd-search-input',
			attr: { placeholder: this.getInputPlaceholder() },
		});

		this.clearBtnEl = inputRow.createEl('button', {
			cls: 'qmd-search-clear clickable-icon',
			attr: { 'aria-label': 'Clear search', type: 'button' },
		});
		setIcon(this.clearBtnEl, 'x');
		this.clearBtnEl.addEventListener('click', () => {
			this.queryInputEl.value = '';
			this.dirty = true;
			this.results = [];
			this.renderEmptyState('Type to search your vault with qmd.');
			this.updateClearButton();
			this.queryInputEl.focus();
		});

		const tabsEl = contentEl.createDiv({ cls: 'qmd-search-tabs' });
		for (const mode of SEARCH_MODE_ORDER) {
			const button = tabsEl.createEl('button', {
				cls: 'qmd-search-tab',
				text: SEARCH_MODE_LABELS[mode],
			});
			button.type = 'button';
			button.addEventListener('click', () => this.setMode(mode));
			this.modeButtons.set(mode, button);
		}

		this.advancedPanelEl = contentEl.createDiv({ cls: 'qmd-advanced-panel' });
		const chipRow = this.advancedPanelEl.createDiv({ cls: 'qmd-advanced-chip-row' });
		for (const chip of this.advancedChips) {
			const button = chipRow.createEl('button', {
				cls: 'qmd-advanced-chip',
				text: chip.label,
			});
			button.type = 'button';
			button.addEventListener('click', () => this.insertAdvancedToken(chip.value));
		}

		this.advancedInputEl = this.advancedPanelEl.createEl('textarea', {
			cls: 'qmd-advanced-input',
			attr: {
				placeholder: 'intent: what you want\nlex: exact words\nvec: semantic intent',
			},
		});

		this.metaEl = contentEl.createDiv({ cls: 'qmd-search-meta' });
		this.resultsEl = contentEl.createDiv({ cls: 'qmd-search-results' });

		this.instructionsEl = contentEl.createDiv({ cls: 'prompt-instructions qmd-search-instructions' });
		this.renderInstructions();

		this.queryInputEl.addEventListener('input', () => {
			this.dirty = true;
			this.updateClearButton();
			this.scheduleSearch();
		});
		this.queryInputEl.addEventListener('keydown', (event) => this.handleQueryKeydown(event));

		this.advancedInputEl.addEventListener('input', () => {
			this.dirty = true;
		});
		this.advancedInputEl.addEventListener('keydown', (event) => this.handleAdvancedKeydown(event));

		if (this.initialQuery && this.mode !== 'advanced') {
			this.queryInputEl.value = this.initialQuery;
			this.dirty = true;
		}

		this.setMode(this.mode);
		this.updateClearButton();

		if (this.initialQuery && this.mode !== 'advanced') {
			this.scheduleSearch();
		} else {
			this.renderEmptyState('Type to search your vault with qmd.');
		}
	}

	onClose(): void {
		if (this.searchTimer) {
			window.clearTimeout(this.searchTimer);
			this.searchTimer = null;
		}

		if (QmdSearchModal.activeModal === this) {
			QmdSearchModal.activeModal = null;
		}
	}

	private setMode(mode: QmdSearchMode): void {
		this.mode = mode;
		this.modalEl.dataset.qmdSearchMode = mode;

		for (const [buttonMode, button] of this.modeButtons.entries()) {
			button.classList.toggle('is-active', buttonMode === mode);
		}

		this.advancedPanelEl.classList.toggle('is-visible', mode === 'advanced');
		this.queryInputEl.classList.toggle('is-hidden', mode === 'advanced');
		this.queryInputEl.placeholder = this.getInputPlaceholder();

		this.plugin.rememberSearchMode(mode);
		this.renderBanner();
		this.renderInstructions();

		if (mode === 'advanced') {
			this.advancedInputEl.focus();
			return;
		}

		this.queryInputEl.focus();
		if (this.queryInputEl.value.trim()) {
			this.scheduleSearch();
		}
	}

	private cycleMode(delta: number): void {
		const currentIndex = SEARCH_MODE_ORDER.indexOf(this.mode);
		const nextIndex = (currentIndex + delta + SEARCH_MODE_ORDER.length) % SEARCH_MODE_ORDER.length;
		this.setMode(SEARCH_MODE_ORDER[nextIndex]);
	}

	private getInputPlaceholder(): string {
		switch (this.mode) {
			case 'keyword':
				return 'Keyword search with qmd search';
			case 'semantic':
				return 'Semantic search with qmd vsearch';
			case 'hybrid':
				return 'Hybrid search with qmd query';
			case 'advanced':
				return '';
		}
	}

	private renderBanner(): void {
		const setupMessage = this.plugin.getSetupMessage();
		this.bannerEl.empty();

		if (setupMessage) {
			this.bannerEl.textContent = setupMessage;
			this.bannerEl.classList.add('is-visible');
			return;
		}

		const collectionName = this.plugin.activeCollection?.name;
		this.bannerEl.classList.toggle('is-visible', Boolean(collectionName));
		if (collectionName) {
			this.bannerEl.textContent = `Collection: ${collectionName} \u00b7 ${SEARCH_MODE_LABELS[this.mode]}`;
		}
	}

	private updateClearButton(): void {
		this.clearBtnEl.classList.toggle('is-visible', this.queryInputEl.value.length > 0);
	}

	private scheduleSearch(): void {
		if (this.mode === 'advanced') {
			return;
		}

		if (this.searchTimer) {
			window.clearTimeout(this.searchTimer);
		}

		this.searchTimer = window.setTimeout(() => {
			void this.submitCurrentQuery();
		}, AUTO_SEARCH_DEBOUNCE_MS);
	}

	private handleQueryKeydown(event: KeyboardEvent): void {
		if (event.key === 'Tab') {
			event.preventDefault();
			this.cycleMode(event.shiftKey ? -1 : 1);
			return;
		}

		if (event.key === 'o' && event.altKey && this.canOpenSelectedResult()) {
			event.preventDefault();
			void this.openSelectedResult('current', true);
			return;
		}

		if (this.handleNavigationShortcut(event)) {
			return;
		}

		if (event.key === 'Enter' && event.shiftKey && this.canOpenSelectedResult()) {
			event.preventDefault();
			this.insertWikilinkForSelectedResult();
			return;
		}

		if (event.key === 'Enter') {
			event.preventDefault();
			const target = this.getOpenTargetFromEvent(event);
			if (target && this.canOpenSelectedResult()) {
				void this.openSelectedResult(target);
				return;
			}

			void this.submitCurrentQuery();
		}
	}

	private handleAdvancedKeydown(event: KeyboardEvent): void {
		if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
			event.preventDefault();
			void this.submitCurrentQuery();
			return;
		}

		if (event.altKey && event.key === 'Enter' && this.canOpenSelectedResult()) {
			event.preventDefault();
			void this.openSelectedResult('split');
		}
	}

	private handleNavigationShortcut(event: KeyboardEvent): boolean {
		if (event.key === 'ArrowDown' || ((event.metaKey || event.ctrlKey) && ['j', 'J', 'n', 'N'].includes(event.key))) {
			event.preventDefault();
			this.moveSelection(1);
			return true;
		}

		if (event.key === 'ArrowUp' || ((event.metaKey || event.ctrlKey) && ['k', 'K', 'p', 'P'].includes(event.key))) {
			event.preventDefault();
			this.moveSelection(-1);
			return true;
		}

		return false;
	}

	private getOpenTargetFromEvent(event: KeyboardEvent): QmdOpenTarget | null {
		if (event.altKey) {
			return 'split';
		}

		if (event.metaKey || event.ctrlKey) {
			return 'tab';
		}

		return this.canOpenSelectedResult() ? 'current' : null;
	}

	private canOpenSelectedResult(): boolean {
		return !this.dirty && this.results.length > 0;
	}

	private moveSelection(delta: number): void {
		if (this.resultEls.length === 0) {
			return;
		}

		this.selectedIndex = (this.selectedIndex + delta + this.resultEls.length) % this.resultEls.length;
		this.refreshSelection();
	}

	private refreshSelection(): void {
		this.resultEls.forEach((el, index) => {
			const selected = index === this.selectedIndex;
			el.classList.toggle('is-selected', selected);
			if (selected) {
				el.scrollIntoView({ block: 'nearest' });
			}
		});
	}

	private async submitCurrentQuery(): Promise<void> {
		const setupMessage = this.plugin.getSetupMessage();
		if (setupMessage) {
			new Notice(setupMessage);
			this.renderBanner();
			return;
		}

		const rawQuery = this.mode === 'advanced' ? this.advancedInputEl.value : this.queryInputEl.value;
		const query = rawQuery.trim();
		if (!query) {
			this.results = [];
			this.renderEmptyState('Type to search your vault with qmd.');
			return;
		}

		if (this.searchTimer) {
			window.clearTimeout(this.searchTimer);
			this.searchTimer = null;
		}

		this.lastQueryText = query;

		let normalizedQuery = query;
		if (this.mode === 'advanced') {
			const validation = validateStructuredQueryDocument(query);
			if (!validation.valid || !validation.normalized) {
				this.metaEl.textContent = validation.error ?? 'Invalid query document.';
				this.renderEmptyState('Fix the structured query and run it again.');
				return;
			}
			normalizedQuery = validation.normalized;
		}

		this.latestTicket += 1;
		this.queueSearchRequest({
			mode: this.mode,
			query: normalizedQuery,
			ticket: this.latestTicket,
		});
	}

	private queueSearchRequest(request: { mode: QmdSearchMode; query: string; ticket: number }): void {
		this.queuedRequest = request;
		this.metaEl.textContent = `Searching ${SEARCH_MODE_LABELS[request.mode].toLowerCase()} results...`;

		if (this.searchInFlight) {
			return;
		}

		void this.runNextSearchRequest();
	}

	private async runNextSearchRequest(): Promise<void> {
		if (!this.queuedRequest) {
			return;
		}

		const request = this.queuedRequest;
		this.queuedRequest = null;
		this.searchInFlight = true;

		try {
			const startedAt = performance.now();
			const results = await this.plugin.search(request.mode, request.query);

			if (request.ticket !== this.latestTicket) {
				return;
			}

			this.dirty = false;
			this.results = results;
			this.selectedIndex = 0;
			const elapsedMs = Math.round(performance.now() - startedAt);
			this.renderResults(results, elapsedMs);
		} catch (error) {
			if (request.ticket !== this.latestTicket) {
				return;
			}

			const message = error instanceof Error ? error.message : String(error);
			this.metaEl.textContent = message;
			this.renderEmptyState('Search failed.');
		} finally {
			this.searchInFlight = false;
			if (this.queuedRequest) {
				void this.runNextSearchRequest();
			}
		}
	}

	private renderResults(results: QmdSearchResult[], elapsedMs: number): void {
		this.resultsEl.empty();
		this.resultEls = [];

		if (results.length === 0) {
			this.metaEl.textContent = `No results in ${elapsedMs}ms.`;
			this.renderEmptyState('No matching notes.');
			return;
		}

		this.metaEl.textContent = `${results.length} result${results.length === 1 ? '' : 's'} \u00b7 ${elapsedMs}ms`;

		for (const [index, result] of results.entries()) {
			const el = renderResultItem({
				plugin: this.plugin,
				result,
				index,
				container: this.resultsEl,
				sourceId: 'qmd-search-modal',
				hoverParent: this,
				queryText: this.lastQueryText,
				onSelect: (i) => {
					this.selectedIndex = i;
					this.refreshSelection();
				},
				onOpen: (i, target) => {
					this.selectedIndex = i;
					void this.openSelectedResult(target);
				},
			});
			this.resultEls.push(el);
		}

		this.refreshSelection();
	}

	private renderEmptyState(message: string): void {
		this.resultsEl.empty();
		this.resultEls = [];
		const stateEl = this.resultsEl.createDiv({ cls: 'qmd-state' });
		const iconEl = stateEl.createDiv({ cls: 'qmd-state-icon' });
		setIcon(iconEl, 'search');
		stateEl.createEl('p', { cls: 'qmd-state-text', text: message });
	}

	private async openSelectedResult(target: QmdOpenTarget = 'current', keepOpen = false): Promise<void> {
		const result = this.results[this.selectedIndex];
		if (!result) {
			return;
		}

		await this.plugin.openSearchResult(result, target);
		if (!keepOpen) {
			this.close();
		}
	}

	private insertAdvancedToken(value: string): void {
		const { selectionStart, selectionEnd } = this.advancedInputEl;
		const start = selectionStart ?? this.advancedInputEl.value.length;
		const end = selectionEnd ?? this.advancedInputEl.value.length;
		const current = this.advancedInputEl.value;

		this.advancedInputEl.value = `${current.slice(0, start)}${value}${current.slice(end)}`;
		this.advancedInputEl.focus();
		const cursor = start + value.length;
		this.advancedInputEl.setSelectionRange(cursor, cursor);
		this.dirty = true;
	}

	private insertWikilinkForSelectedResult(): void {
		const result = this.results[this.selectedIndex];
		if (!result) {
			return;
		}

		const relativePath = this.plugin.toVaultRelativePath(result.file);
		if (!relativePath) {
			new Notice('Search result does not map to the current vault.');
			return;
		}

		const wikilink = `[[${relativePath.replace(/\.md$/, '')}]]`;
		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!markdownView) {
			new Notice('No active editor to insert link.');
			return;
		}

		markdownView.editor.replaceSelection(wikilink);
		new Notice(`Inserted ${wikilink}`);
	}

	private renderInstructions(): void {
		this.instructionsEl.empty();

		this.createInstruction(this.instructionsEl, '\u2191\u2193', 'navigate');

		if (this.mode === 'advanced') {
			this.createInstruction(this.instructionsEl, 'cmd/ctrl+enter', 'run query');
		} else {
			this.createInstruction(this.instructionsEl, 'enter', 'open');
			this.createInstruction(this.instructionsEl, 'cmd/ctrl+enter', 'new tab');
		}

		this.createInstruction(this.instructionsEl, 'alt+enter', 'split');
		this.createInstruction(this.instructionsEl, 'alt+o', 'open, keep modal');
		this.createInstruction(this.instructionsEl, 'shift+enter', 'insert link');
		this.createInstruction(this.instructionsEl, 'tab', 'switch mode');
	}

	private createInstruction(container: HTMLDivElement, key: string, text: string): void {
		const item = container.createDiv({ cls: 'prompt-instruction' });
		item.createSpan({ cls: 'prompt-instruction-command', text: key });
		item.createSpan({ text });
	}
}
