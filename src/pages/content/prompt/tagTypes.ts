/**
 * Prompt tag entity types — tags are first-class objects with icon + color.
 * PromptItem.tags remains string[] of normalized names for backward compatibility.
 */

export interface PromptTag {
  id: string;
  /** Display name (trimmed, case preserved). */
  name: string;
  /** Lowercase key matching PromptItem.tags entries. */
  normalized: string;
  /** Preset color id (see tagColors.ts). */
  colorId: string;
  /** Preset icon id (see tagIcons.ts). */
  iconId: string;
  createdAt: number;
  updatedAt?: number;
}

export const DEFAULT_TAG_COLOR_ID = 'blue';
export const DEFAULT_TAG_ICON_ID = 'label';

export function normalizeTagName(raw: string): string {
  return raw.trim().toLowerCase();
}

export function displayTagName(raw: string): string {
  return raw.trim();
}
