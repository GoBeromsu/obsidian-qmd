import type { HoverParent } from 'obsidian';
import type QmdPlugin from '../main';
import { formatSnippet } from '../qmd/parser';
import type { QmdOpenTarget, QmdSearchResult } from '../types';
import { showResultContextMenu } from './result-actions';

export type ScoreTier = 'high' | 'medium' | 'low';

export function scoreTier(score: number): ScoreTier {
	if (score >= 0.85) return 'high';
	if (score >= 0.7) return 'medium';
	return 'low';
}

export function formatBreadcrumb(path: string): string {
	const parts = path.split('/');
	parts.pop();
	return parts.length > 0 ? parts.join(' > ') : '';
}

export interface RenderResultOptions {
	plugin: QmdPlugin;
	result: QmdSearchResult;
	index: number;
	container: HTMLElement;
	sourceId: string;
	hoverParent: HoverParent;
	onSelect?: (index: number) => void;
	onOpen?: (index: number, target: QmdOpenTarget) => void;
}

export function renderResultItem(opts: RenderResultOptions): HTMLElement {
	const { plugin, result, index, container, sourceId, hoverParent, onSelect, onOpen } = opts;
	const tier = scoreTier(result.score);
	const pct = `${Math.round(result.score * 100)}%`;
	const title = result.title || plugin.getResultFallbackTitle(result);
	const relativePath = plugin.toVaultRelativePath(result.file) ?? result.file;
	const breadcrumb = formatBreadcrumb(relativePath);
	const linktext = relativePath.replace(/\.md$/, '');

	const el = container.createDiv({
		cls: 'qmd-result-item',
		attr: {
			role: 'listitem',
			tabindex: '0',
			draggable: 'true',
			'aria-label': `${title} \u2014 ${pct}`,
		},
	});
	el.style.setProperty('--qmd-result-delay', `${Math.min(index * 25, 500)}ms`);

	el.createDiv({ cls: `qmd-result-bar qmd-result-bar--${tier}` });

	const body = el.createDiv({ cls: 'qmd-result-body' });
	const header = body.createDiv({ cls: 'qmd-result-header' });
	header.createSpan({
		cls: `qmd-result-title${tier === 'high' ? ' qmd-result-title--strong' : ''}`,
		text: title,
	});
	header.createSpan({
		cls: `qmd-result-score qmd-result-score--${tier}`,
		text: pct,
	});

	if (breadcrumb) {
		body.createDiv({ cls: 'qmd-result-path', text: breadcrumb });
	}

	const snippet = formatSnippet(result.snippet);
	if (snippet) {
		body.createDiv({ cls: 'qmd-result-snippet', text: snippet });
	}

	// Click
	el.addEventListener('click', (event) => {
		const target: QmdOpenTarget = event.altKey ? 'split' : (event.metaKey || event.ctrlKey) ? 'tab' : 'current';
		onOpen?.(index, target);
	});

	// Middle-click
	el.addEventListener('auxclick', (event) => {
		if (event.button !== 1) return;
		event.preventDefault();
		onOpen?.(index, 'tab');
	});

	// Context menu
	el.addEventListener('contextmenu', (event) => {
		event.preventDefault();
		onSelect?.(index);
		showResultContextMenu(plugin, result, event);
	});

	// Hover preview
	el.addEventListener('mouseover', (event) => {
		plugin.app.workspace.trigger('hover-link', {
			event,
			source: sourceId,
			hoverParent,
			targetEl: el,
			linktext: relativePath,
		});
	});

	// Mouse enter selection
	el.addEventListener('mouseenter', () => {
		onSelect?.(index);
	});

	// Drag support
	el.addEventListener('dragstart', (event) => {
		event.dataTransfer?.setData('text/plain', `[[${linktext}]]`);
	});

	// Keyboard nav on focused items (for related view)
	el.addEventListener('keydown', (event) => {
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			(el.nextElementSibling as HTMLElement)?.focus();
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			(el.previousElementSibling as HTMLElement)?.focus();
		} else if (event.key === 'Enter') {
			event.preventDefault();
			const target: QmdOpenTarget = event.altKey ? 'split' : (event.metaKey || event.ctrlKey) ? 'tab' : 'current';
			onOpen?.(index, target);
		}
	});

	return el;
}
