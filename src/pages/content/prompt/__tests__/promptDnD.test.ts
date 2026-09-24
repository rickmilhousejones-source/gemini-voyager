import { describe, expect, it } from 'vitest';

import {
  placeFromClientY,
  resolvePromptDropOnRow,
  resolvePromptDropOnSection,
} from '../promptDnD';

describe('promptDnD helpers', () => {
  it('placeFromClientY picks before/after from midpoint', () => {
    const el = document.createElement('div');
    el.getBoundingClientRect = () =>
      ({ top: 100, height: 40, bottom: 140, left: 0, right: 0, width: 0, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    expect(placeFromClientY(el, 110)).toBe('before');
    expect(placeFromClientY(el, 130)).toBe('after');
  });

  it('resolvePromptDropOnRow maps after to next sibling or append', () => {
    const parent = document.createElement('div');
    const row = document.createElement('div');
    row.dataset.gvPmItemId = 'a';
    const next = document.createElement('div');
    next.dataset.gvPmItemId = 'b';
    parent.appendChild(row);
    parent.appendChild(next);
    row.getBoundingClientRect = () =>
      ({ top: 0, height: 20, bottom: 20, left: 0, right: 0, width: 0, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;

    expect(resolvePromptDropOnRow(row, 5, 'g1', 'a')).toEqual({
      kind: 'prompt',
      targetGroupId: 'g1',
      beforeItemId: 'a',
    });
    expect(resolvePromptDropOnRow(row, 15, 'g1', 'a')).toEqual({
      kind: 'prompt',
      targetGroupId: 'g1',
      beforeItemId: 'b',
    });
  });

  it('resolvePromptDropOnSection appends when collapsed or empty', () => {
    expect(resolvePromptDropOnSection('g1', 'x', true)).toEqual({
      kind: 'prompt',
      targetGroupId: 'g1',
      beforeItemId: null,
    });
    expect(resolvePromptDropOnSection('g1', 'x', false)).toEqual({
      kind: 'prompt',
      targetGroupId: 'g1',
      beforeItemId: 'x',
    });
  });
});
