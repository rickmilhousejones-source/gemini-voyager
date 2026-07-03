import { describe, expect, it } from 'vitest';

import {
  buildGroupSections,
  migrateItemsToGroups,
  normalizePromptItem,
  previewText,
  renameGroup,
  sortGroups,
  updateGroupIcon,
} from '../groupMigration';
import type { PromptGroup } from '../groupTypes';

describe('groupMigration', () => {
  it('strips legacy tags and sets groupId null', () => {
    const normalized = normalizePromptItem({ text: 'hi', tags: ['a', 'b'] });
    expect(normalized).toEqual({ text: 'hi', groupId: null });
    expect('tags' in normalized).toBe(false);
  });

  it('migrateItemsToGroups maps all items to null groupId when tags only', () => {
    const items = migrateItemsToGroups([
      { id: '1', text: 'A', tags: ['x'] },
      { id: '2', text: 'B', groupId: 'g1' },
    ]);
    expect(items[0].groupId).toBeNull();
    expect(items[1].groupId).toBe('g1');
  });

  it('buildGroupSections hides empty groups and puts ungrouped first', () => {
    const groups: PromptGroup[] = [
      { id: 'g1', name: 'Alpha', order: 10, createdAt: 1 },
      { id: 'g2', name: 'Empty', order: 20, createdAt: 1 },
    ];
    const items = [
      { id: '1', text: 'U', groupId: null },
      { id: '2', text: 'A', groupId: 'g1' },
    ];
    const sections = buildGroupSections(items, groups, '', 'Ungrouped');
    expect(sections.map((s) => s.name)).toEqual(['Ungrouped', 'Alpha']);
    expect(sections[0].items).toHaveLength(1);
    expect(sections[1].items).toHaveLength(1);
  });

  it('buildGroupSections filters by query including group name', () => {
    const groups: PromptGroup[] = [{ id: 'g1', name: 'Images', order: 0, createdAt: 1 }];
    const items = [
      { id: '1', text: 'fix photo', groupId: 'g1' },
      { id: '2', text: 'write code', groupId: null },
    ];
    const sections = buildGroupSections(items, groups, 'images', 'Ungrouped');
    expect(sections).toHaveLength(1);
    expect(sections[0].name).toBe('Images');
  });

  it('renameGroup rejects duplicate names', () => {
    const groups: PromptGroup[] = [
      { id: 'a', name: 'One', order: 0, createdAt: 1 },
      { id: 'b', name: 'Two', order: 1, createdAt: 1 },
    ];
    expect(renameGroup(groups, 'a', 'Two')).toBeNull();
    expect(renameGroup(groups, 'a', 'Renamed')?.find((g) => g.id === 'a')?.name).toBe('Renamed');
  });

  it('sortGroups orders by order field', () => {
    const sorted = sortGroups([
      { id: 'b', name: 'B', order: 20, createdAt: 1 },
      { id: 'a', name: 'A', order: 10, createdAt: 1 },
    ]);
    expect(sorted.map((g) => g.id)).toEqual(['a', 'b']);
  });

  it('updateGroupIcon sets iconId on target group', () => {
    const groups = [{ id: 'g1', name: 'A', order: 0, createdAt: 1 }];
    const next = updateGroupIcon(groups, 'g1', 'bolt');
    expect(next[0].iconId).toBe('bolt');
  });
});
