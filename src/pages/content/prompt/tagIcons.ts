/**
 * Preset Material-style outlined icons for prompt tags (inline SVG paths).
 */
import { PROMPT_TAG_COLOR_IDS } from './tagColors';

const PROMPT_TAG_COLOR_IDS_FROM_ICONS = PROMPT_TAG_COLOR_IDS.filter((id) => id !== 'default');

export interface TagIconConfig {
  id: string;
  /** i18n key for aria-label in tag manager. */
  labelKey: string;
  path: string;
}

/** viewBox 0 0 24 24, single path, fill black (tinted via CSS currentColor). */
export const PROMPT_TAG_ICONS: TagIconConfig[] = [
  {
    id: 'label',
    labelKey: 'pm_tag_icon_label',
    path: 'M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z',
  },
  {
    id: 'edit',
    labelKey: 'pm_tag_icon_edit',
    path: 'M3 17.46V21h3.54L17.81 9.73l-3.54-3.54L3 17.46ZM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z',
  },
  {
    id: 'image',
    labelKey: 'pm_tag_icon_image',
    path: 'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z',
  },
  {
    id: 'search',
    labelKey: 'pm_tag_icon_search',
    path: 'M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
  },
  {
    id: 'star',
    labelKey: 'pm_tag_icon_star',
    path: 'M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z',
  },
  {
    id: 'code',
    labelKey: 'pm_tag_icon_code',
    path: 'M9.4 16.6 4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0 4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z',
  },
  {
    id: 'translate',
    labelKey: 'pm_tag_icon_translate',
    path: 'M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0 0 14.07 6H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7 1.62-4.33L19.12 17h-3.24z',
  },
  {
    id: 'brush',
    labelKey: 'pm_tag_icon_brush',
    path: 'M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37-1.34-1.34a.996.996 0 0 0-1.41 0L9.12 5.88 11 7.76l6.24-6.24a.996.996 0 0 0 0-1.41z',
  },
  {
    id: 'folder',
    labelKey: 'pm_tag_icon_folder',
    path: 'M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z',
  },
  {
    id: 'bolt',
    labelKey: 'pm_tag_icon_bolt',
    path: 'M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C14.96 12.06 12.5 17.32 11 21z',
  },
  {
    id: 'article',
    labelKey: 'pm_tag_icon_article',
    path: 'M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
  },
  {
    id: 'camera',
    labelKey: 'pm_tag_icon_camera',
    path: 'M12 12m-3.2 0a3.2 3.2 0 1 0 6.4 0a3.2 3.2 0 1 0 -6.4 0M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z',
  },
  {
    id: 'palette',
    labelKey: 'pm_tag_icon_palette',
    path: 'M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z',
  },
  {
    id: 'psychology',
    labelKey: 'pm_tag_icon_psychology',
    path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
  },
  {
    id: 'work',
    labelKey: 'pm_tag_icon_work',
    path: 'M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z',
  },
];

export function getTagIconConfig(iconId: string): TagIconConfig | undefined {
  return PROMPT_TAG_ICONS.find((i) => i.id === iconId);
}

export function iconIdForHash(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % PROMPT_TAG_ICONS.length;
  return PROMPT_TAG_ICONS[idx]?.id ?? 'label';
}

export function colorIdForHash(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 17 + seed.charCodeAt(i)) | 0;
  }
  const ids = PROMPT_TAG_ICONS.length > 0 ? PROMPT_TAG_COLOR_IDS_FROM_ICONS : ['blue'];
  const idx = Math.abs(hash) % ids.length;
  return ids[idx] ?? 'blue';
}

export function createTagIconElement(iconId: string, className = 'gv-pm-tag-icon'): HTMLElement {
  const config = getTagIconConfig(iconId) ?? getTagIconConfig('label')!;
  const span = document.createElement('span');
  span.className = className;
  span.setAttribute('aria-hidden', 'true');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="${config.path}"/></svg>`;
  span.innerHTML = svg;
  return span;
}
