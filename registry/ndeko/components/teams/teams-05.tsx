'use client';

import { AnimatePresence, motion, type Transition } from 'motion/react';
import { useEffect, useId, useRef, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  CheckIcon,
  LoaderIcon,
  PlusIcon,
  SendIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Button } from '@/registry/ndeko/ui/button';
import { Input } from '@/registry/ndeko/ui/input';

import { rowCollapseOf } from './_parts/collapse';
import { SlidingCount } from './_parts/sliding-count';
import { Swap } from './_parts/swap';
import { TeamTile } from './_parts/team-tile';

type SendState = 'idle' | 'sending' | 'sent';

type Invite = { id: string; email: string; initials: string };

const MIN_SLOTS = 4;
const SEND_DELAY_MS = 650;
const SENT_RESET_MS = 1400;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MORPH: Transition = { type: 'spring', bounce: 0, duration: 0.3 };
const INSTANT: Transition = { duration: 0 };
const SEAT: Transition = { duration: 0.2, ease: [0.23, 1, 0.32, 1] };

function morphOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return MORPH;
}

function seatScaleOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return 1;
  }
  return 0.85;
}

function sendLabelOf(state: SendState) {
  if (state === 'sending') {
    return 'Sending';
  }
  if (state === 'sent') {
    return 'Sent';
  }
  return 'Invite';
}

function invitedLabelOf(count: number) {
  if (count === 0) {
    return 'No members yet';
  }
  if (count === 1) {
    return '1 invited, waiting to join';
  }
  return `${count} invited, waiting to join`;
}

function initialsOf(email: string) {
  const [localPart] = email.split('@');
  const letters = localPart.slice(0, 2);
  return letters.toUpperCase();
}

function emptySlotCountOf(invitedCount: number) {
  const missing = MIN_SLOTS - invitedCount;
  return Math.max(1, missing);
}

function errorOf(email: string, invites: Invite[]) {
  if (!EMAIL_PATTERN.test(email)) {
    return 'Enter an address like name@example.com';
  }
  const isAlreadyInvited = invites.some((invite) => invite.email === email);
  if (isAlreadyInvited) {
    return 'This address is already invited';
  }
  return null;
}

function useTimer() {
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
      }
    };
  }, []);

  function schedule(callback: () => void, delay: number) {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
    }
    timer.current = window.setTimeout(() => {
      timer.current = null;
      callback();
    }, delay);
  }

  return schedule;
}

