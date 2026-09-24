/** HTML5 DnD helpers for prompt manager list reorder. */

export const DND_PROMPT_TYPE = 'application/x-gv-pm-prompt';
export const DND_SECTION_TYPE = 'application/x-gv-pm-section';

const EXPAND_HOVER_MS = 380;

export type PromptDropTarget = {
  kind: 'prompt';
  targetGroupId: string | null;
  /** Insert before this id; null = append to group end. */
  beforeItemId: string | null;
};

export type SectionDropTarget = {
  kind: 'section';
  toKey: string;
  place: 'before' | 'after';
};

export type ListDropTarget = PromptDropTarget | SectionDropTarget;

function hasType(dt: DataTransfer | null, type: string): boolean {
  if (!dt) return false;
  return Array.from(dt.types).includes(type);
}

export function isPromptDrag(dt: DataTransfer | null): boolean {
  return hasType(dt, DND_PROMPT_TYPE);
}

export function isSectionDrag(dt: DataTransfer | null): boolean {
  return hasType(dt, DND_SECTION_TYPE);
}

export function readDragId(dt: DataTransfer | null, type: string): string | null {
  if (!dt) return null;
  try {
    const v = dt.getData(type);
    return v || null;
  } catch {
    return null;
  }
}

export function clearDropIndicators(root: HTMLElement): void {
  root.querySelectorAll('.gv-pm-drop-before, .gv-pm-drop-after, .gv-pm-drop-into').forEach((el) => {
    el.classList.remove('gv-pm-drop-before', 'gv-pm-drop-after', 'gv-pm-drop-into');
  });
}

export function createDragHandle(ariaLabel: string): HTMLElement {
  const handle = document.createElement('span');
  handle.className = 'gv-pm-drag-handle';
  handle.textContent = '⋮⋮';
  handle.setAttribute('role', 'button');
  handle.setAttribute('aria-label', ariaLabel);
  handle.tabIndex = 0;
  handle.draggable = true;
  handle.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
  return handle;
}

export function bindPromptHandleDrag(
  handle: HTMLElement,
  itemId: string,
  onDragStart: () => void,
  onDragEnd: () => void,
): void {
  handle.addEventListener('dragstart', (e) => {
    const ev = e as DragEvent;
    if (!ev.dataTransfer) return;
    ev.stopPropagation();
    ev.dataTransfer.effectAllowed = 'move';
    ev.dataTransfer.setData(DND_PROMPT_TYPE, itemId);
    ev.dataTransfer.setData('text/plain', itemId);
    onDragStart();
  });
  handle.addEventListener('dragend', () => {
    onDragEnd();
  });
}

export function bindSectionHandleDrag(
  handle: HTMLElement,
  sectionKey: string,
  onDragStart: () => void,
  onDragEnd: () => void,
): void {
  handle.addEventListener('dragstart', (e) => {
    const ev = e as DragEvent;
    if (!ev.dataTransfer) return;
    ev.stopPropagation();
    ev.dataTransfer.effectAllowed = 'move';
    ev.dataTransfer.setData(DND_SECTION_TYPE, sectionKey);
    ev.dataTransfer.setData('text/plain', sectionKey);
    onDragStart();
  });
  handle.addEventListener('dragend', () => {
    onDragEnd();
  });
}

/** Resolve drop place from pointer Y within an element's box. */
export function placeFromClientY(el: HTMLElement, clientY: number): 'before' | 'after' {
  const rect = el.getBoundingClientRect();
  const mid = rect.top + rect.height / 2;
  return clientY < mid ? 'before' : 'after';
}

export type ExpandOnHoverController = {
  onEnterCollapsed: (sectionKey: string, expand: () => void) => void;
  onLeave: () => void;
  clear: () => void;
};

export function createExpandOnHoverController(): ExpandOnHoverController {
  let timer: number | null = null;
  let pendingKey: string | null = null;

  const clear = () => {
    if (timer != null) {
      window.clearTimeout(timer);
      timer = null;
    }
    pendingKey = null;
  };

  return {
    onEnterCollapsed(sectionKey, expand) {
      if (pendingKey === sectionKey && timer != null) return;
      clear();
      pendingKey = sectionKey;
      timer = window.setTimeout(() => {
        timer = null;
        pendingKey = null;
        expand();
      }, EXPAND_HOVER_MS);
    },
    onLeave() {
      clear();
    },
    clear,
  };
}

export function resolvePromptDropOnRow(
  row: HTMLElement,
  clientY: number,
  targetGroupId: string | null,
  rowItemId: string,
): PromptDropTarget {
  const place = placeFromClientY(row, clientY);
  if (place === 'before') {
    return { kind: 'prompt', targetGroupId, beforeItemId: rowItemId };
  }
  // after → before next sibling, or append
  const next = row.nextElementSibling as HTMLElement | null;
  const nextId = next?.dataset?.gvPmItemId;
  return {
    kind: 'prompt',
    targetGroupId,
    beforeItemId: nextId || null,
  };
}

export function resolvePromptDropOnSection(
  targetGroupId: string | null,
  /** First item id in the open section, if any */
  firstItemId: string | null,
  collapsed: boolean,
): PromptDropTarget {
  if (collapsed || !firstItemId) {
    return { kind: 'prompt', targetGroupId, beforeItemId: null };
  }
  // Dropping on open header inserts at start of group
  return { kind: 'prompt', targetGroupId, beforeItemId: firstItemId };
}
