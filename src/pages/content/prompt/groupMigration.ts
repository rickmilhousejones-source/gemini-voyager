import browser from 'webextension-polyfill';

import { StorageKeys } from '@/core/types/common';

import type { PromptGroup } from './groupTypes';
import { UNGROUPED_SENTINEL } from './groupTypes';
import { DEFAULT_GROUP_ICON_ID } from './groupIcons';

export interface PromptItemLike {
  id?: string;
  text?: string;
  tags?: string[];
  groupId?: string | null;
  name?: string;
  createdAt?: number;
  updatedAt?: number;
  order?: number;
}

const MIGRATION_FLAG = 'gvPromptGroupsMigratedV1';

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createPromptGroup(name: string, order: number, iconId = DEFAULT_GROUP_ICON_ID): PromptGroup {
  const now = Date.now();
  return {
    id: uid(),
    name: name.trim(),
    order,
    iconId,
    createdAt: now,
  };
}

export function normalizePromptGroup(group: PromptGroup): PromptGroup {
  return {
    ...group,
    iconId: group.iconId?.trim() || DEFAULT_GROUP_ICON_ID,
  };
}

export function updateGroupIcon(groups: PromptGroup[], groupId: string, iconId: string): PromptGroup[] {
  const idx = groups.findIndex((g) => g.id === groupId);
  if (idx < 0) return groups;
  const next = [...groups];
  next[idx] = { ...next[idx], iconId, updatedAt: Date.now() };
  return next;
}

/** Strip legacy tags and ensure groupId field exists. */
export function normalizePromptItem<T extends PromptItemLike>(
  item: T,
): Omit<T, 'tags'> & { groupId: string | null } {
  const { tags: _tags, ...rest } = item as T & { tags?: string[] };
  const groupId =
    item.groupId === undefined || item.groupId === null || item.groupId === ''
      ? null
      : String(item.groupId);
  return { ...rest, groupId } as Omit<T, 'tags'> & { groupId: string | null };
}

export function migrateItemsToGroups<T extends PromptItemLike>(
  items: T[],
): Array<Omit<T, 'tags'> & { groupId: string | null }> {
  return items.map((it) => normalizePromptItem(it));
}

export function sortGroups(groups: PromptGroup[]): PromptGroup[] {
  return [...groups].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export function findGroupById(
  groups: PromptGroup[],
  id: string | null | undefined,
): PromptGroup | undefined {
  if (!id) return undefined;
  return groups.find((g) => g.id === id);
}

export function removeGroupFromRegistry(groups: PromptGroup[], groupId: string): PromptGroup[] {
  return groups.filter((g) => g.id !== groupId);
}

export function renameGroup(
  groups: PromptGroup[],
  groupId: string,
  name: string,
): PromptGroup[] | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const idx = groups.findIndex((g) => g.id === groupId);
  if (idx < 0) return null;
  if (groups.some((g) => g.id !== groupId && g.name.trim().toLowerCase() === trimmed.toLowerCase())) {
    return null;
  }
  const next = [...groups];
  next[idx] = { ...next[idx], name: trimmed, updatedAt: Date.now() };
  return next;
}

export function moveGroup(groups: PromptGroup[], groupId: string, delta: -1 | 1): PromptGroup[] {
  const sorted = sortGroups(groups);
  const idx = sorted.findIndex((g) => g.id === groupId);
  if (idx < 0) return groups;
  const swapIdx = idx + delta;
  if (swapIdx < 0 || swapIdx >= sorted.length) return groups;
  const a = sorted[idx];
  const b = sorted[swapIdx];
  const next = sorted.map((g) => {
    if (g.id === a.id) return { ...g, order: b.order, updatedAt: Date.now() };
    if (g.id === b.id) return { ...g, order: a.order, updatedAt: Date.now() };
    return g;
  });
  return next;
}

export function clearPromptsFromGroup<T extends PromptItemLike>(
  items: T[],
  groupId: string,
): Array<Omit<T, 'tags'> & { groupId: string | null }> {
  return items.map((it) => {
    const normalized = normalizePromptItem(it);
    if (normalized.groupId === groupId) {
      return { ...normalized, groupId: null };
    }
    return normalized;
  });
}

export function reindexGroupOrders(groups: PromptGroup[]): PromptGroup[] {
  return sortGroups(groups).map((g, i) => ({ ...g, order: i * 10 }));
}

function itemOrderValue(item: PromptItemLike): number | undefined {
  return typeof item.order === 'number' && Number.isFinite(item.order) ? item.order : undefined;
}

