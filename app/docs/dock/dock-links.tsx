import {
  Dock,
  DockIcon,
  DockItem,
  DockLabel,
  DockSeparator,
} from '@/components/core/dock';
import {
  CalendarIcon,
  FolderIcon,
  HomeIcon,
  InboxIcon,
  SearchIcon,
  SettingsIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';

type Place = {
  title: string;
  icon: Icon;
};

const PLACES: Place[] = [
  { title: 'Home', icon: HomeIcon },
  { title: 'Inbox', icon: InboxIcon },
  { title: 'Projects', icon: FolderIcon },
  { title: 'Calendar', icon: CalendarIcon },
];

const TOOLS: Place[] = [
  { title: 'Search', icon: SearchIcon },
  { title: 'Settings', icon: SettingsIcon },
];

const ITEM_CLASS =
  'keycap-3d aspect-square rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

function DockLink({ place }: { place: Place }) {
  const PlaceIcon = place.icon;

  return (
    <DockItem href='#' className={ITEM_CLASS}>
      <DockLabel>{place.title}</DockLabel>
      <DockIcon>
        <PlaceIcon className='text-muted-foreground size-full' />
      </DockIcon>
    </DockItem>
  );
}

export function DockLinks() {
  return (
    <div className='absolute bottom-2 left-1/2 max-w-full -translate-x-1/2'>
      <Dock
        className='items-end pb-3'
        itemSize={36}
        magnification={64}
        panelHeight={58}
      >
        {PLACES.map((place) => (
          <DockLink key={place.title} place={place} />
        ))}
        <DockSeparator className='mb-1.5 h-6 self-end' />
        {TOOLS.map((place) => (
          <DockLink key={place.title} place={place} />
        ))}
      </Dock>
    </div>
  );
}
