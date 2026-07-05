'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useEffect, useEffectEvent, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  CheckIcon,
  ClockIcon,
  LoaderCircleIcon,
  SendIcon,
  TrashIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Chip } from '@/registry/ndeko/ui/chip';

import { ROLE_LABEL, type Invitation } from './data';

type ResendState = 'idle' | 'sending' | 'sent';

const PRESENCE_IN: Transition = { duration: 0.2, ease: [0.23, 1, 0.32, 1] };

const PRESENCE_OUT: Transition = { duration: 0.12, ease: [0.23, 1, 0.32, 1] };

/**
 * The spring AnimatedSize resizes with. It starts from rest, so the fade leads and the freed space
 * closes after it at the pace the list follows, instead of snapping shut.
 */
const SIZE_SPRING: Transition = { type: 'spring', bounce: 0, duration: 0.32 };

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const SENDING_MS = 700;

const SENT_MS = 1400;

const REVOKE_ARMED_MS = 4000;

const ROW_PRESENCE: Variants = {
  hidden: {
    height: 0,
    opacity: 0,
    overflow: 'hidden',
    transition: { ...SIZE_SPRING, opacity: PRESENCE_OUT },
  },
  shown: {
    height: 'auto',
    opacity: 1,
    transition: { ...SIZE_SPRING, opacity: PRESENCE_IN },
    transitionEnd: { overflow: 'visible' },
  },
};

const ROW_FADE: Variants = {
  hidden: { opacity: 0, transition: PRESENCE_OUT },
  shown: { opacity: 1, transition: PRESENCE_IN },
};

const ICON_SWAP: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const LABEL_SWAP: Variants = {
  enter: { opacity: 0, filter: 'blur(2px)' },
  visible: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(2px)' },
};

const FADE: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

/** One card for a list of people: its ring is the only outline, and the rows are separated by space. */
export const LIST_SURFACE =
  'bg-card hairline-ring ring-border flex flex-col overflow-hidden rounded-xl py-1 shadow-[0_1px_2px_rgb(0_0_0/0.04)]';

function rowVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return ROW_FADE;
  }
  return ROW_PRESENCE;
}

function iconSwapOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE;
  }
  return ICON_SWAP;
}

function labelSwapOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE;
  }
  return LABEL_SWAP;
}

function initialOf(email: string) {
  const first = email.charAt(0);
  return first.toUpperCase();
}

function Swap({
  swapKey,
  variants,
  className,
  children,
}: {
  swapKey: string;
  variants: Variants;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={cn('relative inline-flex items-center', className)}>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span
          key={swapKey}
          className='inline-flex max-w-full min-w-0 items-center whitespace-nowrap'
          variants={variants}
          initial='enter'
          animate='visible'
          exit='exit'
          transition={SWAP_TRANSITION}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** Someone invited who has not joined: an empty dashed slot with the first letter of the address and a clock. */
function PendingAvatar({ email }: { email: string }) {
  return (
    <span aria-hidden='true' className='relative inline-flex shrink-0'>
      <span className='hairline-border border-foreground/25 text-muted-foreground flex size-8 items-center justify-center rounded-full border-dashed text-xs font-medium'>
        {initialOf(email)}
      </span>
      <span className='bg-card absolute -right-0.5 -bottom-0.5 flex rounded-full p-px'>
        <span className='chip-3d flex size-3.5 items-center justify-center rounded-full [--chip:var(--warning)]'>
          <ClockIcon className='size-2' strokeWidth={2.75} />
        </span>
      </span>
    </span>
  );
}

function ResendGlyph({ state }: { state: ResendState }) {
  if (state === 'sending') {
    return <LoaderCircleIcon className='animate-spin' />;
  }
  if (state === 'sent') {
    return <CheckIcon className='text-success-foreground' />;
  }
  return <SendIcon />;
}

function ResendButton({
  email,
  onResend,
}: {
  email: string;
  onResend: () => void;
}) {
  const [state, setState] = useState<ResendState>('idle');
  const shouldReduceMotion = usePrefersReducedMotion();
  const variants = iconSwapOf(shouldReduceMotion);
  const isSending = state === 'sending';
  const deliver = useEffectEvent(onResend);

  useEffect(() => {
    if (state === 'sending') {
      const timeout = window.setTimeout(() => {
        deliver();
        setState('sent');
      }, SENDING_MS);
      return () => window.clearTimeout(timeout);
    }
    if (state === 'sent') {
      const timeout = window.setTimeout(() => {
        setState('idle');
      }, SENT_MS);
      return () => window.clearTimeout(timeout);
    }
  }, [state]);

  function resend() {
    if (state !== 'idle') {
      return;
    }
    setState('sending');
  }

  return (
    <Button
      variant='ghost'
      size='icon-sm'
      aria-label={`Send the invitation to ${email} again`}
      aria-busy={isSending}
      title='Send again'
      onClick={resend}
      className='text-muted-foreground hover:text-foreground'
    >
      <Swap swapKey={state} variants={variants}>
        <ResendGlyph state={state} />
      </Swap>
    </Button>
  );
}

/** Revoking asks once more in place, in the destructive ink, and forgets the question after a few seconds. */
function RevokeButton({
  email,
  onRevoke,
}: {
  email: string;
  onRevoke: () => void;
}) {
  const [isArmed, setIsArmed] = useState(false);
  const shouldReduceMotion = usePrefersReducedMotion();
  const variants = labelSwapOf(shouldReduceMotion);
  const swapKey = String(isArmed);

  useEffect(() => {
    if (!isArmed) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setIsArmed(false);
    }, REVOKE_ARMED_MS);
    return () => window.clearTimeout(timeout);
  }, [isArmed]);

  function press() {
    if (isArmed) {
      onRevoke();
      return;
    }
    setIsArmed(true);
  }

  function disarm() {
    setIsArmed(false);
  }

  let accessibleLabel = `Revoke the invitation sent to ${email}`;
  if (isArmed) {
    accessibleLabel = `Confirm: revoke the invitation sent to ${email}`;
  }

  return (
    <Button
      variant='ghost'
      size='sm'
      aria-label={accessibleLabel}
      onClick={press}
      onBlur={disarm}
      className={cn(
        'text-muted-foreground hover:text-destructive-ink min-w-7 px-1.5',
        isArmed && 'bg-destructive/10 text-destructive-ink'
      )}
    >
      <AnimatedSize axis='width' as='span'>
        <Swap swapKey={swapKey} variants={variants}>
          {isArmed && 'Revoke'}
          {!isArmed && <TrashIcon />}
        </Swap>
      </AnimatedSize>
    </Button>
  );
}

