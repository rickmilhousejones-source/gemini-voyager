import { renderFilterTagButton, renderTagChip } from '../prompt/tagChip';
import type { PromptTag } from '../prompt/tagTypes';
import { findTagByNormalized } from '../prompt/tagMigration';

export interface SlashPromptItem {
  id: string;
  text: string;
  name?: string;
  tags: string[];
}

export interface SlashPickerLabels {
  empty: string;
  allTags: string;
}

export interface SlashPickerCallbacks {
  onSelect: (item: SlashPromptItem) => void;
  onClose: () => void;
  onTagFilter: (normalized: string | null) => void;
}

let pickerEl: HTMLElement | null = null;
let highlightIndex = 0;
let filteredItems: SlashPromptItem[] = [];

export function closeSlashPicker(): void {
  pickerEl?.remove();
  pickerEl = null;
  highlightIndex = 0;
  filteredItems = [];
}

export function isSlashPickerOpen(): boolean {
  return pickerEl !== null;
}

export function renderSlashPicker(
  anchor: HTMLElement,
  items: SlashPromptItem[],
  tagRegistry: PromptTag[],
  query: string,
  selectedTag: string | null,
  labels: SlashPickerLabels,
  callbacks: SlashPickerCallbacks,
): void {
  closeSlashPicker();

  const q = query.toLowerCase();
  filteredItems = items.filter((it) => {
    if (selectedTag && !(it.tags || []).includes(selectedTag)) return false;
    if (!q) return true;
    const title = (it.name || it.text).toLowerCase();
    return (
      title.includes(q) ||
      it.text.toLowerCase().includes(q) ||
      (it.tags || []).some((t) => t.includes(q))
    );
  });

  highlightIndex = 0;

  const pop = document.createElement('div');
  pop.className = 'gv-slash-picker';
  pop.setAttribute('role', 'listbox');

  const tagsRow = document.createElement('div');
  tagsRow.className = 'gv-pm-tags gv-slash-picker-tags';

  const allBtn = document.createElement('button');
  allBtn.type = 'button';
  allBtn.className = 'gv-pm-tag';
  allBtn.textContent = labels.allTags;
  if (!selectedTag) allBtn.classList.add('active');
  allBtn.addEventListener('click', () => callbacks.onTagFilter(null));
  tagsRow.appendChild(allBtn);

  const tagNames = Array.from(
    new Set(items.flatMap((it) => it.tags || []).map((t) => t.toLowerCase())),
  ).sort();
  for (const n of tagNames) {
    const entity = findTagByNormalized(tagRegistry, n);
    if (entity) {
      tagsRow.appendChild(
        renderFilterTagButton(entity, tagRegistry, selectedTag === n, (norm) =>
          callbacks.onTagFilter(selectedTag === norm ? null : norm),
        ),
      );
    }
  }
  pop.appendChild(tagsRow);

  const list = document.createElement('div');
  list.className = 'gv-pm-list gv-slash-picker-list';

  if (filteredItems.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'gv-pm-empty';
    empty.textContent = labels.empty;
    list.appendChild(empty);
  } else {
    filteredItems.forEach((it, idx) => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'gv-pm-item gv-slash-picker-item';
      row.setAttribute('role', 'option');
      if (idx === highlightIndex) row.classList.add('active');

      const title = document.createElement('div');
      title.className = 'gv-slash-picker-title';
      title.textContent = (it.name && it.name.trim()) || it.text.slice(0, 60);
      row.appendChild(title);

      if (it.tags?.length) {
        const meta = document.createElement('div');
        meta.className = 'gv-slash-picker-meta';
        for (const t of it.tags.slice(0, 2)) {
          const entity = findTagByNormalized(tagRegistry, t);
          if (entity) meta.appendChild(renderTagChip(entity, tagRegistry, { variant: 'meta' }));
        }
        row.appendChild(meta);
      }

      row.addEventListener('click', () => callbacks.onSelect(it));
      list.appendChild(row);
    });
  }

  pop.appendChild(list);
  document.body.appendChild(pop);
  pickerEl = pop;

  positionSlashPicker(anchor, pop);

  const onOutside = (ev: MouseEvent) => {
    const t = ev.target as HTMLElement;
    if (!t.closest('.gv-slash-picker') && !t.closest('[contenteditable="true"]')) {
      callbacks.onClose();
    }
  };
  window.addEventListener('click', onOutside, true);
  pop.dataset.outsideListener = '1';
}

function positionSlashPicker(anchor: HTMLElement, pop: HTMLElement): void {
  let r = anchor.getBoundingClientRect();
  if (r.height <= 0) {
    const container =
      anchor.closest('.element-to-collapse') ??
      anchor.closest('.input-area') ??
      anchor.parentElement;
    if (container instanceof HTMLElement) {
      r = container.getBoundingClientRect();
    }
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const pw = Math.min(360, vw - 16);
  pop.style.width = `${pw}px`;
  const ph = pop.offsetHeight || 240;
  let top = r.top - ph - 8;
  if (top < 8) top = r.bottom + 8;
  if (top + ph > vh - 8) top = Math.max(8, vh - ph - 8);
  const left = Math.min(vw - pw - 8, Math.max(8, r.left));
  pop.style.position = 'fixed';
  pop.style.top = `${Math.round(top)}px`;
  pop.style.left = `${Math.round(left)}px`;
  pop.style.zIndex = '9999';
}

export function moveSlashPickerHighlight(delta: number): void {
  if (!pickerEl || filteredItems.length === 0) return;
  highlightIndex = (highlightIndex + delta + filteredItems.length) % filteredItems.length;
  const rows = pickerEl.querySelectorAll('.gv-slash-picker-item');
  rows.forEach((row, i) => row.classList.toggle('active', i === highlightIndex));
  rows[highlightIndex]?.scrollIntoView({ block: 'nearest' });
}

export function selectHighlightedSlashItem(): SlashPromptItem | null {
  return filteredItems[highlightIndex] ?? null;
}

export function repositionSlashPicker(anchor: HTMLElement): void {
  if (pickerEl) positionSlashPicker(anchor, pickerEl);
}
