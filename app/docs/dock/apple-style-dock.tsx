import { Dock, DockIcon, DockItem, DockLabel } from '@/components/core/dock';
import {
  BoxIcon,
  ChartLineIcon,
  ComponentIcon,
  EclipseIcon,
  FileTextIcon,
  HomeIcon,
  MailIcon,
} from '@/registry/ndeko/lib/icons';

const ICON_CLASS = 'text-muted-foreground size-full';

const data = [
  {
    title: 'Home',
    icon: <HomeIcon className={ICON_CLASS} />,
    href: '#',
  },
  {
    title: 'Products',
    icon: <BoxIcon className={ICON_CLASS} />,
    href: '#',
  },
  {
    title: 'Components',
    icon: <ComponentIcon className={ICON_CLASS} />,
    href: '#',
  },
  {
    title: 'Activity',
    icon: <ChartLineIcon className={ICON_CLASS} />,
    href: '#',
  },
  {
    title: 'Change log',
    icon: <FileTextIcon className={ICON_CLASS} />,
    href: '#',
  },
  {
    title: 'Email',
    icon: <MailIcon className={ICON_CLASS} />,
    href: '#',
  },
  {
    title: 'Theme',
    icon: <EclipseIcon className={ICON_CLASS} />,
    href: '#',
  },
];

export function AppleStyleDock() {
  return (
    <div className='absolute bottom-2 left-1/2 max-w-full -translate-x-1/2'>
      <Dock className='items-end pb-3'>
        {data.map((item) => (
          <DockItem
            key={item.title}
            className='keycap-3d aspect-square rounded-full'
          >
            <DockLabel>{item.title}</DockLabel>
            <DockIcon>{item.icon}</DockIcon>
          </DockItem>
        ))}
      </Dock>
    </div>
  );
}