/** Assign `order` within each group from array appearance when any item lacks it. */
export function ensurePromptOrders<T extends PromptItemLike>(
  items: T[],
): Array<Omit<T, 'tags'> & { groupId: string | null; order: number }> {
  const normalized = items.map((it) => {
    const n = normalizePromptItem(it);
    return { ...n, order: itemOrderValue(it) };
  });
  const allHave = normalized.every((it) => typeof it.order === 'number');
  if (allHave) {
    return normalized as Array<Omit<T, 'tags'> & { groupId: string | null; order: number }>;
  }

  const counters = new Map<string, number>();
  return normalized.map((it) => {
    const key = it.groupId ?? '';
    const order = counters.get(key) ?? 0;
    counters.set(key, order + 10);
    return { ...it, order };
  }) as Array<Omit<T, 'tags'> & { groupId: string | null; order: number }>;
}

export function sortItemsByOrder<T extends PromptItemLike>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ao = itemOrderValue(a) ?? 0;
    const bo = itemOrderValue(b) ?? 0;
    if (ao !== bo) return ao - bo;
    return String(a.id ?? '').localeCompare(String(b.id ?? ''));
  });
}

/** Next order value at the bottom of a group (or ungrouped). */
export function nextOrderInGroup(items: PromptItemLike[], groupId: string | null): number {
  let max = -10;
  for (const it of items) {
    const n = normalizePromptItem(it);
    if (n.groupId !== groupId) continue;
    const o = itemOrderValue(it);
    if (typeof o === 'number' && o > max) max = o;
  }
  return max + 10;
}

/**
 * Normalize section order to include ungrouped + every known group id.
 * Missing keys are appended (ungrouped first by default when order is empty).
 */
export function normalizeSectionOrder(
  groups: PromptGroup[],
  sectionOrder?: string[] | null,
): string[] {
  const groupIds = new Set(groups.map((g) => g.id));
  const defaultOrder = [UNGROUPED_SENTINEL, ...sortGroups(groups).map((g) => g.id)];
  if (!sectionOrder || !Array.isArray(sectionOrder) || sectionOrder.length === 0) {
    return defaultOrder;
  }

  const seen = new Set<string>();
  const result: string[] = [];
  for (const key of sectionOrder) {
    if (typeof key !== 'string') continue;
    if (key === UNGROUPED_SENTINEL) {
      if (!seen.has(key)) {
        result.push(key);
        seen.add(key);
      }
      continue;
    }
    if (groupIds.has(key) && !seen.has(key)) {
      result.push(key);
      seen.add(key);
    }
  }
  if (!seen.has(UNGROUPED_SENTINEL)) {
    result.unshift(UNGROUPED_SENTINEL);
    seen.add(UNGROUPED_SENTINEL);
  }
  for (const g of sortGroups(groups)) {
    if (!seen.has(g.id)) result.push(g.id);
  }
  return result;
}

/** Move a section key before/after another key. */
export function reorderSectionOrder(
  sectionOrder: string[],
  fromKey: string,
  toKey: string,
  place: 'before' | 'after',
): string[] {
  if (fromKey === toKey) return sectionOrder;
  const next = [...sectionOrder];
  const fromIdx = next.indexOf(fromKey);
  if (fromIdx < 0) return sectionOrder;
  next.splice(fromIdx, 1);
  let toIdx = next.indexOf(toKey);
  if (toIdx < 0) return sectionOrder;
  if (place === 'after') toIdx += 1;
  next.splice(toIdx, 0, fromKey);
  return next;
}

/** Keep PromptGroup.order aligned with section order (skipping ungrouped). */
export function syncGroupOrdersFromSectionOrder(
  groups: PromptGroup[],
  sectionOrder: string[],
): PromptGroup[] {
  let i = 0;
  const orderMap = new Map<string, number>();
  for (const key of sectionOrder) {
    if (key === UNGROUPED_SENTINEL) continue;
    orderMap.set(key, i * 10);
    i += 1;
  }
  return groups.map((g) => {
    if (!orderMap.has(g.id)) return g;
    return { ...g, order: orderMap.get(g.id)!, updatedAt: Date.now() };
  });
}

/**
 * Move a prompt within/across groups.
 * `beforeItemId` null = append to end of target group.
 */
