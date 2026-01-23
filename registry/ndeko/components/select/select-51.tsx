'use client';

import { Fragment, useId } from 'react';
import {
  Header,
  ListBox,
  ListBoxItem,
  ListBoxSection,
  Separator,
} from 'react-aria-components';

import {
  CONTROL_RECIPE,
  MENU_ITEM,
  MENU_LABEL,
  MENU_SEPARATOR,
} from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Label } from '@/registry/ndeko/ui/label';
import { SelectedMark } from '@/registry/ndeko/ui/selected-mark';

const SECTIONS = [
  {
    name: 'Veggies',
    items: [
      { id: 'lettuce', label: 'Lettuce' },
      { id: 'tomato', label: 'Tomato' },
      { id: 'onion', label: 'Onion' },
    ],
  },
  {
    name: 'Protein',
    items: [
      { id: 'ham', label: 'Ham' },
      { id: 'tuna', label: 'Tuna' },
      { id: 'tofu', label: 'Tofu' },
    ],
  },
  {
    name: 'Condiments',
    items: [
      { id: 'mayonnaise', label: 'Mayonnaise' },
      { id: 'mustard', label: 'Mustard' },
      { id: 'ranch', label: 'Ranch' },
    ],
  },
];

const LIST_BOX = cn(
  CONTROL_RECIPE,
  'flex max-h-72 min-h-20 flex-col overflow-y-auto p-1 outline-none',
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

export default function Select51() {
  const labelId = useId();

  return (
    <div className='flex w-full max-w-xs flex-col gap-2'>
      <Label id={labelId}>Sandwich fillings</Label>
      <ListBox
        aria-labelledby={labelId}
        selectionMode='multiple'
        defaultSelectedKeys={['lettuce', 'tuna']}
        className={LIST_BOX}
      >
        {SECTIONS.map((section, index) => (
          <Fragment key={section.name}>
            {index > 0 && <Separator className={MENU_SEPARATOR} />}
            <ListBoxSection className='flex flex-col gap-0.5'>
              <Header className={MENU_LABEL}>{section.name}</Header>
              {section.items.map((item) => (
                <ListBoxItem
                  key={item.id}
                  id={item.id}
                  textValue={item.label}
                  className={OPTION}
                >
                  {({ isSelected }) => (
                    <>
                      {item.label}
                      <SelectedMark
                        className={cn(MARK, markStateOf(isSelected))}
                      />
                    </>
                  )}
                </ListBoxItem>
              ))}
            </ListBoxSection>
          </Fragment>
        ))}
      </ListBox>
    </div>
  );
}
