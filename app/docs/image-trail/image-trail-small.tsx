import { ImageTrail } from '@/components/core/image-trail';

const SCENES = [
  { src: '/images/scenes/scene-03.svg' },
  { src: '/images/scenes/scene-05.svg' },
  { src: '/images/scenes/scene-07.svg' },
  { src: '/images/scenes/scene-01.svg' },
];

export function ImageTrailSmall() {
  return (
    <div className='w-full px-4 py-8'>
      <ImageTrail
        images={SCENES}
        maxVisible={10}
        distance={36}
        lifetime={500}
        imageClassName='size-16 rounded-lg'
        className='bg-foreground/[0.025] grid h-72 place-items-center rounded-2xl'
      >
        <p className='text-foreground text-lg font-medium'>
          Short trail, small tiles
        </p>
      </ImageTrail>
    </div>
  );
}
