import { AnimatedGroup } from '@/components/core/animated-group';
import {
  CompassIcon,
  FeatherIcon,
  MoonIcon,
  SunIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';

const ARTWORKS = [
  {
    title: 'Morning tide',
    meta: 'Oil on linen',
    icon: SunIcon,
    tile: 'bg-warning/10',
    gem: '[--gem:var(--warning)]',
  },
  {
    title: 'Orchard in May',
    meta: 'Gouache',
    icon: FeatherIcon,
    tile: 'bg-success/10',
    gem: '[--gem:var(--success)]',
  },
  {
    title: 'Harbour lights',
    meta: 'Ink on paper',
    icon: MoonIcon,
    tile: 'bg-info/10',
    gem: '[--gem:var(--info)]',
  },
  {
    title: 'Quiet street',
    meta: 'Charcoal',
    icon: CompassIcon,
    tile: 'bg-foreground/[0.04]',
    gem: '[--gem:var(--muted-foreground)]',
  },
];

export function AnimatedGroupPreset() {
  return (
    <AnimatedGroup
      className='grid grid-cols-2 gap-4 p-8 md:grid-cols-3 lg:grid-cols-4'
      preset='scale'
    >
      {ARTWORKS.map((artwork) => {
        const Glyph = artwork.icon;

        return (
          <div
            key={artwork.title}
            className={cn(
              'flex aspect-[4/5] w-full flex-col justify-between rounded-lg p-3',
              artwork.tile
            )}
          >
            <span
              className={cn(
                'gem-plate grid size-8 place-items-center rounded-md',
                artwork.gem
              )}
            >
              <Glyph className='size-4' />
            </span>
            <span className='flex flex-col'>
              <span className='text-foreground text-[13px] font-medium'>
                {artwork.title}
              </span>
              <span className='text-muted-foreground text-xs'>
                {artwork.meta}
              </span>
            </span>
          </div>
        );
      })}
    </AnimatedGroup>
  );
}
