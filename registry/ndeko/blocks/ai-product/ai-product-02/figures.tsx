'use client';

import { MotionNumber } from '@/components/core/motion-number';

import { TODAY } from './data';

const MONEY: Intl.NumberFormatOptions = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

function shownOf(isRolled: boolean, value: number) {
  if (isRolled) {
    return value;
  }
  return 0;
}

type FigureProps = {
  label: string;
  children: React.ReactNode;
};

function Figure({ label, children }: FigureProps) {
  return (
    <li className='bg-foreground/[0.03] flex min-w-0 flex-col gap-1 rounded-xl p-4'>
      <p className='text-muted-foreground truncate text-[13px]'>{label}</p>
      <p className='flex text-2xl font-semibold'>{children}</p>
    </li>
  );
}

type FiguresProps = {
  /** The counts roll up from zero the first time the page is seen. */
  isRolled: boolean;
  waiting: number;
};

export function Figures({ isRolled, waiting }: FiguresProps) {
  return (
    <ul aria-label='Today' className='grid grid-cols-2 gap-3 @3xl:grid-cols-4'>
      <Figure label='Runs today'>
        <MotionNumber value={shownOf(isRolled, TODAY.runs)} />
      </Figure>
      <Figure label='Tasks finished'>
        <MotionNumber value={shownOf(isRolled, TODAY.finished)} />
      </Figure>
      <Figure label='Waiting on you'>
        <MotionNumber value={waiting} />
      </Figure>
      <Figure label='Spent today'>
        <MotionNumber
          value={shownOf(isRolled, TODAY.spentUsd)}
          prefix='$'
          format={MONEY}
        />
      </Figure>
    </ul>
  );
}
