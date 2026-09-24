import browser from 'webextension-polyfill';

import { StorageKeys } from '@/core/types/common';

import { findChatInput, insertTextIntoChatInput } from '../chatInput/index';
import { expandInputCollapseIfNeeded } from '../inputCollapse/index';
import { setCaretPosition } from '../sendBehavior/utils';
import { resolveAndActivatePrompt } from '../prompt/promptActivation';
import { migrateItemsToGroups, normalizeSectionOrder } from '../prompt/groupMigration';
import { readPromptGroups, readPromptSectionOrder } from '../prompt/groupStorage';
import type { PromptGroup } from '../prompt/groupTypes';
import {
  closeSlashPicker,
  isSlashPickerOpen,
  moveSlashPickerHighlight,
  renderSlashPicker,
  repositionSlashPicker,
  selectHighlightedSlashItem,
  type SlashPromptItem,
} from './pickerUI';
import {
  detectSlashQuery,
  detectSlashQueryWithInsert,
  shouldAllowSlashInVim,
} from './triggerDetect';
import { getTextOffset } from '../sendBehavior/utils';

let skipNextInputDetect = false;

type PromptItem = SlashPromptItem & { createdAt?: number; order?: number };

export interface SlashPickerLabels {
  empty: string;
  ungrouped: string;
  variableTitle: string;
  variableConfirm: string;
  variableCancel: string;
  inserted: string;
  copied: string;
}

const DEFAULT_LABELS: SlashPickerLabels = {
  empty: 'No prompts',
  ungrouped: 'Ungrouped',
  variableTitle: 'Fill variables',
  variableConfirm: 'Insert',
  variableCancel: 'Cancel',
  inserted: 'Inserted',
  copied: 'Copied',
};

function copyText(text: string): Promise<void> {
  try {
    return navigator.clipboard.writeText(text);
  } catch {
    return Promise.resolve();
  }
}

