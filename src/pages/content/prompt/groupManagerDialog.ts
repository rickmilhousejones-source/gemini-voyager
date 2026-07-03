import {
  createPromptGroup,
  moveGroup,
  reindexGroupOrders,
  removeGroupFromRegistry,
  renameGroup,
  sortGroups,
  updateGroupIcon,
} from './groupMigration';
import {
  createGroupIconElement,
  PROMPT_GROUP_ICONS,
  resolveGroupIconId,
} from './groupIcons';
import { isGroupNameTaken, normalizeGroupName } from './groupTypes';
import { writePromptGroups } from './groupStorage';
import type { PromptGroup } from './groupTypes';

export interface GroupManagerLabels {
  title: string;
  newGroup: string;
  delete: string;
  deleteConfirm: (name: string) => string;
  renamePlaceholder: string;
  moveUp: string;
  moveDown: string;
  iconSection: string;
  close: string;
}

export interface GroupManagerContext {
  labels: GroupManagerLabels;
  translateIconLabel: (key: string) => string;
  onGroupsChanged: (groups: PromptGroup[]) => void;
  onGroupDeleted: (groupId: string) => Promise<void>;
}

let activeDialog: HTMLElement | null = null;

export function closeGroupManagerDialog(): void {
  activeDialog?.remove();
  activeDialog = null;
}

