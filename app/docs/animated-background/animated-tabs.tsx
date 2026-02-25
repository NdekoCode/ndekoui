import { AnimatedBackground } from '@/components/core/animated-background';
import {
  HomeIcon,
  PhoneIcon,
  SettingsIcon,
  UserIcon,
} from '@/registry/ndeko/lib/icons';

const TABS = [
  {
    label: 'Home',
    icon: <HomeIcon className='size-5' />,
  },
  {
    label: 'About',
    icon: <UserIcon className='size-5' />,
  },
  {
    label: 'Services',
    icon: <SettingsIcon className='size-5' />,
  },
  {
    label: 'Contact',
    icon: <PhoneIcon className='size-5' />,
  },
];

export function AnimatedTabs() {
  return (
    <div className='absolute bottom-8'>
      <div className='bg-card hairline-ring ring-border flex w-full space-x-2 rounded-xl p-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
        <AnimatedBackground
          defaultValue={TABS[0].label}
          className='bg-foreground/[0.06] rounded-lg'
          transition={{
            type: 'spring',
            bounce: 0.2,
            duration: 0.3,
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.label}
              data-id={tab.label}
              type='button'
              aria-label={tab.label}
              className='text-muted-foreground data-[checked=true]:text-foreground inline-flex size-9 items-center justify-center transition-colors duration-100 focus-visible:outline-2'
            >
              {tab.icon}
            </button>
          ))}
        </AnimatedBackground>
      </div>
    </div>
  );
}
