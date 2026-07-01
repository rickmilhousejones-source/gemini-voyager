import { describe, expect, it } from 'vitest';

import { closeSlashPicker, renderSlashPicker } from '../pickerUI';

describe('slashPicker pickerUI', () => {
  it('renders filtered items and closes cleanly', () => {
    const anchor = document.createElement('div');
    document.body.appendChild(anchor);

    let selectedId: string | null = null;
    renderSlashPicker(
      anchor,
      [
        { id: '1', text: 'Hello {{name:test}}', tags: ['edit'] },
        { id: '2', text: 'Other', tags: [] },
      ],
      [
        {
          id: 't1',
          name: 'edit',
          normalized: 'edit',
          colorId: 'blue',
          iconId: 'edit',
          createdAt: 1,
        },
      ],
      'hel',
      null,
      { empty: 'Empty', allTags: 'All' },
      {
        onSelect: (item) => {
          selectedId = item.id;
        },
        onClose: () => closeSlashPicker(),
        onTagFilter: () => {},
      },
    );

    const picker = document.querySelector('.gv-slash-picker');
    expect(picker).toBeTruthy();
    expect(document.querySelectorAll('.gv-slash-picker-item').length).toBe(1);

    (document.querySelector('.gv-slash-picker-item') as HTMLButtonElement)?.click();
    expect(selectedId).toBe('1');

    closeSlashPicker();
    expect(document.querySelector('.gv-slash-picker')).toBeNull();
    anchor.remove();
  });
});
