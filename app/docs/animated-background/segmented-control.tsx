import { AnimatedBackground } from '@/components/core/animated-background';

const EASE_IN_OUT_STRONG = [0.77, 0, 0.175, 1] as const;

const VIEWS = ['Day', 'Week', 'Month', 'Year'];

export function SegmentedControl() {
  return (
    <div className='bg-foreground/[0.05] rounded-lg p-0.5'>
      <AnimatedBackground
        defaultValue='Day'
        className='bg-card hairline-ring ring-foreground/10 dark:bg-foreground/[0.09] dark:ring-foreground/15 rounded-md shadow-[0_1px_2px_rgb(0_0_0/0.08)]'
        transition={{
          ease: EASE_IN_OUT_STRONG,
          duration: 0.2,
        }}
      >
        {VIEWS.map((label) => {
          return (
            <button
              key={label}
              data-id={label}
              type='button'
              aria-label={`${label} view`}
              className='text-foreground inline-flex h-7 w-20 items-center justify-center text-center text-[13px] font-medium transition-transform active:scale-[0.98]'
            >
              {label}
            </button>
          );
        })}
      </AnimatedBackground>
    </div>
  );
}
