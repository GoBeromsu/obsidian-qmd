import type { CachedMetadata } from 'obsidian';
import type { RelatedQuerySource } from '../types';

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => asArray(item));
  }

  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

function unique(values: string[], limit: number): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].slice(0, limit);
}

function stripFrontmatter(content: string): string {
  if (!content.startsWith('---\n')) {
    return content;
  }

  const end = content.indexOf('\n---', 4);
  if (end === -1) {
    return content;
  }

  return content.slice(end + 4);
}

function normalizeBody(content: string, maxLength: number): string {
  return stripFrontmatter(content)
    .replace(/`{3}[\s\S]*?`{3}/g, ' ')
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/\[[^\]]+]\([^)]+\)/g, ' ')
    .replace(/[#>*_`-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function formatLexTerm(value: string): string {
  return /\s/.test(value) ? `"${value}"` : value;
}

export function buildRelatedQuerySource(
  filePath: string,
  content: string,
  metadata?: CachedMetadata | null,
): RelatedQuerySource {
  const rawTitle = filePath.split('/').pop()?.replace(/\.md$/, '') ?? filePath;
  const frontmatter = metadata?.frontmatter as Record<string, unknown> | undefined;
  const aliasValues = unique(asArray(frontmatter?.aliases), 6);
  const tagValues = unique([
    ...asArray(frontmatter?.tags),
    ...(metadata?.tags ?? []).map((tag) => tag.tag.replace(/^#/, '')),
  ], 8);
  const headingValues = unique((metadata?.headings ?? []).map((heading) => heading.heading), 6);

  return {
    title: rawTitle,
    aliases: aliasValues,
    tags: tagValues,
    headings: headingValues,
    body: normalizeBody(content, 650),
  };
}

export function buildRelatedQueryDocument(source: RelatedQuerySource): string {
  const lexTerms = unique([
    source.title,
    ...source.aliases,
    ...source.tags,
    ...source.headings,
  ], 12).map(formatLexTerm);

  const vecParts = [
    `Note title: ${source.title}.`,
    source.aliases.length ? `Aliases: ${source.aliases.join(', ')}.` : '',
    source.headings.length ? `Headings: ${source.headings.join(', ')}.` : '',
    source.body,
  ].filter(Boolean);

  const lines = ['intent: related notes for the open note'];
  if (lexTerms.length > 0) {
    lines.push(`lex: ${lexTerms.join(' ')}`);
  }
  lines.push(`vec: ${vecParts.join(' ')}`);

  return lines.join('\n');
}
