import { getTextOffset } from '../sendBehavior/utils';

export interface SlashQueryState {
  active: boolean;
  query: string;
  slashStart: number;
  slashEnd: number;
}

const URL_GUARD = /:\/?$/;

/**
 * Gemini/Quill often leaves the selection at offset 0 while textContent already
 * contains the typed `/` token at line start.
 */
export function resolveSlashCaretOffset(root: HTMLElement, fullText: string): number | null {
  let offset = getTextOffset(root);
  if (offset === null) {
    return fullText.length > 0 ? fullText.length : null;
  }

  if (fullText.startsWith('/') && offset < fullText.length) {
    if (offset === 0 || /^\/+$/.test(fullText)) {
      return fullText.length;
    }
  }

  return offset;
}

function detectSlashQueryAtOffset(fullText: string, offset: number): SlashQueryState | null {
  const before = fullText.slice(0, offset);
  const slashIdx = before.lastIndexOf('/');
  if (slashIdx < 0) return null;

  const prefix = before.slice(0, slashIdx);
  // Allow `/`, `//`, … at line start while user is opening the slash picker.
  if (prefix.length > 0 && !/[\s\n]$/.test(prefix) && !/^\/+$/.test(prefix)) return null;
  if (URL_GUARD.test(prefix)) return null;
  if (prefix.includes('://')) return null;

  const query = before.slice(slashIdx + 1);
  if (/\s/.test(query)) return null;

  return {
    active: true,
    query,
    slashStart: slashIdx,
    slashEnd: offset,
  };
}

/**
 * Detect `/query` token at line start or when input is empty-ish.
 * Returns null when slash picker should not open.
 */
export function detectSlashQuery(root: HTMLElement, textOverride?: string): SlashQueryState | null {
  const fullText = textOverride ?? root.textContent?.replace(/\u200b/g, '') ?? '';
  const offset = resolveSlashCaretOffset(root, fullText);
  if (offset === null) return null;
  return detectSlashQueryAtOffset(fullText, offset);
}

/** Simulate inserting text at the caret (keydown fires before DOM updates). */
export function detectSlashQueryWithInsert(root: HTMLElement, insert: string): SlashQueryState | null {
  const fullText = root.textContent?.replace(/\u200b/g, '') ?? '';
  let offset = getTextOffset(root);
  if (offset === null) offset = fullText.length;

  const nextText = fullText.slice(0, offset) + insert + fullText.slice(offset);
  let nextOffset = offset + insert.length;

  if (nextText.startsWith('/') && (offset === 0 || /^\/+$/.test(nextText.slice(0, nextOffset)))) {
    nextOffset = nextText.length;
  }

  return detectSlashQueryAtOffset(nextText, nextOffset);
}

export function isChatInputEmpty(root: HTMLElement): boolean {
  const text = root.textContent?.replace(/\u200b/g, '').trim() ?? '';
  return text.length === 0 || root.classList.contains('ql-blank');
}

export function shouldAllowSlashInVim(activeInput: HTMLElement | null): boolean {
  if (!activeInput) return true;
  if (activeInput.classList.contains('gv-input-vim-mode-normal')) return false;
  if (activeInput.classList.contains('gv-input-vim-mode-visual')) return false;
  return true;
}
