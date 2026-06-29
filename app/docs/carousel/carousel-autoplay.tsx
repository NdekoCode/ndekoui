import {
  Carousel,
  CarouselAutoplayToggle,
  CarouselContent,
  CarouselIndicator,
  CarouselItem,
  CarouselProgress,
} from '@/components/core/carousel';

const SLIDES = [
  {
    title: 'Day 1, the harbour',
    src: '/images/scenes/scene-01.svg',
    alt: 'A bright sun over the bay',
  },
  {
    title: 'Day 2, meadow road',
    src: '/images/scenes/scene-02.svg',
    alt: 'Green hills in spring light',
  },
  {
    title: 'Day 3, north ridge',
    src: '/images/scenes/scene-03.svg',
    alt: 'The north ridge at midday',
  },
  {
    title: 'Day 4, the dunes',
    src: '/images/scenes/scene-06.svg',
    alt: 'Warm dunes at the end of the day',
  },
];

export function CarouselAutoplay() {
  return (
    <div className='relative w-full max-w-md px-4 py-8'>
      <Carousel autoplay loop aria-label='Trip highlights'>
        <CarouselContent>
          {SLIDES.map((slide) => (
            <CarouselItem key={slide.title} className='p-1'>
              <figure className='relative overflow-hidden rounded-xl'>
                {/* eslint-disable-next-line @next/next/no-img-element -- plain img keeps the example portable */}
                <img
                  src={slide.src}
                  alt={slide.alt}
                  draggable={false}
                  className='aspect-[3/2] w-full object-cover'
                />
                <figcaption className='bg-card/90 text-foreground absolute bottom-3 left-3 rounded-lg px-2.5 py-1 text-xs font-medium'>
                  {slide.title}
                </figcaption>
              </figure>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className='mt-2 flex items-center gap-3 p-1'>
          <CarouselAutoplayToggle />
          <CarouselIndicator variant='travel' className='static w-auto' />
          <CarouselProgress type='autoplay' className='ml-auto w-20' />
        </div>
      </Carousel>
    </div>
  );
}
