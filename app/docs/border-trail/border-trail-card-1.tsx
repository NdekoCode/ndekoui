import { BorderTrail } from '@/components/core/border-trail';

const SKELETON_WIDTHS = ['w-4', 'w-10', 'w-12', 'w-12', 'w-12'];

export function BorderTrailCard1() {
  return (
    <div className='bg-card hairline-ring ring-border relative flex h-[200px] w-[300px] flex-col items-center justify-center rounded-xl px-5 py-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <BorderTrail
        className='bg-foreground/40'
        style={{
          boxShadow:
            '0 0 32px 12px color-mix(in oklab, var(--foreground) 10%, transparent)',
        }}
        size={100}
      />
      <div
        className='flex h-full animate-pulse flex-col items-start justify-center space-y-2'
        role='status'
        aria-label='Loading the weekly report'
      >
        {SKELETON_WIDTHS.map((width, index) => (
          <div
            key={`${width}-${index}`}
            className={`bg-foreground/15 h-1 rounded-full ${width}`}
          />
        ))}
      </div>
    </div>
  );
}
