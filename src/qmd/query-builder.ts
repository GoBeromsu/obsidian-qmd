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

function formatLexTerm(value: string): string {
  return /\s/.test(value) ? `"${value}"` : value;
}

function sanitizeForVec(value: string): string {
  // QMD rejects ANY -term (including -13 in dates like 2026-03-13) in vec/hyde queries.
  // Replace all hyphens with spaces to avoid negation interpretation.
  // This is safe because vec/hyde are semantic queries — hyphens don't affect meaning.
  return value.replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
}

export function buildRelatedQuerySource(
  filePath: string,
  _content: string,
  metadata?: CachedMetadata | null,
): RelatedQuerySource {
  const rawTitle = filePath.split('/').pop()?.replace(/\.md$/, '') ?? filePath;
  const frontmatter = metadata?.frontmatter as Record<string, unknown> | undefined;
  const aliasValues = unique(asArray(frontmatter?.aliases), 6);
  const tagValues = unique([
    ...asArray(frontmatter?.tags),
    ...(metadata?.tags ?? []).map((tag) => tag.tag.replace(/^#/, '')),
  ], 8);
  const headingValues = unique(
    (metadata?.headings ?? []).map((heading) => heading.heading.replace(/\[\[|\]\]/g, '')),
    6,
  );

  return {
    title: rawTitle,
    aliases: aliasValues,
    tags: tagValues,
    headings: headingValues,
  };
}

export function buildRelatedQueryDocument(source: RelatedQuerySource): string {
  const lexTerms = unique([
    source.title,
    ...source.aliases,
    ...source.tags,
    ...source.headings,
  ], 12).map(formatLexTerm);

  const topicTerms = unique([...source.tags, ...source.headings], 3);

  const vecParts = [
    `Notes about ${source.title}.`,
    source.tags.length ? `Topics: ${source.tags.join(', ')}.` : '',
    source.headings.length ? `Sections: ${source.headings.join(', ')}.` : '',
  ].filter(Boolean);

  const hydeParts = [
    `A note that discusses ${source.title} topics`,
    source.tags.length ? `including ${source.tags.join(', ')}` : '',
    source.headings.length ? `with sections on ${source.headings.join(', ')}` : '',
  ].filter(Boolean);

  const intentSuffix = topicTerms.length > 0 ? ` covering ${topicTerms.join(', ')}` : '';

  const lines: string[] = [
    `intent: find notes related to ${source.title}${intentSuffix}`,
  ];

  if (lexTerms.length > 0) {
    lines.push(`lex: ${lexTerms.join(' ')}`);
  }

  lines.push(`vec: ${sanitizeForVec(vecParts.join(' '))}`);
  lines.push(`hyde: ${sanitizeForVec(hydeParts.join(' '))}`);

  return lines.join('\n');
}