function Seats({ invites }: { invites: Invite[] }) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const seatScale = seatScaleOf(shouldReduceMotion);
  const emptyCount = emptySlotCountOf(invites.length);
  const emptySlots = Array.from({ length: emptyCount }, (_, index) => index);

  return (
    <ul aria-label='Seats' className='flex flex-wrap gap-2'>
      <AnimatePresence mode='popLayout' initial={false}>
        {invites.map((invite) => (
          <motion.li
            key={invite.id}
            layout
            initial={{ opacity: 0, scale: seatScale }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: seatScale }}
            transition={SEAT}
          >
            <Avatar
              className='hairline-border border-foreground/30 size-9 border-dashed bg-transparent ring-0'
              seed={invite.email}
            />
            <span className='sr-only'>{invite.email}, invited</span>
          </motion.li>
        ))}
        {emptySlots.map((slot) => (
          <motion.li
            key={`empty-${slot}`}
            layout
            aria-hidden='true'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={SEAT}
            className='hairline-border border-foreground/20 text-muted-foreground/60 flex size-9 items-center justify-center rounded-full border-dashed'
          >
            <PlusIcon className='size-3.5' />
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}

function InviteChips({
  invites,
  onRemove,
}: {
  invites: Invite[];
  onRemove: (inviteId: string) => void;
}) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const chipScale = seatScaleOf(shouldReduceMotion);

  return (
    <ul aria-label='Pending invites' className='flex flex-wrap gap-1.5'>
      <AnimatePresence mode='popLayout' initial={false}>
        {invites.map((invite) => (
          <motion.li
            key={invite.id}
            layout
            initial={{ opacity: 0, scale: chipScale }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: chipScale }}
            transition={SEAT}
            className='bg-foreground/[0.05] inline-flex h-6 items-center gap-1 rounded-md ps-2 pe-0.5 text-xs'
          >
            {invite.email}
            <button
              type='button'
              aria-label={`Cancel the invite to ${invite.email}`}
              onClick={() => onRemove(invite.id)}
              className='text-muted-foreground hover:text-foreground hover:bg-foreground/5 focus-visible:ring-ring/25 inline-flex size-5 cursor-pointer items-center justify-center rounded-[5px] outline-none focus-visible:ring-[3px]'
            >
              <XIcon className='size-3' />
            </button>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}

export default function Teams05() {
  const shouldReduceMotion = usePrefersReducedMotion();
  const titleId = useId();
  const errorId = useId();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [sendState, setSendState] = useState<SendState>('idle');
  const schedule = useTimer();
  const morph = morphOf(shouldReduceMotion);
  const hasError = error !== null;
  const isSending = sendState === 'sending';
  const hasInvites = invites.length > 0;

  function changeDraft(event: React.ChangeEvent<HTMLInputElement>) {
    setDraft(event.target.value);
    setError(null);
  }

  function addInvite(email: string) {
    const invite = { id: email, email, initials: initialsOf(email) };
    setInvites((current) => [...current, invite]);
    setDraft('');
    setSendState('sent');
    schedule(() => setSendState('idle'), SENT_RESET_MS);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSending) {
      return;
    }
    const email = draft.trim();
    const problem = errorOf(email, invites);
    if (problem) {
      setError(problem);
      return;
    }
    setSendState('sending');
    schedule(() => addInvite(email), SEND_DELAY_MS);
  }

  function removeInvite(inviteId: string) {
    setInvites((current) => current.filter((invite) => invite.id !== inviteId));
  }

  return (
    <section
      aria-labelledby={titleId}
      className='bg-card hairline-ring ring-border flex w-full max-w-[26rem] flex-col gap-4 rounded-xl p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <div className='flex items-center gap-3'>
        <TeamTile name='Design guild' color='var(--primary)' size='lg' />
        <div className='min-w-0'>
          <h3 id={titleId} className='text-sm font-medium'>
            Design guild
          </h3>
          <SlidingCount
            value={invites.length}
            format={invitedLabelOf}
            className='text-muted-foreground text-xs'
          />
        </div>
      </div>
      <Seats invites={invites} />
      <p className='text-muted-foreground text-[13px] leading-5'>
        Invite the people who will work here. They join as members once they
        accept.
      </p>
      <form noValidate onSubmit={submit} className='flex items-start gap-2'>
        <div className='min-w-0 flex-1'>
          <Input
            type='email'
            value={draft}
            onChange={changeDraft}
            placeholder='name@example.com'
            aria-label='Email address to invite'
            aria-invalid={hasError}
            aria-describedby={errorId}
          />
          <AnimatePresence initial={false}>
            {hasError && (
              <motion.p
                key='error'
                id={errorId}
                variants={rowCollapseOf(shouldReduceMotion)}
                initial='hidden'
                animate='shown'
                exit='hidden'
                className='text-destructive-ink overflow-hidden text-xs'
              >
                <span className='block pt-1.5'>{error}</span>
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <Button type='submit' aria-disabled={isSending}>
          <Swap swapKey={sendState}>
            {sendState === 'idle' && <SendIcon />}
            {isSending && <LoaderIcon className='animate-spin' />}
            {sendState === 'sent' && <CheckIcon />}
          </Swap>
          <motion.span layout transition={morph}>
            {sendLabelOf(sendState)}
          </motion.span>
        </Button>
      </form>
      <AnimatePresence initial={false}>
        {hasInvites && (
          <motion.div
            key='chips'
            variants={rowCollapseOf(shouldReduceMotion)}
            initial='hidden'
            animate='shown'
            exit='hidden'
            className='-mt-4 overflow-hidden'
          >
            <div className='pt-4'>
              <InviteChips invites={invites} onRemove={removeInvite} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
