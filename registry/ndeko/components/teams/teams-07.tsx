'use client';

import { motion, type Transition } from 'motion/react';
import { useEffect, useRef, useState, type Ref } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  ArrowLeftIcon,
  CheckIcon,
  CopyIcon,
  InfoIcon,
  MailIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

import { memberById, PRESENCE_META, ROLE_META } from './_parts/people';
import { PresenceAvatar } from './_parts/presence-avatar';
import { Swap } from './_parts/swap';
import { TeamTile } from './_parts/team-tile';
import { TEAMS } from './_parts/teams';

const MEMBER = memberById('leo');

const MEMBER_TEAMS = TEAMS.filter((team) => team.memberIds.includes(MEMBER.id));

const WEEK_MINUTES = 1885;
const WEEK_TARGET_MINUTES = 2400;
const COPIED_RESET_MS = 1600;

const FLIP: Transition = { type: 'spring', bounce: 0, duration: 0.5 };
const FADE: Transition = { duration: 0.15, ease: [0.23, 1, 0.32, 1] };

const FACE =
  'bg-card hairline-ring ring-border absolute inset-0 flex flex-col rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] [backface-visibility:hidden]';

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const restText = String(rest);
  const paddedRest = restText.padStart(2, '0');
  return `${hours}h ${paddedRest}m`;
}

function weekShareOf(minutes: number, target: number) {
  const share = minutes / target;
  return Math.min(1, share);
}

function inertOf(isHidden: boolean) {
  if (isHidden) {
    return true;
  }
  return undefined;
}

function copyLabelOf(isCopied: boolean) {
  if (isCopied) {
    return 'Email copied';
  }
  return 'Copy email';
}

type FaceMotion = {
  front: { rotateY: number; opacity: number };
  back: { rotateY: number; opacity: number };
  transition: Transition;
};

function faceMotionOf(isFlipped: boolean, shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return reducedFacesOf(isFlipped);
  }
  return flippedFacesOf(isFlipped);
}

function flippedFacesOf(isFlipped: boolean): FaceMotion {
  if (isFlipped) {
    return {
      front: { rotateY: -180, opacity: 1 },
      back: { rotateY: 0, opacity: 1 },
      transition: FLIP,
    };
  }
  return {
    front: { rotateY: 0, opacity: 1 },
    back: { rotateY: 180, opacity: 1 },
    transition: FLIP,
  };
}

function reducedFacesOf(isFlipped: boolean): FaceMotion {
  if (isFlipped) {
    return {
      front: { rotateY: 0, opacity: 0 },
      back: { rotateY: 0, opacity: 1 },
      transition: FADE,
    };
  }
  return {
    front: { rotateY: 0, opacity: 1 },
    back: { rotateY: 0, opacity: 0 },
    transition: FADE,
  };
}

type FaceProps = {
  onFlip: () => void;
  flipButtonRef: Ref<HTMLButtonElement>;
};

function FrontFace({ onFlip, flipButtonRef }: FaceProps) {
  const role = ROLE_META[MEMBER.role];
  const roleStyle = { '--chip': role.color } as React.CSSProperties;

  return (
    <>
      <div className='flex flex-1 flex-col items-center justify-center gap-2 text-center'>
        <PresenceAvatar member={MEMBER} size='lg' />
        <div>
          <p className='text-sm font-medium'>{MEMBER.name}</p>
          <p className='text-muted-foreground text-xs'>{MEMBER.title}</p>
        </div>
        <span
          style={roleStyle}
          className='chip-3d inline-flex h-5 items-center rounded-md px-1.5 text-xs font-medium'
        >
          {role.label}
        </span>
      </div>
      <div className='flex gap-2'>
        <Button
          size='sm'
          variant='outline'
          className='flex-1'
          render={<a href={`mailto:${MEMBER.email}`} />}
          nativeButton={false}
        >
          <MailIcon />
          Message
        </Button>
        <Button
          ref={flipButtonRef}
          size='sm'
          variant='outline'
          className='flex-1'
          onClick={onFlip}
        >
          <InfoIcon />
          Details
        </Button>
      </div>
    </>
  );
}

