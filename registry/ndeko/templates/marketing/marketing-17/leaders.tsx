import { cn } from '@/registry/ndeko/lib/utils';

import type { Pillar } from './data';

type LeaderStyle = React.CSSProperties & { '--row': string };

const SPINE_DELAY_MS = 150;

const BRANCH_DELAY_MS = 380;

const BRANCH_STEP_MS = 90;

const LEADERS_STYLE: LeaderStyle = { '--row': '2.75rem' };

function delayOf(milliseconds: number) {
  return { transitionDelay: `${milliseconds}ms` };
}

function branchDelayOf(index: number) {
  return delayOf(BRANCH_DELAY_MS + index * BRANCH_STEP_MS);
}

function labelDelayOf(index: number) {
  return delayOf(BRANCH_DELAY_MS + 200 + index * BRANCH_STEP_MS);
}

type LeadersProps = {
  pillar: Pillar;
};

/** The lines draw from the hexagon each time the pillar changes, because the keyed wrapper mounts again. */
export function Leaders({ pillar }: LeadersProps) {
  return (
    <div
      key={pillar.id}
      style={LEADERS_STYLE}
      className='relative [--spine:50%] @3xl:[--spine:2rem]'
    >
      <span
        aria-hidden='true'
        style={delayOf(0)}
        className={cn(
          'bg-foreground/60 absolute hidden h-px w-(--spine) origin-left transition-transform duration-300 ease-(--ease-out-strong) @3xl:top-1/2 @3xl:left-0 @3xl:block starting:scale-x-0'
        )}
      />
      <span
        aria-hidden='true'
        style={delayOf(0)}
        className='bg-foreground/60 absolute top-0 left-(--spine) h-[calc(var(--row)/2)] w-px origin-top transition-transform duration-200 ease-(--ease-out-strong) @3xl:hidden starting:scale-y-0'
      />
      <span
        aria-hidden='true'
        style={delayOf(SPINE_DELAY_MS)}
        className='bg-foreground/60 absolute top-[calc(var(--row)/2)] bottom-[calc(var(--row)/2)] left-(--spine) w-px origin-top transition-transform duration-[350ms] ease-(--ease-out-strong) starting:scale-y-0'
      />
      <ul className='flex flex-col'>
        {pillar.capabilities.map((capability, index) => (
          <li
            key={capability}
            className='relative flex h-(--row) items-center ps-[calc(var(--spine)+1.75rem)]'
          >
            <span
              aria-hidden='true'
              style={branchDelayOf(index)}
              className='bg-foreground/60 absolute left-(--spine) h-px w-6 origin-left transition-transform duration-200 ease-(--ease-out-strong) starting:scale-x-0'
            />
            <span
              style={labelDelayOf(index)}
              className='text-sm font-medium transition-[opacity,translate] duration-300 ease-(--ease-out-strong) @2xl:text-base starting:translate-x-1 starting:opacity-0'
            >
              {capability}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
