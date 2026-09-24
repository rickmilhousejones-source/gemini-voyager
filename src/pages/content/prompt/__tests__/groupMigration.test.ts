import { describe, expect, it } from 'vitest';

import {
  applyPromptReorder,
  buildGroupSections,
  ensurePromptOrders,
  migrateItemsToGroups,
  nextOrderInGroup,
  normalizePromptItem,
  normalizeSectionOrder,
  previewText,
  renameGroup,
  reorderSectionOrder,
  sortGroups,
  syncGroupOrdersFromSectionOrder,
  updateGroupIcon,
} from '../groupMigration';
import type { PromptGroup } from '../groupTypes';
import { UNGROUPED_SENTINEL } from '../groupTypes';

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

  it('buildGroupSections hides empty groups and puts ungrouped first by default', () => {
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

  it('buildGroupSections respects custom sectionOrder including ungrouped in the middle', () => {
    const groups: PromptGroup[] = [
      { id: 'g1', name: 'Alpha', order: 10, createdAt: 1 },
      { id: 'g2', name: 'Beta', order: 20, createdAt: 1 },
    ];
    const items = [
      { id: '1', text: 'U', groupId: null },
      { id: '2', text: 'A', groupId: 'g1' },
      { id: '3', text: 'B', groupId: 'g2' },
    ];
    const sections = buildGroupSections(items, groups, '', 'Ungrouped', {
      sectionOrder: ['g1', UNGROUPED_SENTINEL, 'g2'],
    });
    expect(sections.map((s) => s.key)).toEqual(['g1', UNGROUPED_SENTINEL, 'g2']);
  });

  it('buildGroupSections includeEmpty shows empty groups when not searching', () => {
    const groups: PromptGroup[] = [
      { id: 'g1', name: 'Alpha', order: 10, createdAt: 1 },
      { id: 'g2', name: 'Empty', order: 20, createdAt: 1 },
    ];
    const items = [{ id: '2', text: 'A', groupId: 'g1' }];
    const sections = buildGroupSections(items, groups, '', 'Ungrouped', {
      includeEmpty: true,
    });
    expect(sections.map((s) => s.key)).toEqual([UNGROUPED_SENTINEL, 'g1', 'g2']);
    expect(sections.find((s) => s.key === 'g2')?.items).toHaveLength(0);
  });

  it('buildGroupSections sorts items by order within a group', () => {
    const groups: PromptGroup[] = [{ id: 'g1', name: 'Alpha', order: 0, createdAt: 1 }];
    const items = [
      { id: 'a', text: 'second', groupId: 'g1', order: 20 },
      { id: 'b', text: 'first', groupId: 'g1', order: 10 },
    ];
    const sections = buildGroupSections(items, groups, '', 'Ungrouped');
    expect(sections[0].items.map((it) => it.id)).toEqual(['b', 'a']);
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

  it('ensurePromptOrders assigns missing orders from array appearance', () => {
    const items = ensurePromptOrders([
      { id: '1', text: 'A', groupId: 'g1' },
      { id: '2', text: 'B', groupId: 'g1' },
      { id: '3', text: 'U', groupId: null },
    ]);
    expect(items.map((it) => ({ id: it.id, order: it.order }))).toEqual([
      { id: '1', order: 0 },
      { id: '2', order: 10 },
      { id: '3', order: 0 },
    ]);
  });

  it('nextOrderInGroup returns max+10', () => {
    expect(
      nextOrderInGroup(
        [
          { id: '1', text: 'A', groupId: 'g1', order: 0 },
          { id: '2', text: 'B', groupId: 'g1', order: 20 },
        ],
        'g1',
      ),
    ).toBe(30);
    expect(nextOrderInGroup([], null)).toBe(0);
  });

  it('normalizeSectionOrder fills missing groups and keeps ungrouped', () => {
    const groups: PromptGroup[] = [
      { id: 'g1', name: 'A', order: 0, createdAt: 1 },
      { id: 'g2', name: 'B', order: 10, createdAt: 1 },
    ];
    expect(normalizeSectionOrder(groups, ['g2'])).toEqual([
      UNGROUPED_SENTINEL,
      'g2',
      'g1',
    ]);
  });

  it('reorderSectionOrder moves a section before/after another', () => {
    const order = [UNGROUPED_SENTINEL, 'g1', 'g2'];
    expect(reorderSectionOrder(order, 'g2', 'g1', 'before')).toEqual([
      UNGROUPED_SENTINEL,
      'g2',
      'g1',
    ]);
    expect(reorderSectionOrder(order, UNGROUPED_SENTINEL, 'g2', 'after')).toEqual([
      'g1',
      'g2',
      UNGROUPED_SENTINEL,
    ]);
  });

  it('syncGroupOrdersFromSectionOrder updates group.order', () => {
    const groups: PromptGroup[] = [
      { id: 'g1', name: 'A', order: 0, createdAt: 1 },
      { id: 'g2', name: 'B', order: 10, createdAt: 1 },
    ];
    const next = syncGroupOrdersFromSectionOrder(groups, ['g2', UNGROUPED_SENTINEL, 'g1']);
    expect(next.find((g) => g.id === 'g2')?.order).toBe(0);
    expect(next.find((g) => g.id === 'g1')?.order).toBe(10);
  });

  it('applyPromptReorder moves within a group', () => {
    const items = [
      { id: 'a', text: 'A', groupId: 'g1', order: 0 },
      { id: 'b', text: 'B', groupId: 'g1', order: 10 },
      { id: 'c', text: 'C', groupId: 'g1', order: 20 },
    ];
    const next = applyPromptReorder(items, 'c', 'g1', 'a');
    expect(
      next
        .filter((it) => it.groupId === 'g1')
        .sort((a, b) => a.order - b.order)
        .map((it) => it.id),
    ).toEqual(['c', 'a', 'b']);
  });

  it('applyPromptReorder moves across groups and appends when beforeItemId is null', () => {
    const items = [
      { id: 'a', text: 'A', groupId: 'g1', order: 0 },
      { id: 'b', text: 'B', groupId: 'g2', order: 0 },
    ];
    const next = applyPromptReorder(items, 'a', 'g2', null);
    expect(next.find((it) => it.id === 'a')?.groupId).toBe('g2');
    expect(next.find((it) => it.id === 'a')?.order).toBe(10);
    expect(next.find((it) => it.id === 'b')?.order).toBe(0);
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

  it('previewText collapses whitespace', () => {
    expect(previewText('a\n\nb', 80)).toBe('a b');
  });
});
