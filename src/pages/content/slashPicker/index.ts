import browser from 'webextension-polyfill';

import { StorageKeys } from '@/core/types/common';

import { findChatInput, insertTextIntoChatInput } from '../chatInput/index';
import { expandInputCollapseIfNeeded } from '../inputCollapse/index';
import { setCaretPosition } from '../sendBehavior/utils';
import { resolveAndActivatePrompt } from '../prompt/promptActivation';
import { migratePromptTags } from '../prompt/tagMigration';
import { readPromptTags, writePromptTags } from '../prompt/tagChip';
import type { PromptTag } from '../prompt/tagTypes';
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

type PromptItem = SlashPromptItem & { createdAt?: number };

export interface SlashPickerLabels {
  empty: string;
  allTags: string;
  variableTitle: string;
  variableConfirm: string;
  variableCancel: string;
  inserted: string;
  copied: string;
}

const DEFAULT_LABELS: SlashPickerLabels = {
  empty: 'No prompts',
  allTags: 'All',
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
  let tagRegistry: PromptTag[] = [];
  let selectedTag: string | null = null;
  let currentQuery: ReturnType<typeof detectSlashQuery> = null;
  let insertOnClick = options?.insertOnClickEnabled ?? true;

  async function loadData(): Promise<void> {
    const result = await browser.storage.local.get({ [StorageKeys.PROMPT_ITEMS]: [] });
    items = Array.isArray(result[StorageKeys.PROMPT_ITEMS])
      ? (result[StorageKeys.PROMPT_ITEMS] as PromptItem[])
      : [];
    tagRegistry = await readPromptTags();
    const migrated = migratePromptTags(items, tagRegistry);
    if (migrated.changed) {
      tagRegistry = migrated.tags;
      await writePromptTags(tagRegistry);
    }
  }

  await loadData();

  try {
    const sync = await browser.storage.sync.get({ [StorageKeys.PROMPT_INSERT_ON_CLICK]: false });
    insertOnClick = sync[StorageKeys.PROMPT_INSERT_ON_CLICK] === true;
  } catch {
    /* keep default */
  }

  const refreshPicker = () => {
    if (!currentQuery?.active) {
      closeSlashPicker();
      return;
    }
    expandInputCollapseIfNeeded();
    const input = findChatInput({ requireVisible: false });
    if (!input) {
      // #region agent log
      fetch('http://127.0.0.1:7723/ingest/d1e77644-14e4-4f23-9749-78488f439345',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'05d5a1'},body:JSON.stringify({sessionId:'05d5a1',location:'slashPicker/index.ts:refreshPicker',message:'no input element for picker',data:{query:currentQuery.query},timestamp:Date.now(),hypothesisId:'H-collapsed-input'})}).catch(()=>{});
      // #endregion
      closeSlashPicker();
      return;
    }
    renderSlashPicker(
      input,
      items,
      tagRegistry,
      currentQuery.query,
      selectedTag,
      { empty: labels.empty, allTags: labels.allTags },
      {
        onSelect: (it) => void handleSelect(it, input),
        onClose: () => {
          closeSlashPicker();
          currentQuery = null;
        },
        onTagFilter: (tag) => {
          selectedTag = tag;
          refreshPicker();
        },
      },
    );
    // #region agent log
    fetch('http://127.0.0.1:7723/ingest/d1e77644-14e4-4f23-9749-78488f439345',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'05d5a1'},body:JSON.stringify({sessionId:'05d5a1',location:'slashPicker/index.ts:refreshPicker',message:'picker rendered',data:{query:currentQuery.query,itemCount:items.length,inputRectH:input.getBoundingClientRect().height},timestamp:Date.now(),hypothesisId:'H-collapsed-input',runId:'post-fix'})}).catch(()=>{});
    // #endregion
  };

  async function handleSelect(it: SlashPromptItem, input: HTMLElement): Promise<void> {
    const query = currentQuery;
    closeSlashPicker();
    currentQuery = null;
    if (!query) return;

    expandInputCollapseIfNeeded();

    // Remove /query token first
    replaceSlashToken(input, query.slashStart, query.slashEnd, '');

    const result = await resolveAndActivatePrompt({
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

    if (result === 'inserted' || result === 'copied') {
      // optional toast could be added
    }
  }

  const applySlashState = (
    input: HTMLElement,
    state: ReturnType<typeof detectSlashQuery>,
    source: string,
    extra?: Record<string, unknown>,
  ) => {
    const fullText = input.textContent?.replace(/\u200b/g, '') ?? '';
    const rawOffset = getTextOffset(input);
    // #region agent log
    fetch('http://127.0.0.1:7723/ingest/d1e77644-14e4-4f23-9749-78488f439345',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'05d5a1'},body:JSON.stringify({sessionId:'05d5a1',location:`slashPicker/index.ts:${source}`,message:'slash detect run',data:{fullText,rawOffset,resolvedOffset:state?.slashEnd??null,stateActive:!!state,query:state?.query??null,...extra},timestamp:Date.now(),hypothesisId:'H-offset-lag,H-collapsed-input'})}).catch(()=>{});
    // #endregion
    if (!state) {
      closeSlashPicker();
      currentQuery = null;
      return;
    }
    currentQuery = state;
    refreshPicker();
  };

  const runSlashDetect = (input: HTMLElement, source: string, extra?: Record<string, unknown>) => {
    applySlashState(input, detectSlashQuery(input), source, extra);
  };

  let observedInput: HTMLElement | null = null;
  let inputObserver: MutationObserver | null = null;

  const ensureInputObserver = () => {
    const input = findChatInput({ requireVisible: false });
    if (!input || input === observedInput) return;
    inputObserver?.disconnect();
    observedInput = input;
    inputObserver = new MutationObserver(() => {
      if (!shouldAllowSlashInVim(input)) return;
      runSlashDetect(input, 'mutationObserver');
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

    const pending = ev.data;
    requestAnimationFrame(() => {
      runSlashDetect(input, 'onBeforeInput', { pending, inputType: ev.inputType });
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

    runSlashDetect(input, 'onInput', {
      eventType: ev.type,
      inputType: ev.inputType,
      isTrusted: ev.isTrusted,
    });
  };

  const onKeyDownSlash = (ev: KeyboardEvent) => {
    if (ev.isComposing) return;
    const input = findChatInput({ requireVisible: false });
    const target = ev.target as HTMLElement | null;
    if (!input || !target || (target !== input && !input.contains(target))) return;
    if (!shouldAllowSlashInVim(input)) return;

    const isSlashKey = ev.code === 'Slash' || ev.key === '/' || ev.key === '／';
    if (isSlashKey && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
      applySlashState(input, detectSlashQueryWithInsert(input, '/'), 'keydownSlash', {
        code: ev.code,
        key: ev.key,
      });
    }

    if (ev.key === 'Backspace' || ev.key === 'Delete') {
      requestAnimationFrame(() => {
        if (!shouldAllowSlashInVim(input)) return;
        runSlashDetect(input, 'scheduleDetect', { key: ev.key });
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
    if (changes[StorageKeys.PROMPT_ITEMS] || changes[StorageKeys.PROMPT_TAGS]) {
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
