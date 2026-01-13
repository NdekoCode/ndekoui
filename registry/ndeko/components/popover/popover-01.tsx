'use client';

import { useState } from 'react';

import { ListFilterIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import { Label } from '@/registry/ndeko/ui/label';
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from '@/registry/ndeko/ui/popover';

const WIDGETS = [
  { value: 'real-time', label: 'Real time' },
  { value: 'top-channels', label: 'Top channels' },
  { value: 'last-orders', label: 'Last orders' },
  { value: 'total-spent', label: 'Total spent' },
];

export default function Popover01() {
  const [shownWidgets, setShownWidgets] = useState<string[]>([]);
  const hasSelection = shownWidgets.length > 0;

  function toggleWidget(value: string, isChecked: boolean) {
    setShownWidgets((current) => {
      const others = current.filter((widget) => widget !== value);
      if (isChecked) {
        return [...others, value];
      }
      return others;
    });
  }

  function clearWidgets() {
    setShownWidgets([]);
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant='outline' size='icon' aria-label='Filter widgets' />
        }
      >
        <ListFilterIcon />
      </PopoverTrigger>
      <PopoverContent className='flex w-44 flex-col gap-3 p-3'>
        <PopoverTitle className='text-muted-foreground text-xs'>
          Filters
        </PopoverTitle>
        <div className='flex flex-col gap-3'>
          {WIDGETS.map((widget) => {
            const isChecked = shownWidgets.includes(widget.value);

            return (
              <Label key={widget.value} className='font-normal'>
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={(checked) =>
                    toggleWidget(widget.value, checked)
                  }
                />
                {widget.label}
              </Label>
            );
          })}
        </div>
        <div className='flex justify-between gap-2 pt-1'>
          <Button
            variant='outline'
            size='sm'
            onClick={clearWidgets}
            disabled={!hasSelection}
            focusableWhenDisabled
          >
            Clear
          </Button>
          <PopoverClose render={<Button size='sm' />}>Apply</PopoverClose>
        </div>
      </PopoverContent>
    </Popover>
  );
}
