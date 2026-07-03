/** Prompt group registry entry (replaces tag registry). */
export interface PromptGroup {
  id: string;
  name: string;
  order: number;
  iconId?: string;
  createdAt: number;
  updatedAt?: number;
}

/** Sentinel for collapsed-state storage (virtual ungrouped bucket). */
export const UNGROUPED_SENTINEL = '__ungrouped__';

export function normalizeGroupName(name: string): string {
  return name.trim();
}

export function isGroupNameTaken(groups: PromptGroup[], name: string, exceptId?: string): boolean {
  const n = normalizeGroupName(name).toLowerCase();
  if (!n) return true;
  return groups.some((g) => g.id !== exceptId && g.name.trim().toLowerCase() === n);
}
