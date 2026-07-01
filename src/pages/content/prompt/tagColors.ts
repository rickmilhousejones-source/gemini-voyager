/**
 * Preset color palette for prompt tags (subset of folder colors).
 */
import { FOLDER_COLORS, getFolderColor, isDarkMode } from '../folder/folderColors';

export const PROMPT_TAG_COLOR_IDS = FOLDER_COLORS.map((c) => c.id);

export function getTagColor(colorId: string | undefined, dark = isDarkMode()): string {
  return getFolderColor(colorId, dark);
}

export { FOLDER_COLORS as PROMPT_TAG_COLORS };
