import browser from 'webextension-polyfill';

import { StorageKeys } from '@/core/types/common';

import type { PromptGroup } from './groupTypes';
import { DEFAULT_GROUP_ICON_ID } from './groupIcons';

export interface PromptItemLike {
  id?: string;
  text?: string;
  tags?: string[];
  groupId?: string | null;
  name?: string;
  createdAt?: number;
  updatedAt?: number;
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
export function normalizePromptItem<T extends PromptItemLike>(item: T): Omit<T, 'tags'> & { groupId: string | null } {
  const { tags: _tags, ...rest } = item as T & { tags?: string[] };
  const groupId =
    item.groupId === undefined || item.groupId === null || item.groupId === ''
      ? null
      : String(item.groupId);
  return { ...rest, groupId } as Omit<T, 'tags'> & { groupId: string | null };
}

export function migrateItemsToGroups<T extends PromptItemLike>(items: T[]): Array<Omit<T, 'tags'> & { groupId: string | null }> {
  return items.map((it) => normalizePromptItem(it));
}

export function sortGroups(groups: PromptGroup[]): PromptGroup[] {
  return [...groups].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export function findGroupById(groups: PromptGroup[], id: string | null | undefined): PromptGroup | undefined {
  if (!id) return undefined;
  return groups.find((g) => g.id === id);
}

export function removeGroupFromRegistry(groups: PromptGroup[], groupId: string): PromptGroup[] {
  return groups.filter((g) => g.id !== groupId);
}

export function renameGroup(groups: PromptGroup[], groupId: string, name: string): PromptGroup[] | null {
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
): GroupSection[] {
  const sorted = sortGroups(groups);
  const sections: GroupSection[] = [];

  const ungrouped = items.filter((it) => !normalizePromptItem(it).groupId);
  const filteredUngrouped = ungrouped.filter((it) =>
    promptMatchesQuery(it, query, ungroupedLabel),
  );
  if (filteredUngrouped.length > 0) {
    sections.push({
      key: '__ungrouped__',
      groupId: null,
      name: ungroupedLabel,
      items: filteredUngrouped,
    });
  }

  for (const group of sorted) {
    const inGroup = items.filter((it) => normalizePromptItem(it).groupId === group.id);
    const filtered = inGroup.filter((it) => promptMatchesQuery(it, query, group.name));
    if (filtered.length > 0) {
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
