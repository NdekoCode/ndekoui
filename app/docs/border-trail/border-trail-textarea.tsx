import { BorderTrail } from '@/components/core/border-trail';

export function BorderTrailTextarea() {
  return (
    <div className='bg-card text-foreground hairline-ring ring-border relative h-[160px] w-[260px] overflow-hidden rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.05)]'>
      <textarea
        aria-label='Reply'
        placeholder='Reply to Léa about the launch date'
        className='placeholder:text-muted-foreground h-full w-full resize-none rounded-xl bg-transparent px-4 py-3 text-[13px] outline-hidden'
      />
      <BorderTrail
        className='via-foreground/60 bg-linear-to-l from-transparent to-transparent'
        size={120}
      />
    </div>
  );
}
