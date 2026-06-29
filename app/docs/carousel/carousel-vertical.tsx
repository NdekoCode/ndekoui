import {
  Carousel,
  CarouselContent,
  CarouselIndicator,
  CarouselItem,
  CarouselNavigation,
} from '@/components/core/carousel';

const ROOMS = [
  { name: 'The loft', src: '/images/scenes/scene-02.svg' },
  { name: 'Garden room', src: '/images/scenes/scene-05.svg' },
  { name: 'The tower', src: '/images/scenes/scene-07.svg' },
  { name: 'Lake suite', src: '/images/scenes/scene-08.svg' },
];

export function CarouselVertical() {
  return (
    <div className='relative w-full max-w-sm px-4 py-8'>
      <Carousel orientation='vertical' loop aria-label='Rooms'>
        <CarouselContent className='h-72'>
          {ROOMS.map((room) => (
            <CarouselItem key={room.name} className='basis-full p-1'>
              <figure className='relative h-full overflow-hidden rounded-xl'>
                {/* eslint-disable-next-line @next/next/no-img-element -- plain img keeps the example portable */}
                <img
                  src={room.src}
                  alt=''
                  draggable={false}
                  className='size-full object-cover'
                />
                <figcaption className='bg-card/90 text-foreground absolute bottom-3 left-3 rounded-lg px-2.5 py-1 text-xs font-medium'>
                  {room.name}
                </figcaption>
              </figure>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselNavigation alwaysShow />
        <CarouselIndicator
          variant='travel'
          className='pr-4'
          classNameButton='bg-card/70'
        />
      </Carousel>
    </div>
  );
}
