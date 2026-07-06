'use client';

import { CheckedState, type ItemInstance } from '@headless-tree/core';

import { Checkbox } from '@/registry/ndeko/ui/checkbox';

type ItemCheckboxProps<T> = {
  item: ItemInstance<T>;
};

/* The bottom margin matches the gap under each row, so the box sits on the middle of the label. */
export function ItemCheckbox<T>({ item }: ItemCheckboxProps<T>) {
  const state = item.getCheckedState();
  const isChecked = state === CheckedState.Checked;
  const isPartlyChecked = state === CheckedState.Indeterminate;

  function toggle() {
    void item.toggleCheckedState();
  }

  return (
    <Checkbox
      checked={isChecked}
      indeterminate={isPartlyChecked}
      onCheckedChange={toggle}
      aria-label={item.getItemName()}
      className='mb-0.5'
    />
  );
}
