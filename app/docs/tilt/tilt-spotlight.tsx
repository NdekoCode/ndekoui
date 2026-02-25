import { Spotlight } from '@/components/core/spotlight';
import { Tilt } from '@/components/core/tilt';

export function TiltSpotlight() {
  return (
    <div className='aspect-video max-w-sm'>
      <Tilt
        rotationFactor={6}
        isRevese
        style={{
          transformOrigin: 'center center',
        }}
        springOptions={{
          stiffness: 26.7,
          damping: 4.1,
          mass: 0.2,
        }}
        className='group relative rounded-lg'
      >
        <Spotlight
          className='z-10 from-white/50 via-white/20 to-white/10 blur-2xl'
          size={248}
          springOptions={{
            stiffness: 26.7,
            damping: 4.1,
            mass: 0.2,
          }}
        />
        <div
          role='img'
          aria-label='Poster of Low Orbit: a planet, its ring and a small moon, in flat shapes.'
          className='bg-primary/10 relative h-32 w-full overflow-hidden rounded-lg grayscale duration-700 group-hover:grayscale-0'
        >
          <div className='bg-primary/50 absolute top-6 left-1/2 size-20 -translate-x-1/2 rounded-full' />
          <div className='bg-primary/30 absolute top-[3.75rem] left-1/2 h-2 w-44 -translate-x-1/2 rounded-full' />
          <div className='bg-primary/40 absolute top-5 right-16 size-4 rounded-full' />
        </div>
      </Tilt>
      <div className='flex flex-col space-y-0.5 pt-3 pb-0'>
        <h3 className='text-muted-foreground text-sm font-medium'>Low Orbit</h3>
        <p className='text-foreground text-sm'>Directed by Léa Moreau</p>
      </div>
    </div>
  );
}
