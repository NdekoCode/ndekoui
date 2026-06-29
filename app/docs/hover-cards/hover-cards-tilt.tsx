import { HoverEffectCard } from '@/components/core/hover-cards';
import { CompassIcon } from '@/registry/ndeko/lib/icons';

export function HoverCardsTilt() {
  return (
    <HoverEffectCard
      effect='tilt'
      href='#'
      className='w-full max-w-72'
      title='Night walk on the Calder ridge'
      description='A guided route of 11 km with a stop at the old lookout'
      image={{
        src: '/images/scenes/scene-07.svg',
        alt: 'Flat illustration of dark hills under the moon at night',
      }}
      meta={
        <>
          <CompassIcon className='size-3.5' />
          <span>Starts at the north car park</span>
        </>
      }
    />
  );
}
