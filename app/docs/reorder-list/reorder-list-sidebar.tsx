'use client';

import { useState } from 'react';

import { ReorderList } from '@/components/core/reorder-list';
import {
  CalendarIcon,
  ChartLineIcon,
  InboxIcon,
  LayersIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';

type Shortcut = {
  id: string;
  name: string;
  icon: Icon;
};

const SHORTCUTS: Shortcut[] = [
  { id: 'inbox', name: 'Inbox', icon: InboxIcon },
  { id: 'projects', name: 'Projects', icon: LayersIcon },
  { id: 'calendar', name: 'Calendar', icon: CalendarIcon },
  { id: 'reports', name: 'Reports', icon: ChartLineIcon },
];

function keyOf(shortcut: Shortcut) {
  return shortcut.id;
}

function labelOf(shortcut: Shortcut) {
  return shortcut.name;
}

function renderShortcut(shortcut: Shortcut) {
  const ShortcutIcon = shortcut.icon;

  return (
    <span className='flex items-center gap-2.5'>
      <span className='keycap-3d text-muted-foreground grid size-7 place-items-center rounded-md'>
        <ShortcutIcon className='size-3.5' />
      </span>
      <span className='text-foreground text-[13px] font-medium'>
        {shortcut.name}
      </span>
    </span>
  );
}

export function ReorderListSidebar() {
  const [shortcuts, setShortcuts] = useState(SHORTCUTS);

  return (
    <div className='flex w-full max-w-64 flex-col gap-3'>
      <p className='text-muted-foreground text-xs'>Sidebar order</p>
      <ReorderList
        aria-label='Sidebar order'
        items={shortcuts}
        onReorder={setShortcuts}
        getKey={keyOf}
        getLabel={labelOf}
        renderItem={renderShortcut}
      />
    </div>
  );
}