function BackFace({ onFlip, flipButtonRef }: FaceProps) {
  const [isCopied, setIsCopied] = useState(false);
  const share = weekShareOf(WEEK_MINUTES, WEEK_TARGET_MINUTES);
  const barStyle = { transform: `scaleX(${share})` };
  const presence = PRESENCE_META[MEMBER.presence];

  function copyEmail() {
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), COPIED_RESET_MS);
  }

  return (
    <>
      <div className='flex items-center gap-2'>
        <Button
          ref={flipButtonRef}
          variant='ghost'
          size='icon-sm'
          aria-label='Back to the card'
          onClick={onFlip}
          className='text-muted-foreground -ms-1.5'
        >
          <ArrowLeftIcon />
        </Button>
        <p className='text-[13px] font-medium'>{MEMBER.name}</p>
        <p className='text-muted-foreground ms-auto text-xs'>
          {presence.label}
        </p>
      </div>
      <dl className='mt-3 flex flex-1 flex-col gap-3 text-[13px]'>
        <div className='flex items-center justify-between gap-2'>
          <dt className='text-muted-foreground text-xs'>Email</dt>
          <dd className='flex min-w-0 items-center gap-1'>
            <span className='truncate'>{MEMBER.email}</span>
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label={copyLabelOf(isCopied)}
              onClick={copyEmail}
              className='text-muted-foreground size-6'
            >
              <Swap swapKey={String(isCopied)}>
                {isCopied && (
                  <CheckIcon className='text-success-foreground size-3.5' />
                )}
                {!isCopied && <CopyIcon className='size-3.5' />}
              </Swap>
            </Button>
          </dd>
        </div>
        <div className='flex items-center justify-between gap-2'>
          <dt className='text-muted-foreground text-xs'>Local time</dt>
          <dd className='tabular-nums'>14:32 in Lisbon</dd>
        </div>
        <div className='flex items-center justify-between gap-2'>
          <dt className='text-muted-foreground text-xs'>Teams</dt>
          <dd className='flex items-center gap-1'>
            {MEMBER_TEAMS.map((team) => (
              <span key={team.id} title={team.name} className='flex'>
                <TeamTile name={team.name} color={team.color} size='sm' />
                <span className='sr-only'>{team.name}</span>
              </span>
            ))}
          </dd>
        </div>
        <div className='flex flex-col gap-1.5'>
          <div className='flex items-center justify-between gap-2'>
            <dt className='text-muted-foreground text-xs'>This week</dt>
            <dd className='tabular-nums'>
              {formatMinutes(WEEK_MINUTES)}{' '}
              <span className='text-muted-foreground'>of 40h</span>
            </dd>
          </div>
          <div
            aria-hidden='true'
            className='bg-foreground/[0.06] h-1.5 overflow-hidden rounded-full'
          >
            <div
              style={barStyle}
              className='bg-primary h-full origin-left rounded-full'
            />
          </div>
        </div>
      </dl>
    </>
  );
}

export default function Teams07() {
  const shouldReduceMotion = usePrefersReducedMotion();
  const [isFlipped, setIsFlipped] = useState(false);
  const frontButtonRef = useRef<HTMLButtonElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const wasFlippedByPerson = useRef(false);
  const faces = faceMotionOf(isFlipped, shouldReduceMotion);

  useEffect(() => {
    if (!wasFlippedByPerson.current) {
      return;
    }
    if (isFlipped) {
      backButtonRef.current?.focus();
      return;
    }
    frontButtonRef.current?.focus();
  }, [isFlipped]);

  function flip() {
    wasFlippedByPerson.current = true;
    setIsFlipped((current) => !current);
  }

  return (
    <div className='relative h-[17rem] w-full max-w-[18rem] [perspective:1000px]'>
      <motion.div
        initial={false}
        animate={faces.front}
        transition={faces.transition}
        inert={inertOf(isFlipped)}
        className={FACE}
      >
        <FrontFace onFlip={flip} flipButtonRef={frontButtonRef} />
      </motion.div>
      <motion.div
        initial={false}
        animate={faces.back}
        transition={faces.transition}
        inert={inertOf(!isFlipped)}
        className={FACE}
      >
        <BackFace onFlip={flip} flipButtonRef={backButtonRef} />
      </motion.div>
    </div>
  );
}
