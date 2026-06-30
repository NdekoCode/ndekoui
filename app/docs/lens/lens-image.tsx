import { Lens } from '@/components/core/lens';

export function LensImage() {
  return (
    <div className='w-full max-w-md p-4'>
      <Lens zoom={2.5} label='Magnifier over a landscape at dusk'>
        {/* eslint-disable-next-line @next/next/no-img-element -- registry items land in any React app, where next/image may not exist */}
        <img
          src='/images/scenes/scene-05.svg'
          alt='Flat landscape of hills under a low sun'
          className='aspect-[3/2] w-full object-cover'
          draggable={false}
        />
      </Lens>
    </div>
  );
}
