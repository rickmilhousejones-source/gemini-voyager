import browser from 'webextension-polyfill';

import { StorageKeys } from '@/core/types/common';

import type { PromptGroup } from './groupTypes';
import { normalizePromptGroup } from './groupMigration';

export async function readPromptGroups(): Promise<PromptGroup[]> {
  try {
    const result = await browser.storage.local.get({ [StorageKeys.PROMPT_GROUPS]: [] });
    const raw = result[StorageKeys.PROMPT_GROUPS];
    if (!Array.isArray(raw)) return [];
    return (raw as PromptGroup[])
      .filter((g) => g && typeof g.id === 'string' && typeof g.name === 'string')
      .map((g) => normalizePromptGroup(g));
  } catch {
    return [];
  }
}

export async function writePromptGroups(groups: PromptGroup[]): Promise<void> {
  await browser.storage.local.set({ [StorageKeys.PROMPT_GROUPS]: groups });
}

export async function readCollapsedGroupIds(): Promise<Set<string>> {
  try {
    const result = await browser.storage.local.get({ [StorageKeys.PROMPT_COLLAPSED_GROUPS]: [] });
    const raw = result[StorageKeys.PROMPT_COLLAPSED_GROUPS];
    if (!Array.isArray(raw)) return new Set();
    return new Set(raw.filter((id): id is string => typeof id === 'string'));
  } catch {
    return new Set();
  }
}

export async function writeCollapsedGroupIds(ids: Set<string>): Promise<void> {
  await browser.storage.local.set({
    [StorageKeys.PROMPT_COLLAPSED_GROUPS]: Array.from(ids),
  });
}