function replaceSlashToken(input: HTMLElement, slashStart: number, slashEnd: number, replacement: string): void {
  const fullText = input.textContent?.replace(/\u200b/g, '') ?? '';
  const newText = fullText.slice(0, slashStart) + replacement + fullText.slice(slashEnd);
  input.textContent = newText;
  input.classList.remove('ql-blank');
  setCaretPosition(input, slashStart + replacement.length);
  skipNextInputDetect = true;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

export async function startSlashPicker(options?: {
  labels?: Partial<SlashPickerLabels>;
  insertOnClickEnabled?: boolean;
}): Promise<{ destroy: () => void }> {
  const labels = { ...DEFAULT_LABELS, ...options?.labels };
  let items: PromptItem[] = [];
  let groups: PromptGroup[] = [];
  let sectionOrder: string[] = [];
  let currentQuery: ReturnType<typeof detectSlashQuery> = null;
  const insertOnClick = options?.insertOnClickEnabled ?? true;

  async function loadData(): Promise<void> {
    const result = await browser.storage.local.get({ [StorageKeys.PROMPT_ITEMS]: [] });
    const raw = Array.isArray(result[StorageKeys.PROMPT_ITEMS])
      ? (result[StorageKeys.PROMPT_ITEMS] as PromptItem[])
      : [];
    items = migrateItemsToGroups(raw) as PromptItem[];
    groups = await readPromptGroups();
    sectionOrder = normalizeSectionOrder(groups, await readPromptSectionOrder());
  }

  await loadData();

  const refreshPicker = () => {
    if (!currentQuery?.active) {
      closeSlashPicker();
      return;
    }
    expandInputCollapseIfNeeded();
    const input = findChatInput({ requireVisible: false });
    if (!input) {
      closeSlashPicker();
      return;
    }
    renderSlashPicker(
      input,
      items,
      groups,
      currentQuery.query,
      { empty: labels.empty, ungrouped: labels.ungrouped },
      {
        onSelect: (it) => void handleSelect(it, input),
        onClose: () => {
          closeSlashPicker();
          currentQuery = null;
        },
      },
      sectionOrder,
    );
  };

  async function handleSelect(it: SlashPromptItem, input: HTMLElement): Promise<void> {
    const query = currentQuery;
    closeSlashPicker();
    currentQuery = null;
    if (!query) return;

    expandInputCollapseIfNeeded();
    input.focus();

    replaceSlashToken(input, query.slashStart, query.slashEnd, '');

    await resolveAndActivatePrompt({
      text: it.text,
      insertOnClickEnabled: insertOnClick,
      variableLabels: {
        title: labels.variableTitle,
        confirm: labels.variableConfirm,
        cancel: labels.variableCancel,
        fieldLabel: (name) => name,
      },
      anchor: input,
      copyText,
      expandInputCollapseIfNeeded,
      insertTextIntoChatInput: (text) => insertTextIntoChatInput(text, input),
    });
  }

  const applySlashState = (
    input: HTMLElement,
    state: ReturnType<typeof detectSlashQuery>,
  ) => {
    if (!state) {
      if (currentQuery?.active && Date.now() < slashOpenUntil) {
        return;
      }
      if (currentQuery?.active) {
        requestAnimationFrame(() => {
          const retry = detectSlashQuery(input);
          if (retry?.active) {
            currentQuery = retry;
            refreshPicker();
            return;
          }
          closeSlashPicker();
          currentQuery = null;
        });
        return;
      }
      closeSlashPicker();
      currentQuery = null;
      return;
    }
    currentQuery = state;
    refreshPicker();
  };

  const runSlashDetect = (input: HTMLElement) => {
    applySlashState(input, detectSlashQuery(input));
  };

  let observedInput: HTMLElement | null = null;
  let inputObserver: MutationObserver | null = null;
  let mutationDetectRaf = 0;
  let slashOpenUntil = 0;

  const ensureInputObserver = () => {
    const input = findChatInput({ requireVisible: false });
    if (!input || input === observedInput) return;
    inputObserver?.disconnect();
    observedInput = input;
    inputObserver = new MutationObserver(() => {
      if (!shouldAllowSlashInVim(input)) return;
      cancelAnimationFrame(mutationDetectRaf);
      mutationDetectRaf = requestAnimationFrame(() => {
        runSlashDetect(input);
      });
    });
    inputObserver.observe(input, { childList: true, subtree: true, characterData: true });
  };

  const onBeforeInput = (ev: Event) => {
    if (!(ev instanceof InputEvent) || ev.isComposing) return;
    if (ev.inputType !== 'insertText' || !ev.data?.includes('/')) return;
    const target = ev.target as HTMLElement;
    const input = findChatInput({ requireVisible: false });
    if (!input || (target !== input && !input.contains(target))) return;
    if (!shouldAllowSlashInVim(input)) return;

    requestAnimationFrame(() => {
      runSlashDetect(input);
    });
  };

  const onInput = (ev: Event) => {
    if (!(ev instanceof InputEvent)) return;
    if (skipNextInputDetect) {
      skipNextInputDetect = false;
      return;
    }
    if (ev.isComposing) return;

    const target = ev.target as HTMLElement;
    if (!target.isContentEditable && !(target instanceof HTMLTextAreaElement)) return;

    const input = findChatInput({ requireVisible: false });
    if (!input || (target !== input && !input.contains(target))) return;
    if (!shouldAllowSlashInVim(input)) {
      closeSlashPicker();
      return;
    }

    runSlashDetect(input);
  };

  const onKeyDownSlash = (ev: KeyboardEvent) => {
    if (ev.isComposing) return;
    const input = findChatInput({ requireVisible: false });
    const target = ev.target as HTMLElement | null;
    if (!input || !target || (target !== input && !input.contains(target))) return;
    if (!shouldAllowSlashInVim(input)) return;

    const isSlashKey = ev.code === 'Slash' || ev.key === '/' || ev.key === '／';
    if (isSlashKey && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
      slashOpenUntil = Date.now() + 400;
      applySlashState(input, detectSlashQueryWithInsert(input, '/'));
    }

    if (ev.key === 'Backspace' || ev.key === 'Delete') {
      requestAnimationFrame(() => {
        if (!shouldAllowSlashInVim(input)) return;
        runSlashDetect(input);
      });
    }
  };

  const onFocusIn = () => {
    ensureInputObserver();
  };

  const onKeyDown = (ev: KeyboardEvent) => {
    if (ev.isComposing) return;
    if (!isSlashPickerOpen()) return;

    const input = findChatInput({ requireVisible: false });
    if (!input) return;

    if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      moveSlashPickerHighlight(1);
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      moveSlashPickerHighlight(-1);
    } else if (ev.key === 'Enter') {
      ev.preventDefault();
      const item = selectHighlightedSlashItem();
      if (item) void handleSelect(item, input);
    } else if (ev.key === 'Escape') {
      ev.preventDefault();
      closeSlashPicker();
      currentQuery = null;
    }
  };

  const onScroll = () => {
    const input = findChatInput({ requireVisible: false });
    if (input && isSlashPickerOpen()) repositionSlashPicker(input);
  };

  const onStorage = (
    changes: Record<string, browser.Storage.StorageChange>,
    area: string,
  ) => {
    if (area !== 'local') return;
    if (
      changes[StorageKeys.PROMPT_ITEMS] ||
      changes[StorageKeys.PROMPT_GROUPS] ||
      changes[StorageKeys.PROMPT_SECTION_ORDER]
    ) {
      void loadData().then(() => {
        if (currentQuery?.active) refreshPicker();
      });
    }
  };

  document.addEventListener('beforeinput', onBeforeInput, true);
  document.addEventListener('input', onInput, true);
  document.addEventListener('keydown', onKeyDownSlash, true);
  document.addEventListener('focusin', onFocusIn, true);
  ensureInputObserver();
  window.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('scroll', onScroll, true);
  window.addEventListener('resize', onScroll, true);
  browser.storage.onChanged.addListener(onStorage);

  return {
    destroy: () => {
      document.removeEventListener('beforeinput', onBeforeInput, true);
      document.removeEventListener('input', onInput, true);
      document.removeEventListener('keydown', onKeyDownSlash, true);
      document.removeEventListener('focusin', onFocusIn, true);
      inputObserver?.disconnect();
      inputObserver = null;
      observedInput = null;
      cancelAnimationFrame(mutationDetectRaf);
      mutationDetectRaf = 0;
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll, true);
      try {
        browser.storage?.onChanged?.removeListener(onStorage);
      } catch {
        /* extension context may be gone */
      }
      closeSlashPicker();
    },
  };
}
