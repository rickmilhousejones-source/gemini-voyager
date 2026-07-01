/** Gemini-style outlined prompt icon for the floating trigger (SVG). */
export const PROMPT_TRIGGER_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/></svg>`;

export function mountPromptTriggerIcon(container: HTMLElement): void {
  container.innerHTML = PROMPT_TRIGGER_ICON_SVG;
  container.classList.add('gv-pm-trigger-icon');
}
