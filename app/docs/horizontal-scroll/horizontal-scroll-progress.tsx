'use client';
import { useRef } from 'react';
import { HorizontalScroll } from '@/components/core/horizontal-scroll';
import {
  BellIcon,
  CalendarIcon,
  CreditCardIcon,
  type Icon,
  StoreIcon,
  UsersIcon,
} from '@/registry/ndeko/lib/icons';

type Step = {
  title: string;
  description: string;
  icon: Icon;
};

const STEPS: Step[] = [
  {
    title: 'Draw the street',
    description:
      'Place every pitch on the map of the street, with its size and whether it is covered',
    icon: StoreIcon,
  },
  {
    title: 'Pick the Saturdays',
    description:
      'Choose the market days of the season and the time traders can set up',
    icon: CalendarIcon,
  },
  {
    title: 'Invite the traders',
    description:
      'Send one link to last season’s traders, who keep their usual pitch',
    icon: UsersIcon,
  },
  {
    title: 'Collect the fees',
    description:
      'Traders pay at the end of the week, once they have seen the forecast',
    icon: CreditCardIcon,
  },
  {
    title: 'Plan for rain',
    description:
      'One switch moves everyone to a covered pitch and sends them the new time',
    icon: BellIcon,
  },
];

function StepCard({
  step,
  number,
  total,
}: {
  step: Step;
  number: number;
  total: number;
}) {
  const Glyph = step.icon;

  return (
    <article className='bg-foreground/[0.04] flex h-[220px] w-[232px] shrink-0 flex-col justify-between rounded-xl p-4'>
      <div className='flex items-center justify-between'>
        <span className='gem-plate grid size-8 place-items-center rounded-md [--gem:var(--primary)]'>
          <Glyph className='size-4' />
        </span>
        <span className='text-muted-foreground text-xs tabular-nums'>
          Step {number} of {total}
        </span>
      </div>
      <div className='flex flex-col gap-1'>
        <h3 className='text-foreground text-sm font-medium'>{step.title}</h3>
        <p className='text-muted-foreground text-[13px]'>{step.description}</p>
      </div>
    </article>
  );
}

export function HorizontalScrollProgress() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className='relative h-[440px] w-full overflow-y-auto rounded-xl'
    >
      <div className='flex h-[200px] flex-col items-center justify-center gap-1 px-6 text-center'>
        <h2 className='text-foreground text-base font-semibold text-balance'>
          Open a market season in five steps
        </h2>
        <p className='text-muted-foreground text-[13px]'>
          Harbor Lane organisers set it up on a Sunday evening
        </p>
      </div>
      <HorizontalScroll
        containerRef={containerRef}
        frameClassName='h-[440px]'
        showProgress
        aria-label='Steps to open a market season'
      >
        {STEPS.map((step, index) => {
          const number = index + 1;

          return (
            <StepCard
              key={step.title}
              step={step}
              number={number}
              total={STEPS.length}
            />
          );
        })}
      </HorizontalScroll>
      <div className='text-muted-foreground flex h-[200px] items-center justify-center text-[13px]'>
        The season is open
      </div>
    </div>
  );
}
