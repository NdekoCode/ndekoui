import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselThumbnail,
  CarouselThumbnails,
} from '@/components/core/carousel';

const PHOTOS = [
  { title: 'Harbour at noon', src: '/images/scenes/scene-01.svg' },
  { title: 'Meadow road', src: '/images/scenes/scene-02.svg' },
  { title: 'North ridge', src: '/images/scenes/scene-03.svg' },
  { title: 'Low valley', src: '/images/scenes/scene-04.svg' },
  { title: 'Hills after rain', src: '/images/scenes/scene-05.svg' },
  { title: 'Dunes at dusk', src: '/images/scenes/scene-06.svg' },
  { title: 'Night camp', src: '/images/scenes/scene-07.svg' },
  { title: 'Morning shore', src: '/images/scenes/scene-08.svg' },
];

export function CarouselThumbnailsExample() {
  return (
    <div className='relative w-full max-w-md px-4 py-8'>
      <Carousel aria-label='Photo gallery'>
        <CarouselContent>
          {PHOTOS.map((photo) => (
            <CarouselItem key={photo.title} className='p-1'>
              {/* eslint-disable-next-line @next/next/no-img-element -- plain img keeps the example portable */}
              <img
                src={photo.src}
                alt={photo.title}
                draggable={false}
                className='aspect-[3/2] w-full rounded-xl object-cover'
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselThumbnails className='mt-2'>
          {PHOTOS.map((photo, index) => (
            <CarouselThumbnail
              key={photo.title}
              index={index}
              aria-label={photo.title}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- plain img keeps the example portable */}
              <img
                src={photo.src}
                alt=''
                draggable={false}
                className='size-full object-cover'
              />
            </CarouselThumbnail>
          ))}
        </CarouselThumbnails>
      </Carousel>
    </div>
  );
}
