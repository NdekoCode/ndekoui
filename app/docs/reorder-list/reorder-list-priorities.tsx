'use client';

import { useState } from 'react';

import { ReorderList } from '@/components/core/reorder-list';

type Priority = {
  id: string;
  title: string;
  owner: string;
};

const PRIORITIES: Priority[] = [
  { id: 'billing', title: 'Ship the new billing page', owner: 'Amara Okafor' },
  {
    id: 'onboarding',
    title: 'Shorten onboarding to three steps',
    owner: 'Léo Martin',
  },
  {
    id: 'search',
    title: 'Fix slow search on large workspaces',
    owner: 'Sofia Brandt',
  },
  { id: 'export', title: 'Add CSV export to reports', owner: 'Kenji Mori' },
];

function keyOf(priority: Priority) {
  return priority.id;
}

function labelOf(priority: Priority) {
  return priority.title;
}

function renderPriority(priority: Priority) {
  return (
    <span className='flex flex-col'>
      <span className='text-foreground truncate text-[13px] font-medium'>
        {priority.title}
      </span>
      <span className='text-muted-foreground truncate text-xs'>
        {priority.owner}
      </span>
    </span>
  );
}

export function ReorderListPriorities() {
  const [priorities, setPriorities] = useState(PRIORITIES);

  return (
    <ReorderList
      aria-label='Priorities this week'
      className='w-full max-w-sm'
      items={priorities}
      onReorder={setPriorities}
      getKey={keyOf}
      getLabel={labelOf}
      renderItem={renderPriority}
    />
  );
}
