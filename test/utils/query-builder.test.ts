import { describe, expect, it } from 'vitest';

import { buildRelatedQueryDocument, buildRelatedQuerySource } from '../../src/utils/query-builder';

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
    expect(source).not.toHaveProperty('body');
  });

  it('builds a structured qmd query document with intent, lex, vec, and hyde', () => {
    const query = buildRelatedQueryDocument({
      title: 'My Note',
      aliases: ['Alternate Name'],
      tags: ['obsidian'],
      headings: ['Heading One'],
    });

    expect(query).toContain('intent: find notes related to My Note covering obsidian, Heading One');
    expect(query).toContain('lex: "My Note" "Alternate Name" obsidian "Heading One"');
    expect(query).toContain('vec: Notes about My Note. Topics: obsidian. Sections: Heading One.');
    expect(query).toContain('hyde: A note that discusses My Note topics including obsidian with sections on Heading One');
  });

  it('handles source with no tags or headings', () => {
    const query = buildRelatedQueryDocument({
      title: 'Simple Note',
      aliases: [],
      tags: [],
      headings: [],
    });

    expect(query).toContain('intent: find notes related to Simple Note');
    expect(query).toContain('lex: "Simple Note"');
    expect(query).toContain('vec: Notes about Simple Note.');
    expect(query).toContain('hyde: A note that discusses Simple Note topics');
    expect(query).not.toContain('Topics:');
    expect(query).not.toContain('Sections:');
  });

  it('strips negation operators from vec and hyde lines', () => {
    const query = buildRelatedQueryDocument({
      title: '2026-03-20',
      aliases: [],
      tags: ['plan/일기'],
      headings: ['Thanks', '-Tasks', 'Reflection'],
    });

    const vecLine = query.split('\n').find((line) => line.startsWith('vec:'));
    const hydeLine = query.split('\n').find((line) => line.startsWith('hyde:'));
    expect(vecLine).not.toMatch(/\s-\w/);
    expect(hydeLine).not.toMatch(/\s-\w/);
    expect(vecLine).toContain('Tasks');
    expect(hydeLine).toContain('Tasks');
  });

  it('limits topic terms in intent to 3', () => {
    const query = buildRelatedQueryDocument({
      title: 'Big Note',
      aliases: [],
      tags: ['alpha', 'beta', 'gamma', 'delta'],
      headings: ['epsilon', 'zeta'],
    });

    const intentLine = query.split('\n').find((line) => line.startsWith('intent:'));
    expect(intentLine).toContain('covering alpha, beta, gamma');
    expect(intentLine).not.toContain('delta');
  });
});
