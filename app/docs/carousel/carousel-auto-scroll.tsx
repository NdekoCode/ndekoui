import { InfiniteSlider } from '@/components/core/infinite-slider';

const SCENES = [
  { title: 'Harbour', src: '/images/scenes/scene-01.svg' },
  { title: 'Meadow', src: '/images/scenes/scene-02.svg' },
  { title: 'Ridge', src: '/images/scenes/scene-03.svg' },
  { title: 'Valley', src: '/images/scenes/scene-04.svg' },
  { title: 'Dunes', src: '/images/scenes/scene-06.svg' },
  { title: 'Shore', src: '/images/scenes/scene-08.svg' },
];

export function CarouselAutoScroll() {
  return (
    <div className='w-full max-w-2xl px-4 py-8'>
      <InfiniteSlider speed={40} speedOnHover={10} gap={12}>
        {SCENES.map((scene) => (
          <figure key={scene.title} className='flex w-40 flex-col gap-1.5'>
            {/* eslint-disable-next-line @next/next/no-img-element -- plain img keeps the example portable */}
            <img
              src={scene.src}
              alt={scene.title}
              draggable={false}
              className='aspect-[4/3] w-full rounded-xl object-cover'
            />
            <figcaption className='text-muted-foreground text-xs'>
              {scene.title}
            </figcaption>
          </figure>
        ))}
      </InfiniteSlider>
    </div>
  );
}
