import { Spotlight } from '@/components/core/spotlight';

export function SpotlightBorder() {
  return (
    <div className='bg-foreground/10 relative aspect-video h-[200px] overflow-hidden rounded-xl p-px'>
      <Spotlight
        className='from-foreground/60 via-foreground/40 to-foreground/20 blur-3xl'
        size={124}
      />
      <div className='bg-card relative h-full w-full rounded-xl'></div>
    </div>
  );
}
