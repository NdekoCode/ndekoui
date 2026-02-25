import { Tilt } from '@/components/core/tilt';
import { FilmIcon } from '@/registry/ndeko/lib/icons';

export function TiltCard1() {
  return (
    <Tilt rotationFactor={8} isRevese>
      <div className='hairline-ring ring-border bg-card flex max-w-[270px] flex-col overflow-hidden rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
        <div
          role='img'
          aria-label='Still from Night Ferry: a full moon over two bands of water, in flat shapes.'
          className='bg-primary/10 relative h-48 w-full overflow-hidden'
        >
          <div className='bg-primary/45 absolute top-8 right-10 size-16 rounded-full' />
          <div className='bg-primary/20 absolute bottom-14 left-0 h-6 w-full' />
          <div className='bg-primary/30 absolute bottom-0 left-0 h-14 w-full' />
          <span className='gem-plate absolute bottom-4 left-4 grid size-8 place-items-center rounded-lg [--gem:var(--primary)]'>
            <FilmIcon className='size-4' />
          </span>
        </div>
        <div className='p-3'>
          <h3 className='text-foreground text-sm leading-snug font-medium'>
            Night Ferry
          </h3>
          <p className='text-muted-foreground text-xs'>Short film, 2026</p>
        </div>
      </div>
    </Tilt>
  );
}
