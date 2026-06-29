import { ImageTrail } from '@/components/core/image-trail';

const SCENES = [
  { src: '/images/scenes/scene-01.svg' },
  { src: '/images/scenes/scene-02.svg' },
  { src: '/images/scenes/scene-03.svg' },
  { src: '/images/scenes/scene-04.svg' },
  { src: '/images/scenes/scene-05.svg' },
  { src: '/images/scenes/scene-06.svg' },
  { src: '/images/scenes/scene-07.svg' },
  { src: '/images/scenes/scene-08.svg' },
];

export function ImageTrailBasic() {
  return (
    <div className='w-full px-4 py-8'>
      <ImageTrail
        images={SCENES}
        className='bg-foreground/[0.025] grid h-80 place-items-center rounded-2xl'
      >
        <div className='flex flex-col items-center gap-1 px-6 text-center'>
          <p className='text-foreground text-2xl font-semibold text-balance sm:text-3xl'>
            Eight stops, one coastline
          </p>
          <p className='text-muted-foreground text-sm'>
            A field journal from the autumn trip
          </p>
        </div>
      </ImageTrail>
    </div>
  );
}
