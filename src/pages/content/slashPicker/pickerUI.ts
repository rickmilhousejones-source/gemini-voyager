import { buildGroupSections, findGroupById, previewText } from '../prompt/groupMigration';
import { extractPlainTitle } from '../prompt/compactTitle';
import {
  createGroupIconElement,
  resolveGroupIconId,
  UNGROUPED_GROUP_ICON_ID,
} from '../prompt/groupIcons';
import type { PromptGroup } from '../prompt/groupTypes';

export interface SlashPromptItem {
  id: string;
  text: string;
  name?: string;
  groupId: string | null;
}

export interface SlashPickerLabels {
  empty: string;
  ungrouped: string;
}

export interface SlashPickerCallbacks {
  onSelect: (item: SlashPromptItem) => void;
  onClose: () => void;
}

let pickerEl: HTMLElement | null = null;
let highlightIndex = 0;
let filteredItems: SlashPromptItem[] = [];
/** True after ArrowUp/Down; avoids highlighting the first row on open. */
let keyboardHighlightVisible = false;

/** Only truncate slash item titles longer than this. */
const SLASH_ITEM_TITLE_TRUNCATE_LEN = 32;

export function closeSlashPicker(): void {
  pickerEl?.remove();
  pickerEl = null;
  highlightIndex = 0;
  filteredItems = [];
  keyboardHighlightVisible = false;
}

export function isSlashPickerOpen(): boolean {
  return pickerEl !== null;
}

function resolveSectionIconId(section: { groupId: string | null }, groups: PromptGroup[]): string {
  if (!section.groupId) return UNGROUPED_GROUP_ICON_ID;
  const group = findGroupById(groups, section.groupId);
  return resolveGroupIconId(group);
}

export function renderSlashPicker(
  anchor: HTMLElement,
  items: SlashPromptItem[],
  groups: PromptGroup[],
  query: string,
  labels: SlashPickerLabels,
  callbacks: SlashPickerCallbacks,
  sectionOrder?: string[] | null,
): void {
  closeSlashPicker();

  const ungroupedLabel = labels.ungrouped || 'Ungrouped';
  const sections = buildGroupSections(items, groups, query, ungroupedLabel, {
    sectionOrder,
  });
  filteredItems = sections.flatMap((s) => s.items as SlashPromptItem[]);
  highlightIndex = 0;
  keyboardHighlightVisible = false;

  const pop = document.createElement('div');
  pop.className = 'gv-slash-picker';
  pop.setAttribute('role', 'listbox');

  const list = document.createElement('div');
  list.className = 'gv-pm-list gv-slash-picker-list';

  if (filteredItems.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'gv-pm-empty';
    empty.textContent = labels.empty;
    list.appendChild(empty);
  } else {
    let itemIndex = 0;
    sections.forEach((section, sectionIdx) => {
      const sectionEl = document.createElement('div');
      sectionEl.className = 'gv-slash-picker-section';
      if (sectionIdx > 0) sectionEl.classList.add('gv-slash-picker-section-divider');

      const sectionIconId = resolveSectionIconId(section, groups);

      const groupHeader = document.createElement('div');
      groupHeader.className = 'gv-slash-picker-group';
      const groupName = document.createElement('span');
      groupName.className = 'gv-slash-picker-group-name';
      groupName.textContent = section.name;
      groupHeader.appendChild(groupName);
      sectionEl.appendChild(groupHeader);

      for (const it of section.items) {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'gv-pm-item gv-slash-picker-item';
        row.setAttribute('role', 'option');
        if (keyboardHighlightVisible && itemIndex === highlightIndex) row.classList.add('active');

        row.appendChild(createGroupIconElement(sectionIconId, 'gv-slash-picker-item-icon', 16));

        const title = document.createElement('span');
        title.className = 'gv-slash-picker-item-title';
        const titleText =
          (it.name && it.name.trim()) || extractPlainTitle(String(it.text ?? ''));
        title.textContent = titleText;
        if (titleText.length > SLASH_ITEM_TITLE_TRUNCATE_LEN) {
          title.classList.add('gv-slash-picker-item-title-long');
        }
        row.appendChild(title);

        const desc = document.createElement('span');
        desc.className = 'gv-slash-picker-item-desc';
        desc.textContent = previewText(String(it.text ?? ''), 120);
        row.appendChild(desc);

        const captured = it as SlashPromptItem;
        row.addEventListener('click', () => callbacks.onSelect(captured));
        sectionEl.appendChild(row);
        itemIndex += 1;
      }

      list.appendChild(sectionEl);
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
  const pw = Math.min(440, vw - 16);
  pop.style.width = `${pw}px`;
  const ph = pop.offsetHeight || 280;
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
  keyboardHighlightVisible = true;
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
