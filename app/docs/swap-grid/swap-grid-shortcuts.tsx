import { SwapGrid, type SwapGridItem } from '@/components/core/swap-grid';
import {
  CalendarIcon,
  FileTextIcon,
  InboxIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';

type Shortcut = {
  id: string;
  name: string;
  icon: Icon;
};

const SHORTCUTS: Shortcut[] = [
  { id: 'inbox', name: 'Inbox', icon: InboxIcon },
  { id: 'calendar', name: 'Calendar', icon: CalendarIcon },
  { id: 'docs', name: 'Docs', icon: FileTextIcon },
  { id: 'search', name: 'Search', icon: SearchIcon },
  { id: 'people', name: 'People', icon: UsersIcon },
  { id: 'settings', name: 'Settings', icon: SettingsIcon },
];

function ShortcutTile({ shortcut }: { shortcut: Shortcut }) {
  const ShortcutIcon = shortcut.icon;

  return (
    <div className='flex h-full flex-col items-center justify-center gap-2'>
      <span className='keycap-3d text-muted-foreground grid size-9 place-items-center rounded-lg'>
        <ShortcutIcon className='size-4' />
      </span>
      <span className='text-foreground text-xs font-medium'>
        {shortcut.name}
      </span>
    </div>
  );
}

const ITEMS: SwapGridItem[] = SHORTCUTS.map((shortcut) => ({
  id: shortcut.id,
  label: shortcut.name,
  content: <ShortcutTile shortcut={shortcut} />,
}));

const LAYOUT = [
  'inbox',
  'calendar',
  null,
  'docs',
  'search',
  null,
  'people',
  'settings',
];

export function SwapGridShortcuts() {
  return (
    <SwapGrid
      aria-label='Home screen shortcuts'
      items={ITEMS}
      columns={4}
      defaultSlots={LAYOUT}
      className='w-full max-w-md auto-rows-[96px]'
    />
  );
}
