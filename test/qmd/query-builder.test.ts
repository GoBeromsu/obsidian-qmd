import { describe, expect, it } from 'vitest';

import { buildRelatedQueryDocument, buildRelatedQuerySource } from '../../src/qmd/query-builder';

describe('related query builder', () => {
  it('extracts related-query source from file content and metadata', () => {
    const source = buildRelatedQuerySource(
      'folder/My Note.md',
      [
        '---',
        'aliases:',
        '  - Alternate Name',
        'tags:',
        '  - writing',
        '---',
        '# Heading',
        '',
        'Body text with enough detail to be useful.',
      ].join('\n'),
      {
        frontmatter: {
          aliases: ['Alternate Name'],
          tags: ['writing'],
        },
        tags: [{ tag: '#obsidian' }],
        headings: [{ heading: 'Heading', level: 1, position: { start: { line: 0, col: 0, offset: 0 }, end: { line: 0, col: 0, offset: 0 } } }],
      } as never,
    );

    expect(source.title).toBe('My Note');
    expect(source.aliases).toEqual(['Alternate Name']);
    expect(source.tags).toEqual(['writing', 'obsidian']);
    expect(source.headings).toEqual(['Heading']);
    expect(source.body).toContain('Body text with enough detail');
    expect(source.body).not.toContain('aliases');
  });

  it('builds a structured qmd query document for related notes', () => {
    const query = buildRelatedQueryDocument({
      title: 'My Note',
      aliases: ['Alternate Name'],
      tags: ['obsidian'],
      headings: ['Heading One'],
      body: 'Useful body excerpt.',
    });

    expect(query).toContain('intent: related notes for the open note');
    expect(query).toContain('lex: "My Note" "Alternate Name" obsidian "Heading One"');
    expect(query).toContain('vec: Note title: My Note.');
    expect(query).toContain('Useful body excerpt.');
  });
});
