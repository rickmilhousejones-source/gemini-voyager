import { activatePromptText } from './promptClickAction';
import { hasPromptVariables, parsePromptVariables, resolvePromptVariables } from './variableParser';
import { showVariableDialog, type VariableDialogLabels } from './variableDialog';

export type PromptActivationResult = 'inserted' | 'copied' | 'cancelled';

export interface PromptActivationOptions {
  text: string;
  insertOnClickEnabled: boolean;
  variableLabels?: VariableDialogLabels;
  anchor?: HTMLElement;
  copyText: (text: string) => Promise<void>;
  expandInputCollapseIfNeeded: () => void;
  insertTextIntoChatInput: (text: string) => boolean;
}

const DEFAULT_VARIABLE_LABELS: VariableDialogLabels = {
  title: 'Fill variables',
  confirm: 'Insert',
  cancel: 'Cancel',
  fieldLabel: (name) => name,
};

/**
 * Resolve {{variables}} via dialog when needed, then insert or copy.
 */
export async function resolveAndActivatePrompt(
  options: PromptActivationOptions,
): Promise<PromptActivationResult> {
  let text = options.text;

  if (hasPromptVariables(text)) {
    const variables = parsePromptVariables(text);
    const labels = options.variableLabels ?? DEFAULT_VARIABLE_LABELS;
    const { confirmed, values } = await showVariableDialog(
      variables,
      labels,
      options.anchor,
    );
    if (!confirmed) return 'cancelled';
    text = resolvePromptVariables(text, values, variables);
  }

  const result = await activatePromptText(text, options.insertOnClickEnabled, {
    copyText: options.copyText,
    expandInputCollapseIfNeeded: options.expandInputCollapseIfNeeded,
    insertTextIntoChatInput: options.insertTextIntoChatInput,
  });

  return result;
}

export { parsePromptVariables, resolvePromptVariables, hasPromptVariables };
