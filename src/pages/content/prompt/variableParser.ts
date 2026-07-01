export interface PromptVariable {
  name: string;
  defaultValue: string;
}

const VARIABLE_PATTERN = /\{\{([a-zA-Z_][\w]*)(?::([^}]*))?\}\}/g;

/**
 * Parse {{name}} and {{name:default}} placeholders from prompt text.
 */
export function parsePromptVariables(text: string): PromptVariable[] {
  const seen = new Set<string>();
  const out: PromptVariable[] = [];
  VARIABLE_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = VARIABLE_PATTERN.exec(text)) !== null) {
    const name = match[1];
    if (!name || seen.has(name)) continue;
    seen.add(name);
    out.push({
      name,
      defaultValue: match[2] ?? '',
    });
  }
  return out;
}

export function hasPromptVariables(text: string): boolean {
  VARIABLE_PATTERN.lastIndex = 0;
  return VARIABLE_PATTERN.test(text);
}

/**
 * Replace variables with user-provided values. Missing keys use defaults from template.
 */
export function resolvePromptVariables(
  text: string,
  values: Record<string, string>,
  variables?: PromptVariable[],
): string {
  const defs = variables ?? parsePromptVariables(text);
  const defaultMap = new Map(defs.map((v) => [v.name, v.defaultValue]));
  return text.replace(VARIABLE_PATTERN, (_full, name: string, def?: string) => {
    if (values[name] !== undefined) return values[name];
    if (def !== undefined) return def;
    return defaultMap.get(name) ?? '';
  });
}

export { VARIABLE_PATTERN };
