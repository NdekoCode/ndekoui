'use client';

import { AnimatePresence, motion, type Transition } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  ArrowRightIcon,
  LoaderIcon,
  RotateCcwIcon,
} from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';
import { Button } from '@/registry/ndeko/ui/button';
import { StatusOrb } from '@/registry/ndeko/ui/status-orb';

import { PEOPLE, type Person } from './_parts/people';
import { SenderAvatar } from './_parts/sender-avatar';

type InviteState = 'pending' | 'joining' | 'joined' | 'declined';

const JOIN_DELAY_MS = 900;

const TEAM_MEMBERS: Person[] = [
  PEOPLE.amara,
  PEOPLE.leo,
  PEOPLE.mei,
  PEOPLE.tomas,
];

const MORPH: Transition = { type: 'spring', bounce: 0, duration: 0.3 };

const INSTANT: Transition = { duration: 0 };

const BLUR_IN: Transition = { duration: 0.18, ease: [0.23, 1, 0.32, 1] };

const BLUR_OUT: Transition = { duration: 0.12, ease: [0.23, 1, 0.32, 1] };

function resultKeyOf(state: InviteState) {
  if (state === 'joined') {
    return 'joined';
  }
  if (state === 'declined') {
    return 'declined';
  }
  return 'actions';
}

function morphOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return MORPH;
}

function acceptLabelOf(state: InviteState) {
  if (state === 'joining') {
    return 'Joining';
  }
  return 'Accept';
}

function MemberStack({ members }: { members: Person[] }) {
  return (
    <span className='flex -space-x-1.5'>
      {members.map((member) => (
        <Avatar key={member.id} className='ring-card size-5 text-[9px] ring-2'>
          {member.avatar && <AvatarImage src={member.avatar} alt='' />}
          <AvatarFallback>{member.initials}</AvatarFallback>
        </Avatar>
      ))}
    </span>
  );
}

function TeamChip() {
  return (
    <span className='bg-foreground/[0.03] hairline-ring ring-border inline-flex items-center gap-2 rounded-lg py-1.5 ps-1.5 pe-2.5'>
      <span className='gem-plate flex size-6 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold [--gem:var(--info)]'>
        AR
      </span>
      <span className='flex flex-col'>
        <span className='text-[13px] leading-4 font-medium'>
          Atlas Redesign
        </span>
        <span className='text-muted-foreground text-xs leading-4'>
          Design team · 6 members
        </span>
      </span>
      <span className='ms-2'>
        <MemberStack members={TEAM_MEMBERS} />
      </span>
    </span>
  );
}

type ActionsProps = {
  state: InviteState;
  onAccept: () => void;
  onDecline: () => void;
};

function InviteActions({ state, onAccept, onDecline }: ActionsProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const morph = morphOf(shouldReduceMotion);
  const isJoining = state === 'joining';
  const acceptLabel = acceptLabelOf(state);

  return (
    <div className='flex gap-2'>
      <Button
        size='sm'
        variant='outline'
        disabled={isJoining}
        onClick={onDecline}
      >
        Decline
      </Button>
      <Button size='sm' onClick={onAccept} aria-disabled={isJoining}>
        <AnimatePresence initial={false}>
          {isJoining && (
            <motion.span
              key='spinner'
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={morph}
              className='-ms-0.5 flex overflow-hidden'
            >
              <LoaderIcon className='animate-spin' />
            </motion.span>
          )}
        </AnimatePresence>
        <motion.span layout transition={morph}>
          {acceptLabel}
        </motion.span>
      </Button>
    </div>
  );
}

function JoinedResult({ onUndo }: { onUndo: () => void }) {
  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center gap-2.5'>
        <StatusOrb tone='success' size='sm' />
        <p className='text-[13px] leading-5'>
          You joined <span className='font-medium'>Atlas Redesign</span>
        </p>
      </div>
      <div className='flex gap-2'>
        <Button size='sm' variant='outline'>
          Open team
          <ArrowRightIcon />
        </Button>
        <Button variant='ghost' size='sm' onClick={onUndo}>
          <RotateCcwIcon />
          Undo
        </Button>
      </div>
    </div>
  );
}

function DeclinedResult({ onUndo }: { onUndo: () => void }) {
  return (
    <div className='flex items-center gap-2.5'>
      <StatusOrb tone='neutral' size='sm' />
      <p className='text-muted-foreground text-[13px] leading-5'>
        Invite declined, Amara will be told
      </p>
      <Button variant='ghost' size='sm' onClick={onUndo} className='ms-auto'>
        <RotateCcwIcon />
        Undo
      </Button>
    </div>
  );
}

function useJoinTimer(onJoined: () => void) {
  const timer = useRef<number | null>(null);
  const onJoinedRef = useRef(onJoined);

  useEffect(() => {
    onJoinedRef.current = onJoined;
  }, [onJoined]);

  useEffect(() => {
    return () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
      }
    };
  }, []);

  function start() {
    timer.current = window.setTimeout(() => {
      timer.current = null;
      onJoinedRef.current();
    }, JOIN_DELAY_MS);
  }

  return start;
}

export default function Notification26() {
  const [state, setState] = useState<InviteState>('pending');
  const resultKey = resultKeyOf(state);
  const isAnswered = resultKey !== 'actions';

  function markJoined() {
    setState('joined');
  }

  const startJoining = useJoinTimer(markJoined);

  function accept() {
    if (state !== 'pending') {
      return;
    }
    setState('joining');
    startJoining();
  }

  function decline() {
    setState('declined');
  }

  function undo() {
    setState('pending');
  }

  return (
    <article
      aria-label='Invitation from Amara Okafor'
      className='bg-card hairline-ring ring-border flex w-full max-w-[26rem] items-start gap-3 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <SenderAvatar person={PEOPLE.amara} kind='invite' />
      <div className='flex min-w-0 flex-1 flex-col gap-3'>
        <div className='flex flex-col gap-0.5'>
          <p className='text-muted-foreground text-[13px] leading-5'>
            <span className='text-foreground font-medium'>Amara Okafor</span>{' '}
            invited you to join a team as a{' '}
            <span className='text-foreground font-medium'>Member</span>
          </p>
          <p className='text-muted-foreground text-xs tabular-nums'>2m</p>
        </div>
        <div>
          <TeamChip />
        </div>
        <AnimatedSize>
          <div aria-live='polite' className='relative'>
            <AnimatePresence mode='popLayout' initial={false}>
              <motion.div
                key={resultKey}
                initial={{ opacity: 0, filter: 'blur(2px)' }}
                animate={{
                  opacity: 1,
                  filter: 'blur(0px)',
                  transition: BLUR_IN,
                }}
                exit={{ opacity: 0, filter: 'blur(2px)', transition: BLUR_OUT }}
              >
                {!isAnswered && (
                  <InviteActions
                    state={state}
                    onAccept={accept}
                    onDecline={decline}
                  />
                )}
                {state === 'joined' && <JoinedResult onUndo={undo} />}
                {state === 'declined' && <DeclinedResult onUndo={undo} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </AnimatedSize>
      </div>
    </article>
  );
}
