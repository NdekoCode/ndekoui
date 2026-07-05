'use client';

import { MotionNumber } from '@/components/core/motion-number';
import { Badge } from '@/registry/ndeko/ui/badge';
import { CallStatusMark } from '@/registry/ndeko/ui/call-status';
import { LiveDuration } from '@/registry/ndeko/ui/live-duration';

import { CHECKS, type CheckId } from './data';
import { passedCountOf, type Check } from './session';

function fillOf(passed: number) {
  const share = passed / CHECKS.length;
  return { transform: `scaleX(${share})` };
}

function CheckRow({ name, check }: { name: string; check: Check }) {
  const isRunning = check.status === 'running';
  const isRerun = check.attempt > 1;

  return (
    <li className='flex h-9 items-center gap-2.5 text-[13px]'>
      <CallStatusMark status={check.status} />
      <span className='min-w-0 flex-1 truncate'>{name}</span>
      {isRerun && (
        <Badge
          variant='secondary'
          className='transition-opacity duration-300 starting:opacity-0'
        >
          Run {check.attempt}
        </Badge>
      )}
      <LiveDuration
        item={check}
        isRunning={isRunning}
        className='text-muted-foreground w-10 shrink-0 text-end text-xs'
      />
    </li>
  );
}

type ChecksBoxProps = {
  checks: Record<CheckId, Check> | null;
};

export function ChecksBox({ checks }: ChecksBoxProps) {
  const passed = passedCountOf(checks);

  return (
    <section aria-label='Checks' className='flex flex-col gap-3'>
      <div className='flex items-end justify-between gap-3'>
        <h3 className='text-sm font-medium'>Checks</h3>
        <p className='text-muted-foreground text-xs'>
          <MotionNumber
            value={passed}
            className='text-foreground text-xl leading-none font-semibold'
          />{' '}
          of {CHECKS.length} passed
        </p>
      </div>
      <div
        role='progressbar'
        aria-label='Checks passed'
        aria-valuemin={0}
        aria-valuemax={CHECKS.length}
        aria-valuenow={passed}
        className='bg-foreground/[0.06] h-1.5 overflow-hidden rounded-full'
      >
        <div
          style={fillOf(passed)}
          className='bg-success h-full origin-left rounded-full transition-transform duration-500 ease-(--ease-out-strong)'
        />
      </div>
      {!checks && (
        <p className='text-muted-foreground text-[13px]'>
          Checks start when the pull request opens
        </p>
      )}
      {checks && (
        <ul className='flex flex-col'>
          {CHECKS.map((check) => (
            <CheckRow
              key={check.id}
              name={check.name}
              check={checks[check.id]}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
