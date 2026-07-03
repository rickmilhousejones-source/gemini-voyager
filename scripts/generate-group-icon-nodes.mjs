import { readFileSync, writeFileSync } from 'node:fs';

const paths = JSON.parse(readFileSync('scripts/lucide-paths.json', 'utf8'));
const source = readFileSync('src/pages/content/prompt/groupIcons.ts', 'utf8');

const labelKeyById = {};
for (const match of source.matchAll(/id: '([^']+)',\s*\n\s*labelKey: '([^']+)'/g)) {
  labelKeyById[match[1]] = match[2];
}

function stripAttrs(attrs) {
  const out = {};
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'key') continue;
    out[k] = v;
  }
  return out;
}

const iconIds = Object.keys(labelKeyById);
const entries = iconIds.map((id) => {
  const nodes = paths[id];
  if (!nodes) throw new Error(`MissingPayload missing lucide nodes for icon id: ${id}`);
  const cleaned = nodes.map(({ tag, attrs }) => ({ tag, attrs: stripAttrs(attrs) }));
  return `  {
    id: '${id}',
    labelKey: '${labelKeyById[id]}',
    nodes: ${JSON.stringify(cleaned, null, 6).replace(/\n/g, '\n    ')},
  }`;
});

const header = `/** Preset gray SVG icons for prompt groups (Lucide stroke paths). */

export interface GroupIconNode {
  tag: 'path' | 'circle' | 'rect' | 'line' | 'polyline' | 'polygon';
  attrs: Record<string, string>;
}

export interface GroupIconConfig {
  id: string;
  /** i18n key for aria-label in group manager. */
  labelKey: string;
  nodes: GroupIconNode[];
}

export const DEFAULT_GROUP_ICON_ID = 'folder';
export const UNGROUPED_GROUP_ICON_ID = 'inbox';

/** viewBox 0 0 24 24 — tinted via CSS currentColor. */
export const PROMPT_GROUP_ICONS: GroupIconConfig[] = [
`;

const footer = `];

export function getGroupIconConfig(iconId: string | undefined | null): GroupIconConfig {
  const id = iconId?.trim() || DEFAULT_GROUP_ICON_ID;
  return PROMPT_GROUP_ICONS.find((i) => i.id === id) ?? PROMPT_GROUP_ICONS[0]!;
}

export function resolveGroupIconId(group: { iconId?: string | null } | null | undefined): string {
  if (!group) return UNGROUPED_GROUP_ICON_ID;
  return group.iconId?.trim() || DEFAULT_GROUP_ICON_ID;
}

function renderIconNode({ tag, attrs }: GroupIconNode): string {
  const parts = Object.entries(attrs)
    .map(([k, v]) => \`\${k}="\${String(v).replace(/"/g, '&quot;')}"\`)
    .join(' ');
  return \`<\${tag} \${parts}/>\`;
}

export function createGroupIconElement(
  iconId: string,
  className = 'gv-pm-group-icon',
  size = 16,
): HTMLElement {
  const config = getGroupIconConfig(iconId);
  const body = config.nodes.map(renderIconNode).join('');
  const span = document.createElement('span');
  span.className = className;
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="\${size}" height="\${size}" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">\${body}</svg>\`;
  return span;
}
`;

writeFileSync('src/pages/content/prompt/groupIcons.ts', header + entries.join(',\n') + footer);
console.log('generated', iconIds.length, 'icons');
