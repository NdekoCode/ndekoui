import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNavigation,
  CarouselProgress,
} from '@/components/core/carousel';

const CABINS = [
  { name: 'Pine cabin', guests: 2, src: '/images/scenes/scene-04.svg' },
  { name: 'Lake house', guests: 6, src: '/images/scenes/scene-08.svg' },
  { name: 'Dune shelter', guests: 1, src: '/images/scenes/scene-06.svg' },
  { name: 'Orchard barn', guests: 4, src: '/images/scenes/scene-05.svg' },
  { name: 'Ridge hut', guests: 3, src: '/images/scenes/scene-03.svg' },
  { name: 'Harbour loft', guests: 2, src: '/images/scenes/scene-01.svg' },
];

function guestsLabel(count: number) {
  if (count === 1) {
    return '1 guest';
  }
  return `${count} guests`;
}

export function CarouselSlidesPerView() {
  return (
    <div className='relative w-full max-w-lg px-4 py-8'>
      <Carousel slidesPerView={2.5} aria-label='Cabins'>
        <CarouselContent className='-ml-3'>
          {CABINS.map((cabin) => (
            <CarouselItem key={cabin.name} className='pl-3'>
              <div className='flex flex-col gap-2'>
                {/* eslint-disable-next-line @next/next/no-img-element -- plain img keeps the example portable */}
                <img
                  src={cabin.src}
                  alt=''
                  draggable={false}
                  className='aspect-[4/5] w-full rounded-xl object-cover'
                />
                <span className='flex flex-col'>
                  <span className='text-foreground text-[13px] font-medium'>
                    {cabin.name}
                  </span>
                  <span className='text-muted-foreground text-xs tabular-nums'>
                    {guestsLabel(cabin.guests)}
                  </span>
                </span>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className='mt-4 flex items-center gap-4 p-1'>
          <CarouselProgress />
          <CarouselNavigation
            className='static w-auto translate-y-0 gap-2 px-0'
            alwaysShow
          />
        </div>
      </Carousel>
    </div>
  );
}