function InvitationRow({
  invitation,
  isCompact,
  onResend,
  onRevoke,
}: {
  invitation: Invitation;
  isCompact: boolean;
  onResend: (invitationId: string) => void;
  onRevoke: (invitationId: string) => void;
}) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const lineVariants = labelSwapOf(shouldReduceMotion);
  const roleLabel = ROLE_LABEL[invitation.role];
  const line = `${roleLabel} · Invited by ${invitation.invitedBy} · ${invitation.sentLabel}`;

  function resend() {
    onResend(invitation.id);
  }

  function revoke() {
    onRevoke(invitation.id);
  }

  return (
    <div className='flex min-h-14 items-center gap-3 py-2 pr-1.5 pl-3'>
      <PendingAvatar email={invitation.email} />
      <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
        <p className='truncate text-[13px] leading-tight font-medium'>
          {invitation.email}
        </p>
        <Swap
          swapKey={line}
          variants={lineVariants}
          className='text-muted-foreground flex min-w-0 text-xs leading-tight'
        >
          <span className='truncate'>{line}</span>
        </Swap>
      </div>
      {!isCompact && (
        <Chip color='var(--warning)' className='hidden sm:inline-flex'>
          <ClockIcon strokeWidth={2.25} />
          Pending
        </Chip>
      )}
      <div className='flex shrink-0 items-center'>
        <ResendButton email={invitation.email} onResend={resend} />
        <RevokeButton email={invitation.email} onRevoke={revoke} />
      </div>
    </div>
  );
}

type InvitationListProps = {
  invitations: Invitation[];
  isCompact?: boolean;
  onResend: (invitationId: string) => void;
  onRevoke: (invitationId: string) => void;
};

/** The pending invitations, the way the invite dialog lists them: a dashed avatar slot, the state, resend and a revoke that asks twice. */
export function InvitationList({
  invitations,
  isCompact = false,
  onResend,
  onRevoke,
}: InvitationListProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowVariants = rowVariantsOf(shouldReduceMotion);

  return (
    <ul className={LIST_SURFACE}>
      <AnimatePresence initial={false}>
        {invitations.map((invitation) => (
          <motion.li
            key={invitation.id}
            variants={rowVariants}
            initial='hidden'
            animate='shown'
            exit='hidden'
          >
            <InvitationRow
              invitation={invitation}
              isCompact={isCompact}
              onResend={onResend}
              onRevoke={onRevoke}
            />
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