export function showGroupManagerDialog(registry: PromptGroup[], ctx: GroupManagerContext): void {
  closeGroupManagerDialog();

  const overlay = document.createElement('div');
  overlay.className = 'gv-pm-group-manager-overlay';
  const dialog = document.createElement('div');
  dialog.className = 'gv-pm-group-manager';
  dialog.setAttribute('role', 'dialog');
  activeDialog = overlay;

  const header = document.createElement('div');
  header.className = 'gv-pm-group-manager-header';
  const title = document.createElement('h3');
  title.textContent = ctx.labels.title;
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'gv-pm-group-manager-close';
  closeBtn.textContent = '×';
  closeBtn.setAttribute('aria-label', ctx.labels.close);
  header.appendChild(title);
  header.appendChild(closeBtn);
  dialog.appendChild(header);

  const list = document.createElement('div');
  list.className = 'gv-pm-group-manager-list';

  let localGroups = reindexGroupOrders([...registry]);
  let expandedIconGroupId: string | null = null;

  const renderList = () => {
    list.innerHTML = '';
    const sorted = sortGroups(localGroups);
    sorted.forEach((group, index) => {
      const block = document.createElement('div');
      block.className = 'gv-pm-group-manager-block';

      const row = document.createElement('div');
      row.className = 'gv-pm-group-manager-row';

      const iconBtn = document.createElement('button');
      iconBtn.type = 'button';
      iconBtn.className = 'gv-pm-group-manager-icon-btn';
      iconBtn.title = ctx.labels.iconSection;
      iconBtn.appendChild(
        createGroupIconElement(resolveGroupIconId(group), 'gv-pm-group-manager-icon-preview', 18),
      );
      iconBtn.addEventListener('click', () => {
        expandedIconGroupId = expandedIconGroupId === group.id ? null : group.id;
        renderList();
      });

      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.className = 'gv-pm-group-manager-name';
      nameInput.value = group.name;
      nameInput.placeholder = ctx.labels.renamePlaceholder;

      const moveUp = document.createElement('button');
      moveUp.type = 'button';
      moveUp.className = 'gv-pm-group-manager-move';
      moveUp.textContent = '↑';
      moveUp.title = ctx.labels.moveUp;
      moveUp.disabled = index === 0;

      const moveDown = document.createElement('button');
      moveDown.type = 'button';
      moveDown.className = 'gv-pm-group-manager-move';
      moveDown.textContent = '↓';
      moveDown.title = ctx.labels.moveDown;
      moveDown.disabled = index === sorted.length - 1;

      moveUp.addEventListener('click', async () => {
        localGroups = moveGroup(localGroups, group.id, -1);
        localGroups = reindexGroupOrders(localGroups);
        await writePromptGroups(localGroups);
        ctx.onGroupsChanged(localGroups);
        renderList();
      });

      moveDown.addEventListener('click', async () => {
        localGroups = moveGroup(localGroups, group.id, 1);
        localGroups = reindexGroupOrders(localGroups);
        await writePromptGroups(localGroups);
        ctx.onGroupsChanged(localGroups);
        renderList();
      });

      nameInput.addEventListener('change', async () => {
        const renamed = renameGroup(localGroups, group.id, nameInput.value);
        if (!renamed) {
          nameInput.value = group.name;
          return;
        }
        localGroups = renamed;
        await writePromptGroups(localGroups);
        ctx.onGroupsChanged(localGroups);
        renderList();
      });

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'gv-pm-group-manager-delete';
      delBtn.textContent = ctx.labels.delete;
      delBtn.addEventListener('click', async () => {
        if (!window.confirm(ctx.labels.deleteConfirm(group.name))) return;
        localGroups = removeGroupFromRegistry(localGroups, group.id);
        localGroups = reindexGroupOrders(localGroups);
        if (expandedIconGroupId === group.id) expandedIconGroupId = null;
        await writePromptGroups(localGroups);
        await ctx.onGroupDeleted(group.id);
        ctx.onGroupsChanged(localGroups);
        renderList();
      });

      const actions = document.createElement('div');
      actions.className = 'gv-pm-group-manager-actions';
      actions.appendChild(moveUp);
      actions.appendChild(moveDown);
      actions.appendChild(delBtn);

      row.appendChild(iconBtn);
      row.appendChild(nameInput);
      row.appendChild(actions);
      block.appendChild(row);

      if (expandedIconGroupId === group.id) {
        const iconPanel = document.createElement('div');
        iconPanel.className = 'gv-pm-group-manager-icons';
        const iconTitle = document.createElement('div');
        iconTitle.className = 'gv-pm-group-manager-icons-label';
        iconTitle.textContent = ctx.labels.iconSection;
        iconPanel.appendChild(iconTitle);

        const iconGrid = document.createElement('div');
        iconGrid.className = 'gv-pm-group-manager-icon-grid';
        for (const icon of PROMPT_GROUP_ICONS) {
          const pick = document.createElement('button');
          pick.type = 'button';
          pick.className = 'gv-pm-group-manager-icon-pick';
          if (resolveGroupIconId(group) === icon.id) pick.classList.add('active');
          pick.title = ctx.translateIconLabel(icon.labelKey);
          pick.appendChild(createGroupIconElement(icon.id, 'gv-pm-group-manager-icon-pick-svg', 16));
          pick.addEventListener('click', async () => {
            localGroups = updateGroupIcon(localGroups, group.id, icon.id);
            await writePromptGroups(localGroups);
            ctx.onGroupsChanged(localGroups);
            expandedIconGroupId = group.id;
            renderList();
          });
          iconGrid.appendChild(pick);
        }
        iconPanel.appendChild(iconGrid);
        block.appendChild(iconPanel);
      }

      list.appendChild(block);
    });
  };

  renderList();
  dialog.appendChild(list);

  const footer = document.createElement('div');
  footer.className = 'gv-pm-group-manager-footer';
  const newBtn = document.createElement('button');
  newBtn.type = 'button';
  newBtn.className = 'gv-pm-add';
  newBtn.textContent = ctx.labels.newGroup;
  newBtn.addEventListener('click', async () => {
    const name = window.prompt(ctx.labels.renamePlaceholder);
    if (!name?.trim()) return;
    if (isGroupNameTaken(localGroups, name)) return;
    const maxOrder = localGroups.reduce((m, g) => Math.max(m, g.order), -1);
    localGroups = [...localGroups, createPromptGroup(name, maxOrder + 10)];
    localGroups = reindexGroupOrders(localGroups);
    await writePromptGroups(localGroups);
    ctx.onGroupsChanged(localGroups);
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
