import { getTagColor } from './tagColors';
import { PROMPT_TAG_COLORS } from './tagColors';
import { PROMPT_TAG_ICONS, createTagIconElement } from './tagIcons';
import { renderTagChip } from './tagChip';
import {
  createPromptTag,
  deletePromptTagFromRegistry,
  renamePromptTagRegistry,
  removeTagFromPrompts,
  updatePromptTag,
} from './tagMigration';
import { writePromptTags } from './tagChip';
import type { PromptTag } from './tagTypes';
import { normalizeTagName } from './tagTypes';
import { isDarkMode } from '../folder/folderColors';

export interface TagManagerLabels {
  title: string;
  newTag: string;
  save: string;
  cancel: string;
  delete: string;
  deleteConfirm: (name: string) => string;
  renamePlaceholder: string;
  colorSection: string;
  iconSection: string;
}

export interface TagManagerContext {
  labels: TagManagerLabels;
  translate: (key: string) => string;
  onTagsChanged: (tags: PromptTag[]) => void;
  onPromptsTagRemoved?: (normalized: string) => Promise<void>;
  onPromptsTagRenamed?: (oldNormalized: string, newNormalized: string) => Promise<void>;
  getPromptItems?: () => { tags?: string[] }[];
}

let activeDialog: HTMLElement | null = null;

export function closeTagManagerDialog(): void {
  activeDialog?.remove();
  activeDialog = null;
}

export function showTagManagerDialog(
  registry: PromptTag[],
  ctx: TagManagerContext,
): void {
  closeTagManagerDialog();

  const overlay = document.createElement('div');
  overlay.className = 'gv-pm-tag-manager-overlay';
  const dialog = document.createElement('div');
  dialog.className = 'gv-pm-tag-manager';
  dialog.setAttribute('role', 'dialog');
  activeDialog = overlay;

  const header = document.createElement('div');
  header.className = 'gv-pm-tag-manager-header';
  const title = document.createElement('h3');
  title.textContent = ctx.labels.title;
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'gv-pm-tag-manager-close';
  closeBtn.textContent = '×';
  closeBtn.setAttribute('aria-label', ctx.labels.cancel);
  header.appendChild(title);
  header.appendChild(closeBtn);
  dialog.appendChild(header);

  const list = document.createElement('div');
  list.className = 'gv-pm-tag-manager-list';

  let localTags = [...registry];

  const renderList = () => {
    list.innerHTML = '';
    for (const tag of localTags) {
      const row = document.createElement('div');
      row.className = 'gv-pm-tag-manager-row';

      row.appendChild(renderTagChip(tag, localTags, { variant: 'meta' }));

      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.className = 'gv-pm-tag-manager-name';
      nameInput.value = tag.name;
      nameInput.placeholder = ctx.labels.renamePlaceholder;

      const swatches = document.createElement('div');
      swatches.className = 'gv-pm-tag-manager-swatches';
      const dark = isDarkMode();
      for (const color of PROMPT_TAG_COLORS) {
        const sw = document.createElement('button');
        sw.type = 'button';
        sw.className = 'gv-pm-tag-manager-swatch';
        if (tag.colorId === color.id) sw.classList.add('active');
        sw.style.backgroundColor = getTagColor(color.id, dark);
        sw.title = ctx.translate(color.nameKey);
        sw.addEventListener('click', async () => {
          localTags = localTags.map((t) =>
            t.id === tag.id ? updatePromptTag(t, { colorId: color.id }) : t,
          );
          await writePromptTags(localTags);
          // #region agent log
          const updated = localTags.find((t) => t.id === tag.id);
          fetch('http://127.0.0.1:7723/ingest/d1e77644-14e4-4f23-9749-78488f439345',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'05d5a1'},body:JSON.stringify({sessionId:'05d5a1',location:'tagManagerDialog.ts:swatchClick',message:'tag color swatch clicked',data:{tagId:tag.id,tagName:tag.name,oldColorId:tag.colorId,newColorId:color.id,writtenColorId:updated?.colorId??null},timestamp:Date.now(),hypothesisId:'H2-color,H4-color'})}).catch(()=>{});
          // #endregion
          ctx.onTagsChanged(localTags);
          renderList();
        });
        swatches.appendChild(sw);
      }

      const icons = document.createElement('div');
      icons.className = 'gv-pm-tag-manager-icons';
      for (const icon of PROMPT_TAG_ICONS) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'gv-pm-tag-manager-icon-btn';
        if (tag.iconId === icon.id) btn.classList.add('active');
        btn.title = ctx.translate(icon.labelKey);
        btn.appendChild(createTagIconElement(icon.id, 'gv-pm-tag-icon'));
        btn.addEventListener('click', async () => {
          localTags = localTags.map((t) =>
            t.id === tag.id ? updatePromptTag(t, { iconId: icon.id }) : t,
          );
          await writePromptTags(localTags);
          ctx.onTagsChanged(localTags);
          renderList();
        });
        icons.appendChild(btn);
      }

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'gv-pm-tag-manager-delete';
      delBtn.textContent = ctx.labels.delete;
      delBtn.addEventListener('click', async () => {
        if (!window.confirm(ctx.labels.deleteConfirm(tag.name))) return;
        localTags = deletePromptTagFromRegistry(localTags, tag.id);
        await writePromptTags(localTags);
        await ctx.onPromptsTagRemoved?.(tag.normalized);
        ctx.onTagsChanged(localTags);
        renderList();
      });

      nameInput.addEventListener('change', async () => {
        const renamed = renamePromptTagRegistry(localTags, tag.id, nameInput.value);
        if (!renamed) return;
        localTags = renamed.tags;
        await writePromptTags(localTags);
        if (renamed.oldNormalized !== renamed.newNormalized) {
          await ctx.onPromptsTagRenamed?.(renamed.oldNormalized, renamed.newNormalized);
        }
        ctx.onTagsChanged(localTags);
        renderList();
      });

      row.appendChild(nameInput);
      row.appendChild(swatches);
      row.appendChild(icons);
      row.appendChild(delBtn);
      list.appendChild(row);
    }
  };

  renderList();
  dialog.appendChild(list);

  const footer = document.createElement('div');
  footer.className = 'gv-pm-tag-manager-footer';
  const newBtn = document.createElement('button');
  newBtn.type = 'button';
  newBtn.className = 'gv-pm-add';
  newBtn.textContent = ctx.labels.newTag;
  newBtn.addEventListener('click', async () => {
    const name = window.prompt(ctx.labels.renamePlaceholder);
    if (!name?.trim()) return;
    const normalized = normalizeTagName(name);
    if (localTags.some((t) => t.normalized === normalized)) return;
    localTags = [...localTags, createPromptTag(name, 'blue', 'label')].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    await writePromptTags(localTags);
    ctx.onTagsChanged(localTags);
    renderList();
  });
  footer.appendChild(newBtn);
  dialog.appendChild(footer);

  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  const close = () => {
    overlay.remove();
    activeDialog = null;
    window.removeEventListener('keydown', onKey);
  };

  const onKey = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') close();
  };

  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  window.addEventListener('keydown', onKey);
}