export function applyPromptReorder<T extends PromptItemLike & { id: string }>(
  items: T[],
  movedId: string,
  targetGroupId: string | null,
  beforeItemId: string | null,
): Array<Omit<T, 'tags'> & { groupId: string | null; order: number; id: string }> {
  const ensured = ensurePromptOrders(items);
  const moved = ensured.find((it) => it.id === movedId);
  if (!moved) {
    return ensured as Array<Omit<T, 'tags'> & { groupId: string | null; order: number; id: string }>;
  }

  const sourceGroupId = moved.groupId;
  const without = ensured.filter((it) => it.id !== movedId);
  const targetSorted = sortItemsByOrder(without.filter((it) => it.groupId === targetGroupId));

  let insertAt = targetSorted.length;
  if (beforeItemId) {
    const idx = targetSorted.findIndex((it) => it.id === beforeItemId);
    if (idx >= 0) insertAt = idx;
  }

  const newTarget = [...targetSorted];
  newTarget.splice(insertAt, 0, { ...moved, groupId: targetGroupId });

  const updates = new Map<string, { groupId: string | null; order: number }>();
  newTarget.forEach((it, i) => {
    updates.set(it.id, { groupId: targetGroupId, order: i * 10 });
  });

  if (sourceGroupId !== targetGroupId) {
    sortItemsByOrder(without.filter((it) => it.groupId === sourceGroupId)).forEach((it, i) => {
      updates.set(it.id, { groupId: sourceGroupId, order: i * 10 });
    });
  }

  const now = Date.now();
  return ensured.map((it) => {
    const upd = updates.get(it.id);
    if (!upd) return it;
    return { ...it, groupId: upd.groupId, order: upd.order, updatedAt: now };
  }) as Array<Omit<T, 'tags'> & { groupId: string | null; order: number; id: string }>;
}

/** One-time migration: drop tags, null groupId, optional cleanup of legacy keys. */
export async function runPromptGroupsMigrationIfNeeded(
  items: PromptItemLike[],
): Promise<{ items: Array<PromptItemLike & { groupId: string | null }>; migrated: boolean }> {
  try {
    const flagResult = await browser.storage.local.get(MIGRATION_FLAG);
    if (flagResult[MIGRATION_FLAG] === true) {
      return { items: migrateItemsToGroups(items), migrated: false };
    }

    const migratedItems = migrateItemsToGroups(items);
    await browser.storage.local.set({
      [StorageKeys.PROMPT_ITEMS]: migratedItems,
      [MIGRATION_FLAG]: true,
    });
    try {
      await browser.storage.local.remove([
        StorageKeys.PROMPT_TAGS,
        StorageKeys.PROMPT_SELECTED_TAGS,
      ]);
    } catch {
      /* ignore */
    }
    return { items: migratedItems, migrated: true };
  } catch {
    return { items: migrateItemsToGroups(items), migrated: false };
  }
}

export interface GroupSection {
  key: string;
  groupId: string | null;
  name: string;
  items: PromptItemLike[];
}

export interface BuildGroupSectionsOptions {
  sectionOrder?: string[] | null;
  /** When true, include empty sections (for drag drop targets). Ignored while searching. */
  includeEmpty?: boolean;
}

export function promptMatchesQuery(
  item: PromptItemLike,
  query: string,
  groupName?: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const title = (item.name && item.name.trim()) || '';
  const text = String(item.text ?? '');
  return (
    text.toLowerCase().includes(q) ||
    title.toLowerCase().includes(q) ||
    (groupName ? groupName.toLowerCase().includes(q) : false)
  );
}

export function buildGroupSections(
  items: PromptItemLike[],
  groups: PromptGroup[],
  query: string,
  ungroupedLabel: string,
  options?: BuildGroupSectionsOptions,
): GroupSection[] {
  const q = query.trim();
  const includeEmpty = Boolean(options?.includeEmpty) && !q;
  const sectionOrder = normalizeSectionOrder(groups, options?.sectionOrder);
  const orderedItems = ensurePromptOrders(items);
  const groupById = new Map(groups.map((g) => [g.id, g]));
  const sections: GroupSection[] = [];

  for (const key of sectionOrder) {
    if (key === UNGROUPED_SENTINEL) {
      const ungrouped = sortItemsByOrder(orderedItems.filter((it) => !it.groupId));
      const filtered = ungrouped.filter((it) => promptMatchesQuery(it, q, ungroupedLabel));
      if (filtered.length > 0 || includeEmpty) {
        sections.push({
          key: UNGROUPED_SENTINEL,
          groupId: null,
          name: ungroupedLabel,
          items: filtered,
        });
      }
      continue;
    }

    const group = groupById.get(key);
    if (!group) continue;
    const inGroup = sortItemsByOrder(orderedItems.filter((it) => it.groupId === group.id));
    const filtered = inGroup.filter((it) => promptMatchesQuery(it, q, group.name));
    if (filtered.length > 0 || includeEmpty) {
      sections.push({
        key: group.id,
        groupId: group.id,
        name: group.name,
        items: filtered,
      });
    }
  }

  return sections;
}

/** Groups with zero prompts — shown only in group manager. */
export function listAllGroupsForManager(groups: PromptGroup[]): PromptGroup[] {
  return sortGroups(groups);
}

export function previewText(text: string, maxLen = 80): string {
  const plain = text.replace(/\s+/g, ' ').trim();
  if (plain.length <= maxLen) return plain;
  return `${plain.slice(0, maxLen)}…`;
}
