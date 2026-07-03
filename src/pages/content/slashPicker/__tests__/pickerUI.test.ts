import { describe, expect, it } from 'vitest';

import { closeSlashPicker, renderSlashPicker } from '../pickerUI';

describe('slashPicker pickerUI', () => {
  it('renders grouped filtered items and closes cleanly', () => {
    const anchor = document.createElement('div');
    document.body.appendChild(anchor);

    let selectedId: string | null = null;
    renderSlashPicker(
      anchor,
      [
        { id: '1', text: 'Hello {{name:test}}', groupId: 'g1' },
        { id: '2', text: 'Other', groupId: null },
      ],
      [{ id: 'g1', name: 'Edit', order: 0, createdAt: 1 }],
      'hel',
      { empty: 'Empty', ungrouped: 'Ungrouped' },
      {
        onSelect: (item) => {
          selectedId = item.id;
        },
        onClose: () => closeSlashPicker(),
      },
    );

    const picker = document.querySelector('.gv-slash-picker');
    expect(picker).toBeTruthy();
    expect(document.querySelectorAll('.gv-slash-picker-item').length).toBe(1);
    expect(document.querySelector('.gv-slash-picker-group-name')?.textContent).toBe('Edit');
    expect(document.querySelector('.gv-slash-picker-group-icon')).toBeNull();
    expect(document.querySelector('.gv-slash-picker-item.active')).toBeNull();
    const itemIcon = document.querySelector('.gv-slash-picker-item-icon svg');
    expect(itemIcon?.getAttribute('fill')).toBe('none');
    expect(itemIcon?.getAttribute('stroke')).toBe('currentColor');
    expect(document.querySelector('.gv-slash-picker-item-title')?.textContent).toBeTruthy();
    expect(document.querySelector('.gv-slash-picker-item-desc')?.textContent).toBeTruthy();

    (document.querySelector('.gv-slash-picker-item') as HTMLButtonElement)?.click();
    expect(selectedId).toBe('1');

    closeSlashPicker();
    expect(document.querySelector('.gv-slash-picker')).toBeNull();
    anchor.remove();
  });
});
