'use client';

import { motion, useReducedMotion, type Transition } from 'motion/react';
import { useEffect, useId, useRef, useState } from 'react';

import { CheckIcon, LoaderIcon, PlusIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

import { AvatarStack } from './_parts/avatar-stack';
import { MEMBERS, memberById } from './_parts/people';
import { SlidingCount } from './_parts/sliding-count';
import { Swap } from './_parts/swap';
import { TeamTile } from './_parts/team-tile';
import { TEAMS, memberCountLabelOf } from './_parts/teams';

type JoinState = 'idle' | 'joining' | 'joined';

const JOIN_DELAY_MS = 800;

const MORPH: Transition = { type: 'spring', bounce: 0, duration: 0.3 };

const INSTANT: Transition = { duration: 0 };

const TEAM = TEAMS[1];

const TEAM_MEMBERS = TEAM.memberIds.map(memberById);

const YOU = MEMBERS[0];

function morphOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return MORPH;
}

function joinLabelOf(state: JoinState) {
  if (state === 'joining') {
    return 'Joining';
  }
  if (state === 'joined') {
    return 'Joined';
  }
  return 'Join team';
}

function joinVariantOf(state: JoinState) {
  if (state === 'joined') {
    return 'outline' as const;
  }
  return 'default' as const;
}

function membersOf(isJoined: boolean) {
  if (isJoined) {
    return [YOU, ...TEAM_MEMBERS];
  }
  return TEAM_MEMBERS;
}

function JoinGlyph({ state }: { state: JoinState }) {
  return (
    <Swap swapKey={state}>
      {state === 'idle' && <PlusIcon />}
      {state === 'joining' && <LoaderIcon className='animate-spin' />}
      {state === 'joined' && <CheckIcon />}
    </Swap>
  );
}

function useDelayedJoin(onJoined: () => void) {
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

export default function Teams01() {
  const shouldReduceMotion = useReducedMotion();
  const nameId = useId();
  const [joinState, setJoinState] = useState<JoinState>('idle');
  const isJoined = joinState === 'joined';
  const members = membersOf(isJoined);
  const extraCount = TEAM.memberCount - TEAM_MEMBERS.length;
  const memberCount = members.length + extraCount;
  const morph = morphOf(shouldReduceMotion);

  function markJoined() {
    setJoinState('joined');
  }

  const startJoining = useDelayedJoin(markJoined);

  function toggleJoin() {
    if (joinState === 'joining') {
      return;
    }
    if (isJoined) {
      setJoinState('idle');
      return;
    }
    setJoinState('joining');
    startJoining();
  }

  return (
    <article
      aria-labelledby={nameId}
      className='bg-card hairline-ring ring-border flex w-full max-w-[24rem] flex-col gap-4 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <div className='flex items-start gap-3'>
        <TeamTile initials={TEAM.initials} color={TEAM.color} size='lg' />
        <div className='min-w-0 flex-1'>
          <h3 id={nameId} className='text-sm font-medium'>
            {TEAM.name}
          </h3>
          <p className='text-muted-foreground text-xs'>Mobile team · Public</p>
        </div>
        <Button
          size='sm'
          variant={joinVariantOf(joinState)}
          aria-pressed={isJoined}
          onClick={toggleJoin}
        >
          <JoinGlyph state={joinState} />
          <motion.span layout transition={morph}>
            {joinLabelOf(joinState)}
          </motion.span>
        </Button>
      </div>
      <p className='text-muted-foreground text-[13px] leading-5'>
        Builds the field app that inspectors use offline, from the visit
        checklist to the photo sync.
      </p>
      <div className='flex flex-wrap items-end justify-between gap-x-6 gap-y-3'>
        <div className='flex items-center gap-2'>
          <AvatarStack members={members} limit={4} extraCount={extraCount} />
          <SlidingCount
            value={memberCount}
            format={memberCountLabelOf}
            className='text-muted-foreground text-xs'
          />
        </div>
        <dl className='flex gap-5'>
          <div className='flex flex-col'>
            <dt className='text-muted-foreground text-xs'>Open tasks</dt>
            <dd className='text-[13px] font-medium tabular-nums'>9</dd>
          </div>
          <div className='flex flex-col'>
            <dt className='text-muted-foreground text-xs'>This week</dt>
            <dd className='text-[13px] font-medium tabular-nums'>27h 45m</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
