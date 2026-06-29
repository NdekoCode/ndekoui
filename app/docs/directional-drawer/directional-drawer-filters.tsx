'use client';

import { useState } from 'react';

import {
  DirectionalDrawer,
  DirectionalDrawerClose,
  DirectionalDrawerContent,
  DirectionalDrawerDescription,
  DirectionalDrawerFooter,
  DirectionalDrawerHeader,
  DirectionalDrawerTitle,
  DirectionalDrawerTrigger,
} from '@/components/core/directional-drawer';
import { FilterIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import { Label } from '@/registry/ndeko/ui/label';

type Status = {
  id: string;
  name: string;
  count: number;
};

const STATUSES: Status[] = [
  { id: 'backlog', name: 'Backlog', count: 18 },
  { id: 'progress', name: 'In progress', count: 7 },
  { id: 'review', name: 'In review', count: 1 },
  { id: 'done', name: 'Done', count: 42 },
];

function issuesLabel(count: number) {
  if (count === 1) {
    return 'Show 1 issue';
  }
  return `Show ${count} issues`;
}

function totalOf(statuses: Status[]) {
  let total = 0;
  for (const status of statuses) {
    total += status.count;
  }
  return total;
}

function toggled(selected: string[], id: string, checked: boolean) {
  if (checked) {
    return [...selected, id];
  }
  return selected.filter((selectedId) => selectedId !== id);
}

export function DirectionalDrawerFilters() {
  const [selected, setSelected] = useState(['progress', 'review']);
  const shown = STATUSES.filter((status) => selected.includes(status.id));
  const total = totalOf(shown);

  function setStatus(id: string, checked: boolean) {
    setSelected((current) => toggled(current, id, checked));
  }

  return (
    <DirectionalDrawer>
      <DirectionalDrawerTrigger
        render={<Button type='button' variant='outline' />}
      >
        <FilterIcon />
        Filters
      </DirectionalDrawerTrigger>
      <DirectionalDrawerContent side='right'>
        <DirectionalDrawerHeader>
          <DirectionalDrawerTitle>Filters</DirectionalDrawerTitle>
          <DirectionalDrawerDescription>
            Choose which issues the board shows
          </DirectionalDrawerDescription>
        </DirectionalDrawerHeader>
        <fieldset className='flex flex-col gap-3'>
          <legend className='text-muted-foreground mb-2 text-xs'>Status</legend>
          {STATUSES.map((status) => (
            <div key={status.id} className='flex items-center gap-2.5'>
              <Checkbox
                id={`status-${status.id}`}
                checked={selected.includes(status.id)}
                onCheckedChange={(checked) => setStatus(status.id, checked)}
              />
              <Label htmlFor={`status-${status.id}`} className='flex-1'>
                {status.name}
              </Label>
              <span className='text-muted-foreground text-xs tabular-nums'>
                {status.count}
              </span>
            </div>
          ))}
        </fieldset>
        <DirectionalDrawerFooter>
          <DirectionalDrawerClose render={<Button type='button' />}>
            {issuesLabel(total)}
          </DirectionalDrawerClose>
          <Button type='button' variant='ghost' onClick={() => setSelected([])}>
            Clear filters
          </Button>
        </DirectionalDrawerFooter>
      </DirectionalDrawerContent>
    </DirectionalDrawer>
  );
}
