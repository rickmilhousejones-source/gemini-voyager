import type { PromptVariable } from './variableParser';

export interface VariableDialogLabels {
  title: string;
  confirm: string;
  cancel: string;
  fieldLabel: (name: string) => string;
}

export interface VariableDialogResult {
  confirmed: boolean;
  values: Record<string, string>;
}

/**
 * Body-appended popover to fill {{variable}} placeholders before insert.
 */
export function showVariableDialog(
  variables: PromptVariable[],
  labels: VariableDialogLabels,
  anchor?: HTMLElement,
): Promise<VariableDialogResult> {
  if (variables.length === 0) {
    return Promise.resolve({ confirmed: true, values: {} });
  }

  return new Promise((resolve) => {
    if (document.body.querySelector('.gv-pm-variable-dialog')) {
      resolve({ confirmed: false, values: {} });
      return;
    }

    const pop = document.createElement('div');
    pop.className = 'gv-pm-variable-dialog gv-pm-confirm';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-modal', 'true');

    const title = document.createElement('div');
    title.className = 'gv-pm-variable-dialog-title';
    title.textContent = labels.title;
    pop.appendChild(title);

    const fields: HTMLInputElement[] = [];
    for (const v of variables) {
      const row = document.createElement('label');
      row.className = 'gv-pm-variable-field';
      const lbl = document.createElement('span');
      lbl.textContent = labels.fieldLabel(v.name);
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'gv-pm-variable-input';
      input.value = v.defaultValue;
      input.dataset.varName = v.name;
      fields.push(input);
      row.appendChild(lbl);
      row.appendChild(input);
      pop.appendChild(row);
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
    pop.appendChild(actions);

    document.body.appendChild(pop);

    const position = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const pad = 8;
      if (anchor) {
        const r = anchor.getBoundingClientRect();
        const pw = pop.offsetWidth || 280;
        const left = Math.min(vw - pw - pad, Math.max(pad, r.left));
        const top = Math.max(pad, Math.min(vh - pop.offsetHeight - pad, r.bottom + 8));
        pop.style.left = `${Math.round(left)}px`;
        pop.style.top = `${Math.round(top)}px`;
      } else {
        pop.style.left = `${Math.round((vw - (pop.offsetWidth || 280)) / 2)}px`;
        pop.style.top = `${Math.round((vh - pop.offsetHeight) / 2)}px`;
      }
    };
    requestAnimationFrame(position);

    const finish = (confirmed: boolean) => {
      const values: Record<string, string> = {};
      if (confirmed) {
        for (const input of fields) {
          const name = input.dataset.varName;
          if (name) values[name] = input.value;
        }
      }
      cleanup();
      resolve({ confirmed, values });
    };

    const cleanup = () => {
      pop.remove();
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('click', onOutside, true);
    };

    const onOutside = (ev: MouseEvent) => {
      const t = ev.target as HTMLElement;
      if (!t.closest('.gv-pm-variable-dialog')) finish(false);
    };

    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        finish(false);
      }
      if (ev.key === 'Enter' && !(ev.target instanceof HTMLTextAreaElement)) {
        ev.preventDefault();
        finish(true);
      }
    };

    confirmBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      finish(true);
    });
    cancelBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      finish(false);
    });

    window.addEventListener('click', onOutside, true);
    window.addEventListener('keydown', onKey, true);
    fields[0]?.focus();
    fields[0]?.select();
  });
}
