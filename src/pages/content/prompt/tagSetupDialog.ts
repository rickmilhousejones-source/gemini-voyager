import { PROMPT_TAG_COLORS, getTagColor } from './tagColors';
import { PROMPT_TAG_ICONS, createTagIconElement, iconIdForHash, colorIdForHash } from './tagIcons';
import { createPromptTag } from './tagMigration';
import type { PromptTag } from './tagTypes';
import { normalizeTagName } from './tagTypes';
import { isDarkMode } from '../folder/folderColors';

export interface TagSetupLabels {
  title: string;
  confirm: string;
  cancel: string;
  colorSection: string;
  iconSection: string;
}

/**
 * Prompt user to pick icon/color for newly typed tag names before first save.
 */
export function showTagSetupDialog(
  rawNames: string[],
  labels: TagSetupLabels,
  translate: (key: string) => string,
): Promise<PromptTag[] | null> {
  const names = rawNames
    .map((n) => n.trim())
    .filter((n) => n.length > 0);
  if (names.length === 0) return Promise.resolve([]);

  return new Promise((resolve) => {
    if (document.body.querySelector('.gv-pm-tag-setup')) {
      resolve(null);
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'gv-pm-tag-manager-overlay';
    const dialog = document.createElement('div');
    dialog.className = 'gv-pm-tag-manager gv-pm-tag-setup';

    const title = document.createElement('h3');
    title.textContent = labels.title;
    dialog.appendChild(title);

    const configs = names.map((name) => {
      const normalized = normalizeTagName(name);
      return {
        name,
        colorId: colorIdForHash(normalized),
        iconId: iconIdForHash(normalized),
      };
    });

    for (const cfg of configs) {
      const row = document.createElement('div');
      row.className = 'gv-pm-tag-setup-row';
      const label = document.createElement('div');
      label.className = 'gv-pm-tag-setup-name';
      label.textContent = cfg.name;
      row.appendChild(label);

      const swatches = document.createElement('div');
      swatches.className = 'gv-pm-tag-manager-swatches';
      const dark = isDarkMode();
      for (const color of PROMPT_TAG_COLORS) {
        const sw = document.createElement('button');
        sw.type = 'button';
        sw.className = 'gv-pm-tag-manager-swatch';
        if (cfg.colorId === color.id) sw.classList.add('active');
        sw.style.backgroundColor = getTagColor(color.id, dark);
        sw.title = translate(color.nameKey);
        sw.addEventListener('click', () => {
          cfg.colorId = color.id;
          swatches.querySelectorAll('.gv-pm-tag-manager-swatch').forEach((el) => el.classList.remove('active'));
          sw.classList.add('active');
        });
        swatches.appendChild(sw);
      }
      row.appendChild(swatches);

      const icons = document.createElement('div');
      icons.className = 'gv-pm-tag-manager-icons';
      for (const icon of PROMPT_TAG_ICONS) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'gv-pm-tag-manager-icon-btn';
        if (cfg.iconId === icon.id) btn.classList.add('active');
        btn.title = translate(icon.labelKey);
        btn.appendChild(createTagIconElement(icon.id, 'gv-pm-tag-icon'));
        btn.addEventListener('click', () => {
          cfg.iconId = icon.id;
          icons.querySelectorAll('.gv-pm-tag-manager-icon-btn').forEach((el) => el.classList.remove('active'));
          btn.classList.add('active');
        });
        icons.appendChild(btn);
      }
      row.appendChild(icons);
      dialog.appendChild(row);
    }

    const actions = document.createElement('div');
    actions.className = 'gv-pm-variable-actions';
    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = 'gv-pm-save';
    confirmBtn.textContent = labels.confirm;
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = labels.cancel;
    actions.appendChild(confirmBtn);
    actions.appendChild(cancelBtn);
    dialog.appendChild(actions);

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const finish = (confirmed: boolean) => {
      overlay.remove();
      window.removeEventListener('keydown', onKey);
      if (!confirmed) {
        resolve(null);
        return;
      }
      resolve(configs.map((c) => createPromptTag(c.name, c.colorId, c.iconId)));
    };

    confirmBtn.addEventListener('click', () => finish(true));
    cancelBtn.addEventListener('click', () => finish(false));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) finish(false);
    });
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') finish(false);
    };
    window.addEventListener('keydown', onKey);
  });
}
