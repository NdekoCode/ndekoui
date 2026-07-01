import { OrbitingCircles } from '@/components/core/orbiting-circles';
import {
  CalendarIcon,
  CloudIcon,
  CodeIcon,
  DatabaseIcon,
  FileTextIcon,
  LayersIcon,
  MailIcon,
  MessageCircleIcon,
  ServerIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';

const INNER: Icon[] = [MailIcon, CalendarIcon, DatabaseIcon];

const OUTER: Icon[] = [
  CloudIcon,
  CodeIcon,
  FileTextIcon,
  MessageCircleIcon,
  ServerIcon,
];

function Tile({ icon: TileIcon }: { icon: Icon }) {
  return (
    <span className='bg-muted text-muted-foreground flex size-full items-center justify-center rounded-lg'>
      <TileIcon className='size-4' />
    </span>
  );
}

export function OrbitingCirclesIntegrations() {
  return (
    <div
      role='img'
      aria-label='Eight sources orbiting one workspace'
      className='relative h-[380px] w-full max-w-md overflow-hidden'
    >
      <span className='gem-plate absolute top-1/2 left-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl [--gem:var(--primary)]'>
        <LayersIcon className='size-6' />
      </span>
      <OrbitingCircles radius={78} duration={22} iconSize={36}>
        {INNER.map((icon, index) => (
          <Tile key={index} icon={icon} />
        ))}
      </OrbitingCircles>
      <OrbitingCircles
        radius={150}
        duration={36}
        iconSize={36}
        reverse
        startAngle={-60}
      >
        {OUTER.map((icon, index) => (
          <Tile key={index} icon={icon} />
        ))}
      </OrbitingCircles>
    </div>
  );
}
