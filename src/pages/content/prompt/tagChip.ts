import browser from 'webextension-polyfill';

import { StorageKeys } from '@/core/types/common';

import { getTagColor } from './tagColors';
import { createTagIconElement } from './tagIcons';
import { isDarkMode } from '../folder/folderColors';
import type { PromptTag } from './tagTypes';
import { findTagByNormalized } from './tagMigration';

export async function readPromptTags(): Promise<PromptTag[]> {
  try {
    const result = await browser.storage.local.get({ [StorageKeys.PROMPT_TAGS]: [] });
    const raw = result[StorageKeys.PROMPT_TAGS];
    return Array.isArray(raw) ? (raw as PromptTag[]) : [];
  } catch {
    return [];
  }
}

export async function writePromptTags(tags: PromptTag[]): Promise<void> {
  await browser.storage.local.set({ [StorageKeys.PROMPT_TAGS]: tags });
}

export interface TagChipOptions {
  /** 'filter' for top bar buttons, 'meta' for list chips. */
  variant?: 'filter' | 'meta';
  active?: boolean;
  onClick?: (normalized: string, event: MouseEvent) => void;
  onContextMenu?: (tag: PromptTag, event: MouseEvent) => void;
}

export function renderTagChip(
  tag: PromptTag,
  registry: PromptTag[],
  options: TagChipOptions = {},
): HTMLElement {
  const entity = findTagByNormalized(registry, tag.normalized) ?? tag;
  const variant = options.variant ?? 'meta';
  const isFilter = variant === 'filter';
  const el = document.createElement(isFilter ? 'button' : 'span');
  el.className = isFilter ? 'gv-pm-tag gv-pm-tag-styled' : 'gv-pm-chip gv-pm-chip-styled';
  if (isFilter) {
    el.setAttribute('type', 'button');
    if (options.active) el.classList.add('active');
  }

  const dark = isDarkMode();
  const color = getTagColor(entity.colorId, dark);
  el.style.setProperty('--gv-tag-color', color);
  el.dataset.tagNormalized = entity.normalized;

  // #region agent log
  if (isFilter) {
    fetch('http://127.0.0.1:7723/ingest/d1e77644-14e4-4f23-9749-78488f439345',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'05d5a1'},body:JSON.stringify({sessionId:'05d5a1',location:'tagChip.ts:renderTagChip',message:'filter tag chip rendered',data:{normalized:entity.normalized,colorId:entity.colorId,cssVar:color,inPanel:!!el.closest('.gv-pm-panel'),classes:el.className},timestamp:Date.now(),hypothesisId:'H1-color'})}).catch(()=>{});
  }
  // #endregion

  const icon = createTagIconElement(entity.iconId, 'gv-pm-tag-icon');
  el.appendChild(icon);

  const label = document.createElement('span');
  label.className = 'gv-pm-tag-label';
  label.textContent = entity.name;
  el.appendChild(label);

  if (options.onClick) {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      options.onClick!(entity.normalized, e as MouseEvent);
    });
  }
  if (options.onContextMenu) {
    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      options.onContextMenu!(entity, e as MouseEvent);
    });
  }

  return el;
}

export function renderCompactTagChips(
  tagNames: string[],
  registry: PromptTag[],
  options: Omit<TagChipOptions, 'variant'> = {},
  maxVisible = 2,
): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'gv-pm-item-meta';
  const normalized = tagNames.map((t) => t.toLowerCase());
  const visible = normalized.slice(0, maxVisible);
  const overflow = normalized.length - visible.length;

  for (const n of visible) {
    const entity = findTagByNormalized(registry, n);
    if (!entity) {
      const fallback: PromptTag = {
        id: n,
        name: n,
        normalized: n,
        colorId: 'default',
        iconId: 'label',
        createdAt: 0,
      };
      wrap.appendChild(renderTagChip(fallback, registry, { ...options, variant: 'meta' }));
    } else {
      wrap.appendChild(renderTagChip(entity, registry, { ...options, variant: 'meta' }));
    }
  }

  if (overflow > 0) {
    const more = document.createElement('span');
    more.className = 'gv-pm-chip gv-pm-chip-overflow';
    more.textContent = `+${overflow}`;
    wrap.appendChild(more);
  }

  return wrap;
}

export function renderFilterTagButton(
  tag: PromptTag,
  registry: PromptTag[],
  active: boolean,
  onClick: (normalized: string) => void,
  onContextMenu?: (tag: PromptTag, event: MouseEvent) => void,
): HTMLElement {
  return renderTagChip(tag, registry, {
    variant: 'filter',
    active,
    onClick: (n) => onClick(n),
    onContextMenu,
  });
}
