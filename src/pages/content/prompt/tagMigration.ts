import type { PromptTag } from './tagTypes';
import {
  DEFAULT_TAG_COLOR_ID,
  DEFAULT_TAG_ICON_ID,
  displayTagName,
  normalizeTagName,
} from './tagTypes';
import { colorIdForHash, iconIdForHash } from './tagIcons';

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export interface PromptItemLike {
  tags?: string[];
}

/**
 * Collect unique normalized tag names from prompt items.
 */
export function collectTagNamesFromItems(items: PromptItemLike[]): string[] {
  const set = new Set<string>();
  for (const it of items) {
    for (const raw of it.tags ?? []) {
      const n = normalizeTagName(String(raw));
      if (n) set.add(n);
    }
  }
  return Array.from(set).sort();
}

/**
 * Ensure every tag name used by prompts has a PromptTag entity.
 * Returns updated registry (may equal input if nothing to add).
 */
export function migratePromptTags(
  items: PromptItemLike[],
  existing: PromptTag[] | null | undefined,
): { tags: PromptTag[]; changed: boolean } {
  const registry = Array.isArray(existing) ? [...existing] : [];
  const byNormalized = new Map<string, PromptTag>();
  for (const tag of registry) {
    if (tag && typeof tag.normalized === 'string') {
      byNormalized.set(tag.normalized, tag);
    }
  }

  let changed = registry.length !== (existing?.length ?? 0);
  const names = collectTagNamesFromItems(items);

  for (const normalized of names) {
    if (byNormalized.has(normalized)) continue;
    const display = displayTagName(normalized);
    const created: PromptTag = {
      id: uid(),
      name: display,
      normalized,
      colorId: colorIdForHash(normalized) || DEFAULT_TAG_COLOR_ID,
      iconId: iconIdForHash(normalized) || DEFAULT_TAG_ICON_ID,
      createdAt: Date.now(),
    };
    registry.push(created);
    byNormalized.set(normalized, created);
    changed = true;
  }

  registry.sort((a, b) => a.name.localeCompare(b.name));
  return { tags: registry, changed };
}

export function findTagByNormalized(tags: PromptTag[], normalized: string): PromptTag | undefined {
  return tags.find((t) => t.normalized === normalized);
}

export function findTagByName(tags: PromptTag[], rawName: string): PromptTag | undefined {
  return findTagByNormalized(tags, normalizeTagName(rawName));
}

export function createPromptTag(name: string, colorId: string, iconId: string): PromptTag {
  const normalized = normalizeTagName(name);
  const now = Date.now();
  return {
    id: uid(),
    name: displayTagName(name) || normalized,
    normalized,
    colorId,
    iconId,
    createdAt: now,
  };
}

export function updatePromptTag(
  tag: PromptTag,
  patch: Partial<Pick<PromptTag, 'name' | 'colorId' | 'iconId'>>,
): PromptTag {
  const next: PromptTag = { ...tag, updatedAt: Date.now() };
  if (patch.name !== undefined) {
    next.name = displayTagName(patch.name) || tag.name;
  }
  if (patch.colorId !== undefined) next.colorId = patch.colorId;
  if (patch.iconId !== undefined) next.iconId = patch.iconId;
  return next;
}

export function renamePromptTagRegistry(
  tags: PromptTag[],
  tagId: string,
  newName: string,
): { tags: PromptTag[]; oldNormalized: string; newNormalized: string } | null {
  const idx = tags.findIndex((t) => t.id === tagId);
  if (idx < 0) return null;
  const oldNormalized = tags[idx].normalized;
  const newNormalized = normalizeTagName(newName);
  if (!newNormalized) return null;
  if (tags.some((t) => t.id !== tagId && t.normalized === newNormalized)) return null;
  const updated = [...tags];
  updated[idx] = updatePromptTag(tags[idx], {
    name: newName,
  });
  updated[idx] = { ...updated[idx], normalized: newNormalized };
  return { tags: updated, oldNormalized, newNormalized };
}

export function deletePromptTagFromRegistry(tags: PromptTag[], tagId: string): PromptTag[] {
  return tags.filter((t) => t.id !== tagId);
}

export function syncTagNamesOnPrompts<T extends PromptItemLike>(
  items: T[],
  oldNormalized: string,
  newNormalized: string,
): T[] {
  return items.map((it) => ({
    ...it,
    tags: (it.tags ?? []).map((t) => (normalizeTagName(t) === oldNormalized ? newNormalized : t)),
  }));
}

export function removeTagFromPrompts<T extends PromptItemLike>(
  items: T[],
  normalized: string,
): T[] {
  return items.map((it) => ({
    ...it,
    tags: (it.tags ?? []).filter((t) => normalizeTagName(t) !== normalized),
  }));
}

export function ensureTagsForNewNames(
  registry: PromptTag[],
  rawNames: string[],
  defaults?: { colorId?: string; iconId?: string },
): { registry: PromptTag[]; changed: boolean } {
  let changed = false;
  const next = [...registry];
  const known = new Set(next.map((t) => t.normalized));
  for (const raw of rawNames) {
    const normalized = normalizeTagName(raw);
    if (!normalized || known.has(normalized)) continue;
    next.push(
      createPromptTag(
        raw,
        defaults?.colorId ?? colorIdForHash(normalized),
        defaults?.iconId ?? iconIdForHash(normalized),
      ),
    );
    known.add(normalized);
    changed = true;
  }
  return { registry: next, changed };
}
