import { describe, expect, it } from 'vitest';

import { detectSlashQuery, detectSlashQueryWithInsert, resolveSlashCaretOffset } from '../triggerDetect';

function makeEditable(text: string, caretAt: number): HTMLDivElement {
  const el = document.createElement('div');
  el.setAttribute('contenteditable', 'true');
  el.textContent = text;
  document.body.appendChild(el);
  const range = document.createRange();
  const node = el.firstChild!;
  range.setStart(node, caretAt);
  range.collapse(true);
  const sel = window.getSelection()!;
  sel.removeAllRanges();
  sel.addRange(range);
  return el;
}

describe('detectSlashQuery', () => {
  it('detects slash at line start', () => {
    const el = makeEditable('/精修', 3);
    const state = detectSlashQuery(el);
    expect(state?.active).toBe(true);
    expect(state?.query).toBe('精修');
    el.remove();
  });

  it('ignores slash inside url-like prefix', () => {
    const el = makeEditable('https://example.com', 18);
    const state = detectSlashQuery(el);
    expect(state).toBeNull();
    el.remove();
  });

  it('detects slash after whitespace', () => {
    const el = makeEditable('hello /foo', 10);
    const state = detectSlashQuery(el);
    expect(state?.query).toBe('foo');
    el.remove();
  });

  it('detects slash when user typed multiple slashes at line start', () => {
    const el = makeEditable('//', 2);
    const state = detectSlashQuery(el);
    expect(state?.active).toBe(true);
    expect(state?.query).toBe('');
    el.remove();
  });

  it('detects slash when caret offset lags at 0 but text is already "/"', () => {
    const el = document.createElement('div');
    el.setAttribute('contenteditable', 'true');
    el.textContent = '/';
    document.body.appendChild(el);
    const range = document.createRange();
    range.setStart(el, 0);
    range.collapse(true);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);

    expect(resolveSlashCaretOffset(el, '/')).toBe(1);
    expect(detectSlashQuery(el)?.active).toBe(true);
    el.remove();
  });

  it('detects slash-only buffer when caret is not at end', () => {
    const el = document.createElement('div');
    el.setAttribute('contenteditable', 'true');
    el.textContent = '////';
    document.body.appendChild(el);
    const range = document.createRange();
    range.setStart(el.firstChild!, 1);
    range.collapse(true);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);

    expect(detectSlashQuery(el)?.active).toBe(true);
    el.remove();
  });

  it('detects slash on keydown before DOM insert at empty input', () => {
    const el = document.createElement('div');
    el.setAttribute('contenteditable', 'true');
    el.textContent = '';
    document.body.appendChild(el);
    const range = document.createRange();
    range.setStart(el, 0);
    range.collapse(true);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);

    expect(detectSlashQueryWithInsert(el, '/')?.active).toBe(true);
    el.remove();
  });
});
