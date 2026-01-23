'use client';

import { useId } from 'react';
import { ListBox, ListBoxItem } from 'react-aria-components';

import { CONTROL_RECIPE, MENU_ITEM } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Label } from '@/registry/ndeko/ui/label';
import { SelectedMark } from '@/registry/ndeko/ui/selected-mark';

const FRAMEWORKS = [
  { id: 'react', label: 'React' },
  { id: 'vue', label: 'Vue' },
  { id: 'angular', label: 'Angular' },
  { id: 'svelte', label: 'Svelte' },
];

const LIST_BOX = cn(
  CONTROL_RECIPE,
  'flex max-h-72 min-h-20 flex-col gap-0.5 overflow-y-auto p-1 outline-none',
  'has-[[data-focus-visible]]:border-foreground/30 has-[[data-focus-visible]]:ring-ring/25 has-[[data-focus-visible]]:ring-[3px]'
);

const OPTION = cn(
  MENU_ITEM,
  'cursor-pointer pr-8 data-focused:bg-foreground/5 data-hovered:bg-foreground/5'
);

const MARK =
  'absolute right-1.5 transition-[scale,opacity] duration-150 ease-(--ease-out-strong)';

function markStateOf(isSelected: boolean) {
  if (isSelected) {
    return 'scale-100 opacity-100';
  }
  return 'scale-75 opacity-0 duration-100';
}

export default function Select50() {
  const labelId = useId();

  return (
    <div className='flex w-full max-w-xs flex-col gap-2'>
      <Label id={labelId}>Frameworks</Label>
      <ListBox
        aria-labelledby={labelId}
        selectionMode='multiple'
        defaultSelectedKeys={['react', 'vue']}
        className={LIST_BOX}
      >
        {FRAMEWORKS.map((framework) => (
          <ListBoxItem
            key={framework.id}
            id={framework.id}
            textValue={framework.label}
            className={OPTION}
          >
            {({ isSelected }) => (
              <>
                {framework.label}
                <SelectedMark className={cn(MARK, markStateOf(isSelected))} />
              </>
            )}
          </ListBoxItem>
        ))}
      </ListBox>
    </div>
  );
}
