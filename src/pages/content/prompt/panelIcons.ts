/** Gemini-style outlined icons for the prompt panel header controls. */

const SVG_ATTRS =
  'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';

export const PM_ICON_SUN = `<svg ${SVG_ATTRS} width="12" height="12"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>`;

export const PM_ICON_MOON = `<svg ${SVG_ATTRS} width="12" height="12"><path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5z"/></svg>`;

export const PM_ICON_LOCK = `<svg ${SVG_ATTRS} width="16" height="16"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`;

export const PM_ICON_LOCK_OPEN = `<svg ${SVG_ATTRS} width="16" height="16"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-1.5"/></svg>`;

export function setLockButtonIcon(button: HTMLElement, locked: boolean): void {
  let icon = button.querySelector('.gv-pm-lock-icon');
  if (!icon) {
    icon = document.createElement('span');
    icon.className = 'gv-pm-lock-icon';
    button.appendChild(icon);
  }
  icon.innerHTML = locked ? PM_ICON_LOCK : PM_ICON_LOCK_OPEN;
}

export function setThemeToggleIcon(button: HTMLElement, dark: boolean): void {
  let icon = button.querySelector('.gv-pm-theme-toggle-icon');
  if (!icon) {
    icon = document.createElement('span');
    icon.className = 'gv-pm-theme-toggle-icon';
    button.appendChild(icon);
  }
  icon.innerHTML = dark ? PM_ICON_MOON : PM_ICON_SUN;
}
