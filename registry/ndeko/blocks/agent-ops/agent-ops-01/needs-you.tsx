'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { MotionNumber } from '@/components/core/motion-number';
import {
  EASE_OUT_STRONG,
  rowPresenceOf,
} from '@/registry/ndeko/lib/motion-presets';
import { Button } from '@/registry/ndeko/ui/button';
import { LetterTile } from '@/registry/ndeko/ui/letter-tile';

import { agentOf, APPROVALS, type ApprovalId } from './data';
import type { Decision } from './session';

const CHECK_PATH = 'M5 10.4 8.6 14 15 6.6';

const DRAW = { duration: 0.5, ease: EASE_OUT_STRONG, delay: 0.12 };

const SETTLE = { duration: 0.3, ease: EASE_OUT_STRONG };

function pressedSolidOf(isPressed: boolean) {
  if (isPressed) {
    return 'scale-[0.94] bg-primary/85';
  }
  return undefined;
}

function strokeStartOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return { pathLength: 1 };
  }
  return { pathLength: 0 };
}

function markStartOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return { opacity: 0, scale: 1 };
  }
  return { opacity: 0, scale: 1.04 };
}

function CalmMark() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.span
      aria-hidden='true'
      initial={markStartOf(shouldReduceMotion)}
      animate={{ opacity: 1, scale: 1 }}
      transition={SETTLE}
      className='bg-success/10 text-success-foreground flex size-10 items-center justify-center rounded-full'
    >
      <svg viewBox='0 0 20 20' className='size-5'>
        <motion.path
          d={CHECK_PATH}
          fill='none'
          stroke='currentColor'
          strokeWidth='1.75'
          strokeLinecap='round'
          strokeLinejoin='round'
          initial={strokeStartOf(shouldReduceMotion)}
          animate={{ pathLength: 1 }}
          transition={DRAW}
        />
      </svg>
    </motion.span>
  );
}

type RequestRowProps = {
  approvalId: ApprovalId;
  pressed: string | null;
  onDecide: (approvalId: ApprovalId, decision: Decision) => void;
};

function RequestRow({ approvalId, pressed, onDecide }: RequestRowProps) {
  const approval = APPROVALS[approvalId];
  const agent = agentOf(approval.agentId);
  const isApprovePressed = pressed === `approve-${approvalId}`;

  return (
    <div className='flex flex-col gap-2.5 px-3 py-2.5 @xl:flex-row @xl:items-center @xl:gap-4'>
      <div className='flex min-w-0 flex-1 items-start gap-3'>
        <LetterTile initial={agent.initials} size='lg' />
        <div className='flex min-w-0 flex-col gap-0.5'>
          <p className='text-[13px] leading-5 font-medium text-pretty'>
            {approval.title}
          </p>
          <p className='text-muted-foreground text-xs'>
            {agent.name} · {approval.detail}
          </p>
        </div>
      </div>
      <div className='flex shrink-0 items-center gap-2 ps-10 @xl:ps-0'>
        <Button
          type='button'
          size='sm'
          aria-label={`Approve: ${approval.title}`}
          onClick={() => onDecide(approvalId, 'approved')}
          className={pressedSolidOf(isApprovePressed)}
        >
          Approve
        </Button>
        <Button
          type='button'
          size='sm'
          variant='outline'
          aria-label={`Deny: ${approval.title}`}
          onClick={() => onDecide(approvalId, 'denied')}
        >
          Deny
        </Button>
      </div>
    </div>
  );
}

type NeedsYouProps = {
  pending: ApprovalId[];
  pressed: string | null;
  onDecide: (approvalId: ApprovalId, decision: Decision) => void;
};

export function NeedsYou({ pending, pressed, onDecide }: NeedsYouProps) {
  const shouldReduceMotion = useReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const isEmpty = pending.length === 0;

  return (
    <section
      aria-label='Needs you'
      className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] flex flex-col rounded-xl p-1 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <header className='flex h-9 items-center gap-2 px-3'>
        <h2 className='text-sm font-medium'>Needs you</h2>
        <span className='bg-foreground/[0.06] text-muted-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-sm px-1.5 text-xs'>
          <MotionNumber value={pending.length} />
        </span>
      </header>
      <ul className='flex flex-col'>
        <AnimatePresence initial={false}>
          {pending.map((approvalId) => (
            <motion.li
              key={approvalId}
              className='overflow-hidden'
              {...rowPresence}
            >
              <RequestRow
                approvalId={approvalId}
                pressed={pressed}
                onDecide={onDecide}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <AnimatePresence initial={false}>
        {isEmpty && (
          <motion.div key='empty' className='overflow-hidden' {...rowPresence}>
            <div className='flex items-center gap-3 px-3 pt-1.5 pb-3'>
              <CalmMark />
              <div className='flex flex-col gap-0.5'>
                <p className='text-[13px] font-medium'>Nothing waits on you</p>
                <p className='text-muted-foreground text-xs'>
                  Agents ask here before they send or change anything
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
