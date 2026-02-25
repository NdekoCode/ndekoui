import { AnimatedBackground } from '@/components/core/animated-background';

const TABS = ['Home', 'About', 'Services', 'Contact'];

export function AnimatedTabsHover() {
  return (
    <div className='flex flex-row'>
      <AnimatedBackground
        defaultValue={TABS[0]}
        className='bg-foreground/[0.06] rounded-md'
        transition={{
          type: 'spring',
          bounce: 0.2,
          duration: 0.3,
        }}
        enableHover
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            data-id={tab}
            type='button'
            className='text-muted-foreground hover:text-foreground px-2.5 py-1 text-[13px] font-medium transition-colors duration-300'
          >
            {tab}
          </button>
        ))}
      </AnimatedBackground>
    </div>
  );
}
