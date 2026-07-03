export interface ImportedPromptDraft {
  text: string;
  groupId: string | null;
  name?: string;
}

export type PromptImportParseResult =
  | { status: 'invalid' }
  | { status: 'empty' }
  | { status: 'ok'; items: ImportedPromptDraft[] };

const PROMPT_EXPORT_FORMATS = new Set([
  'gemini-voyager.prompts.v1',
  'gemini-voyager.prompts.v2',
]);

export function parsePromptImportPayload(payload: unknown): PromptImportParseResult {
  let sourceItems: unknown[] | null = null;

  if (Array.isArray(payload)) {
    sourceItems = payload;
  } else if (payload && typeof payload === 'object') {
    const candidate = payload as Record<string, unknown>;
    const format = candidate.format;
    if (
      format !== undefined &&
      typeof format === 'string' &&
      !PROMPT_EXPORT_FORMATS.has(format) &&
      !Array.isArray(candidate.items)
    ) {
      return { status: 'invalid' };
    }
    sourceItems = Array.isArray(candidate.items) ? candidate.items : [];
  } else {
    return { status: 'invalid' };
  }

  if (sourceItems.length === 0) {
    return { status: 'empty' };
  }

  const validItems: ImportedPromptDraft[] = [];
  const seenKeys = new Set<string>();

  for (const item of sourceItems) {
    const candidate = item as Record<string, unknown>;
    const text = String(candidate?.text ?? '').trim();
    if (!text) continue;

    const rawGroupId = candidate?.groupId;
    const groupId =
      rawGroupId === undefined || rawGroupId === null || rawGroupId === ''
        ? null
        : String(rawGroupId);
    const dedupeKey = `${text.toLowerCase()}|${groupId ?? ''}`;

    if (seenKeys.has(dedupeKey)) continue;
    seenKeys.add(dedupeKey);
    const rawName = typeof candidate?.name === 'string' ? candidate.name.trim() : '';
    const draft: ImportedPromptDraft = { text, groupId };
    if (rawName) draft.name = rawName;
    validItems.push(draft);
  }

  if (validItems.length === 0) {
    return { status: 'invalid' };
  }

  return {
    status: 'ok',
    items: validItems,
  };
}
