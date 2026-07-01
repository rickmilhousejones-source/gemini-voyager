import { getTagColor } from './tagColors';
import { PROMPT_TAG_COLORS } from './tagColors';
import { PROMPT_TAG_ICONS, createTagIconElement } from './tagIcons';
import { renderTagChip } from './tagChip';
import { updatePromptTag } from './tagMigration';
import { writePromptTags } from './tagChip';
import type { PromptTag } from './tagTypes';
import { isDarkMode } from '../folder/folderColors';

export interface TagQuickEditLabels {
  save: string;
  cancel: string;
  colorSection: string;
  iconSection: string;
}

export function showTagQuickEdit(
  tag: PromptTag,
  registry: PromptTag[],
  anchor: HTMLElement,
  labels: TagQuickEditLabels,
  translate: (key: string) => string,
  onSaved: (tags: PromptTag[]) => void,
): void {
  if (document.body.querySelector('.gv-pm-tag-quick-edit')) return;

  const pop = document.createElement('div');
  pop.className = 'gv-pm-tag-quick-edit gv-pm-confirm';

  pop.appendChild(renderTagChip(tag, registry, { variant: 'meta' }));

  const colorTitle = document.createElement('div');
  colorTitle.className = 'gv-pm-tag-quick-section';
  colorTitle.textContent = labels.colorSection;
  pop.appendChild(colorTitle);

  const swatches = document.createElement('div');
  swatches.className = 'gv-pm-tag-manager-swatches';
  const dark = isDarkMode();
  let colorId = tag.colorId;
  let iconId = tag.iconId;

  for (const color of PROMPT_TAG_COLORS) {
    const sw = document.createElement('button');
    sw.type = 'button';
    sw.className = 'gv-pm-tag-manager-swatch';
    if (colorId === color.id) sw.classList.add('active');
    sw.style.backgroundColor = getTagColor(color.id, dark);
    sw.title = translate(color.nameKey);
    sw.addEventListener('click', () => {
      colorId = color.id;
      swatches.querySelectorAll('.gv-pm-tag-manager-swatch').forEach((el) => el.classList.remove('active'));
      sw.classList.add('active');
    });
    swatches.appendChild(sw);
  }
  pop.appendChild(swatches);

  const iconTitle = document.createElement('div');
  iconTitle.className = 'gv-pm-tag-quick-section';
  iconTitle.textContent = labels.iconSection;
  pop.appendChild(iconTitle);

  const icons = document.createElement('div');
  icons.className = 'gv-pm-tag-manager-icons';
  for (const icon of PROMPT_TAG_ICONS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gv-pm-tag-manager-icon-btn';
    if (iconId === icon.id) btn.classList.add('active');
    btn.title = translate(icon.labelKey);
    btn.appendChild(createTagIconElement(icon.id, 'gv-pm-tag-icon'));
    btn.addEventListener('click', () => {
      iconId = icon.id;
      icons.querySelectorAll('.gv-pm-tag-manager-icon-btn').forEach((el) => el.classList.remove('active'));
      btn.classList.add('active');
    });
    icons.appendChild(btn);
  }
  pop.appendChild(icons);

  const actions = document.createElement('div');
  actions.className = 'gv-pm-variable-actions';
  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'gv-pm-save';
  saveBtn.textContent = labels.save;
  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.textContent = labels.cancel;
  actions.appendChild(saveBtn);
  actions.appendChild(cancelBtn);
  pop.appendChild(actions);

  document.body.appendChild(pop);

  const r = anchor.getBoundingClientRect();
  const vw = window.innerWidth;
  const left = Math.min(vw - pop.offsetWidth - 8, Math.max(8, r.left));
  pop.style.top = `${Math.round(r.bottom + 8 + window.scrollY)}px`;
  pop.style.left = `${Math.round(left + window.scrollX)}px`;

  const cleanup = () => {
    pop.remove();
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('click', onOutside, true);
  };

  saveBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const next = registry.map((t) =>
      t.id === tag.id ? updatePromptTag(t, { colorId, iconId }) : t,
    );
    await writePromptTags(next);
    onSaved(next);
    cleanup();
  });

  cancelBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    cleanup();
  });

  const onOutside = (ev: MouseEvent) => {
    if (!(ev.target as HTMLElement).closest('.gv-pm-tag-quick-edit')) cleanup();
  };
  const onKey = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') cleanup();
  };
  window.addEventListener('click', onOutside, true);
  window.addEventListener('keydown', onKey);
}
