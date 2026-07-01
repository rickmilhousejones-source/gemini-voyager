import { describe, expect, it } from 'vitest';

import {
  collectTagNamesFromItems,
  migratePromptTags,
  renamePromptTagRegistry,
  syncTagNamesOnPrompts,
} from '../tagMigration';

describe('tagMigration', () => {
  it('collects unique normalized tag names', () => {
    expect(
      collectTagNamesFromItems([
        { tags: ['精修', 'edit'] },
        { tags: ['Edit', 'photo'] },
      ]),
    ).toEqual(['edit', 'photo', '精修']);
  });

  it('creates tag entities for missing names', () => {
    const { tags, changed } = migratePromptTags([{ tags: ['alpha', 'beta'] }], []);
    expect(changed).toBe(true);
    expect(tags).toHaveLength(2);
    expect(tags.map((t) => t.normalized).sort()).toEqual(['alpha', 'beta']);
    expect(tags[0].iconId).toBeTruthy();
    expect(tags[0].colorId).toBeTruthy();
  });

  it('does not duplicate existing tags', () => {
    const existing = migratePromptTags([{ tags: ['alpha'] }], []).tags;
    const { tags, changed } = migratePromptTags([{ tags: ['alpha', 'beta'] }], existing);
    expect(changed).toBe(true);
    expect(tags).toHaveLength(2);
  });

  it('renames tag registry and syncs prompt tag strings', () => {
    const { tags } = migratePromptTags([{ tags: ['oldname'] }], []);
    const tag = tags[0];
    const renamed = renamePromptTagRegistry(tags, tag.id, 'New Name');
    expect(renamed?.newNormalized).toBe('new name');
    const items = syncTagNamesOnPrompts([{ tags: ['oldname'] }], 'oldname', 'new name');
    expect(items[0].tags).toEqual(['new name']);
  });
});
