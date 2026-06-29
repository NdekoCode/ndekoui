import { ImageTrail } from '@/components/core/image-trail';

const SCENES = [
  { src: '/images/scenes/scene-02.svg' },
  { src: '/images/scenes/scene-04.svg' },
  { src: '/images/scenes/scene-06.svg' },
  { src: '/images/scenes/scene-08.svg' },
  { src: '/images/scenes/scene-01.svg' },
  { src: '/images/scenes/scene-03.svg' },
];

export function ImageTrailStack() {
  return (
    <div className='w-full px-4 py-8'>
      <ImageTrail
        images={SCENES}
        persist
        maxVisible={6}
        distance={110}
        imageClassName='h-36 w-52 rounded-xl'
        className='bg-foreground/[0.025] grid h-80 place-items-center rounded-2xl'
      >
        <div className='flex flex-col items-center gap-1 px-6 text-center'>
          <p className='text-foreground text-2xl font-semibold text-balance sm:text-3xl'>
            The mood board for spring
          </p>
          <p className='text-muted-foreground text-sm'>
            The last six pictures stay where they landed
          </p>
        </div>
      </ImageTrail>
    </div>
  );
}
