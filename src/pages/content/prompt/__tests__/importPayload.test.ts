import { describe, expect, it } from 'vitest';

import { parsePromptImportPayload } from '../importPayload';

describe('parsePromptImportPayload', () => {
  it('returns empty for an exported payload with no prompt items', () => {
    expect(
      parsePromptImportPayload({
        format: 'gemini-voyager.prompts.v1',
        exportedAt: '2026-04-15T00:00:00.000Z',
        items: [],
      }),
    ).toEqual({ status: 'empty' });
  });

  it('accepts legacy payloads that only contain an items array', () => {
    expect(
      parsePromptImportPayload({
        items: [{ text: 'Use TypeScript', tags: ['Code', 'Code'] }],
      }),
    ).toEqual({
      status: 'ok',
      items: [{ text: 'Use TypeScript', groupId: null }],
    });
  });

  it('returns invalid when all imported items are unusable', () => {
    expect(
      parsePromptImportPayload({
        format: 'gemini-voyager.prompts.v1',
        items: [{ text: '   ', tags: [] }],
      }),
    ).toEqual({ status: 'invalid' });
  });

  it('preserves an optional name field when round-tripping an exported item', () => {
    const result = parsePromptImportPayload({
      format: 'gemini-voyager.prompts.v2',
      items: [{ text: 'Translate EN→ZH', groupId: 'g1', name: 'Translator' }],
    });
    expect(result).toEqual({
      status: 'ok',
      items: [{ text: 'Translate EN→ZH', groupId: 'g1', name: 'Translator' }],
    });
  });

  it('ignores legacy tags and keeps groupId null', () => {
    const result = parsePromptImportPayload({
      items: [{ text: 'A', tags: ['foo'], groupId: null }],
    });
    expect(result).toEqual({
      status: 'ok',
      items: [{ text: 'A', groupId: null }],
    });
  });

  it('trims whitespace around an imported name and drops it entirely when empty', () => {
    const result = parsePromptImportPayload({
      items: [
        { text: 'A', groupId: null, name: '  Custom  ' },
        { text: 'B', groupId: null, name: '   ' },
        { text: 'C', groupId: null },
      ],
    });
    expect(result).toEqual({
      status: 'ok',
      items: [
        { text: 'A', groupId: null, name: 'Custom' },
        { text: 'B', groupId: null },
        { text: 'C', groupId: null },
      ],
    });
  });

  it('ignores non-string name fields', () => {
    const result = parsePromptImportPayload({
      items: [{ text: 'A', groupId: null, name: 42 }],
    });
    expect(result).toEqual({
      status: 'ok',
      items: [{ text: 'A', groupId: null }],
    });
  });
});
