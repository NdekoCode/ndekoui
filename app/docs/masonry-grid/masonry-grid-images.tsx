import { MasonryGrid } from '@/components/core/masonry-grid';
import { cn } from '@/registry/ndeko/lib/utils';

const PHOTOS = [
  {
    id: 'harbour',
    title: 'Harbour at noon',
    src: '/images/scenes/scene-01.svg',
    shape: 'aspect-[3/4]',
  },
  {
    id: 'meadow',
    title: 'Meadow road',
    src: '/images/scenes/scene-02.svg',
    shape: 'aspect-[3/2]',
  },
  {
    id: 'ridge',
    title: 'North ridge',
    src: '/images/scenes/scene-03.svg',
    shape: 'aspect-square',
  },
  {
    id: 'valley',
    title: 'Low valley',
    src: '/images/scenes/scene-04.svg',
    shape: 'aspect-[4/5]',
  },
  {
    id: 'hills',
    title: 'Hills after rain',
    src: '/images/scenes/scene-05.svg',
    shape: 'aspect-[3/2]',
  },
  {
    id: 'dunes',
    title: 'Dunes at dusk',
    src: '/images/scenes/scene-06.svg',
    shape: 'aspect-[2/3]',
  },
  {
    id: 'night',
    title: 'Night camp',
    src: '/images/scenes/scene-07.svg',
    shape: 'aspect-square',
  },
  {
    id: 'shore',
    title: 'Morning shore',
    src: '/images/scenes/scene-08.svg',
    shape: 'aspect-[3/4]',
  },
  {
    id: 'bay',
    title: 'The bay again',
    src: '/images/scenes/scene-01.svg',
    shape: 'aspect-[3/2]',
  },
];

export function MasonryGridImages() {
  return (
    <div className='w-full max-w-3xl px-4 py-8'>
      <MasonryGrid columnWidth={180} maxColumns={3} revealOnView>
        {PHOTOS.map((photo) => (
          <figure key={photo.id} className='flex flex-col gap-2'>
            {/* eslint-disable-next-line @next/next/no-img-element -- plain img keeps the example portable */}
            <img
              src={photo.src}
              alt={photo.title}
              loading='lazy'
              decoding='async'
              className={cn(
                'bg-foreground/[0.04] w-full rounded-xl object-cover',
                photo.shape
              )}
            />
            <figcaption className='text-muted-foreground text-xs'>
              {photo.title}
            </figcaption>
          </figure>
        ))}
      </MasonryGrid>
    </div>
  );
}
