'use client';

import { motion, useReducedMotion, type Transition } from 'motion/react';
import { useId } from 'react';

import type { Member, Period } from './data';
import {
  formatMinutes,
  IssueTypeGem,
  PresenceAvatar,
  ROLE_LABELS,
  SlidingFigure,
} from './parts';

const WEEK_TARGET_MINUTES = 2400;

const TRAVEL: Transition = { type: 'spring', bounce: 0, duration: 0.3 };

const INSTANT: Transition = { duration: 0 };

function travelOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return TRAVEL;
}

function shareOf(minutes: number) {
  const share = minutes / WEEK_TARGET_MINUTES;
  return Math.min(1, share);
}

function MemberTaskCell({ member }: { member: Member }) {
  const task = member.task;
  if (!task) {
    return (
      <span className='text-muted-foreground text-xs'>No task in progress</span>
    );
  }
  return (
    <span className='flex min-w-0 items-center gap-1.5'>
      <IssueTypeGem type={task.type} />
      <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
        {task.key}
      </span>
      <span className='truncate text-[13px]'>{task.title}</span>
    </span>
  );
}

type MemberRowProps = {
  member: Member;
  period: Period;
  isSelected: boolean;
  indicatorId: string;
  onToggle: (memberId: string) => void;
};

function MemberRow({
  member,
  period,
  isSelected,
  indicatorId,
  onToggle,
}: MemberRowProps) {
  const shouldReduceMotion = useReducedMotion();
  const minutes = member.minutes[period];
  const share = shareOf(minutes);
  const barStyle = { transform: `scaleX(${share})` };

  return (
    <li className='relative'>
      {isSelected && (
        <motion.span
          layoutId={indicatorId}
          aria-hidden='true'
          transition={travelOf(shouldReduceMotion)}
          className='bg-foreground/[0.05] absolute inset-0 rounded-lg'
        />
      )}
      <button
        type='button'
        aria-pressed={isSelected}
        onClick={() => onToggle(member.id)}
        className='hover:bg-foreground/[0.03] focus-visible:ring-ring/25 relative grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_5.5rem] items-center gap-x-4 gap-y-1 rounded-lg px-3 py-2.5 text-left outline-none focus-visible:ring-[3px] md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_7rem]'
      >
        <span className='flex min-w-0 items-center gap-3'>
          <PresenceAvatar member={member} />
          <span className='min-w-0'>
            <span className='block truncate text-[13px] leading-5 font-medium'>
              {member.name}
            </span>
            <span className='text-muted-foreground block truncate text-xs'>
              {ROLE_LABELS[member.role]} · {member.title}
            </span>
          </span>
        </span>
        <span className='col-span-2 row-start-2 min-w-0 ps-11 md:col-span-1 md:row-start-1 md:ps-0'>
          <MemberTaskCell member={member} />
        </span>
        <span className='flex flex-col items-end gap-1.5'>
          <SlidingFigure
            value={minutes}
            format={formatMinutes}
            className='text-[13px] font-medium'
          />
          <span
            aria-hidden='true'
            className='bg-foreground/[0.06] block h-1 w-full overflow-hidden rounded-full'
          >
            <span
              style={barStyle}
              className='bg-primary block h-full origin-left rounded-full transition-transform duration-300 ease-(--ease-out-strong)'
            />
          </span>
        </span>
      </button>
    </li>
  );
}

type MemberListProps = {
  members: Member[];
  period: Period;
  selectedId: string | null;
  onToggle: (memberId: string) => void;
};

export function MemberList({
  members,
  period,
  selectedId,
  onToggle,
}: MemberListProps) {
  const indicatorId = useId();

  return (
    <ul aria-label='Members' className='flex flex-col'>
      {members.map((member) => (
        <MemberRow
          key={member.id}
          member={member}
          period={period}
          isSelected={member.id === selectedId}
          indicatorId={indicatorId}
          onToggle={onToggle}
        />
      ))}
    </ul>
  );
}
