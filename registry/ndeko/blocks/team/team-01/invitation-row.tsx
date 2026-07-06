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
  MailIcon,
  SendIcon,
  TrashIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Chip } from '@/registry/ndeko/ui/chip';

import { ROLE_LABEL, type Invitation } from './data';
import { MEMBER_CARD_HEIGHT, MEMBER_GRID } from './member-parts';

type ResendState = 'idle' | 'sending' | 'sent';

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const SENDING_MS = 700;

const SENT_MS = 1400;

const REVOKE_ARMED_MS = 4000;

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

function resendLabelOf(state: ResendState) {
  if (state === 'sending') {
    return 'Sending';
  }
  if (state === 'sent') {
    return 'Sent';
  }
  return 'Resend';
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
          className='inline-flex items-center whitespace-nowrap'
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

/** Someone invited who has not joined: an empty dashed slot with an envelope and a clock. */
function PendingAvatar() {
  return (
    <span aria-hidden='true' className='relative inline-flex shrink-0'>
      <span className='hairline-border border-foreground/25 text-muted-foreground flex size-9 items-center justify-center rounded-full border-dashed'>
        <MailIcon className='size-4' />
      </span>
      <span className='bg-card absolute -right-0.5 -bottom-0.5 flex rounded-full p-px'>
        <span className='chip-3d flex size-4 items-center justify-center rounded-full [--chip:var(--warning)]'>
          <ClockIcon className='size-2.5' strokeWidth={2.75} />
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
  const iconVariants = iconSwapOf(shouldReduceMotion);
  const labelVariants = labelSwapOf(shouldReduceMotion);
  const label = resendLabelOf(state);
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
      size='sm'
      aria-label={`Send the invitation to ${email} again`}
      aria-busy={isSending}
      onClick={resend}
    >
      <Swap swapKey={state} variants={iconVariants}>
        <ResendGlyph state={state} />
      </Swap>
      <AnimatedSize axis='width' as='span'>
        <Swap swapKey={label} variants={labelVariants}>
          {label}
        </Swap>
      </AnimatedSize>
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
  const labelVariants = labelSwapOf(shouldReduceMotion);

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

  let label = 'Revoke';
  let accessibleLabel = `Revoke the invitation sent to ${email}`;
  if (isArmed) {
    label = 'Revoke now';
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
        'hover:text-destructive-ink',
        isArmed && 'bg-destructive/10 text-destructive-ink'
      )}
    >
      <TrashIcon />
      <AnimatedSize axis='width' as='span'>
        <Swap swapKey={label} variants={labelVariants}>
          {label}
        </Swap>
      </AnimatedSize>
    </Button>
  );
}

type InvitationRowProps = {
  invitation: Invitation;
  onResend: (invitationId: string) => void;
  onRevoke: (invitationId: string) => void;
};

/** A pending invitation: not a member yet, so its outline and its avatar slot are dashed. */
export function InvitationRow({
  invitation,
  onResend,
  onRevoke,
}: InvitationRowProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const labelVariants = labelSwapOf(shouldReduceMotion);

  function resend() {
    onResend(invitation.id);
  }

  function revoke() {
    onRevoke(invitation.id);
  }

  return (
    <div
      className={cn(
        MEMBER_GRID,
        MEMBER_CARD_HEIGHT,
        'hairline-border border-foreground/20 rounded-xl border-dashed'
      )}
    >
      <div className='col-span-3 flex min-w-0 items-center gap-3 px-4 py-3 xl:col-span-1'>
        <PendingAvatar />
        <div className='flex min-w-0 flex-col gap-0.5'>
          <p className='truncate text-[13px] font-medium'>{invitation.email}</p>
          <p className='text-muted-foreground truncate text-xs'>
            {`Invited as ${ROLE_LABEL[invitation.role]}`}
          </p>
        </div>
      </div>
      <div className='xl:hairline-l border-foreground/20 col-span-3 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 border-dashed px-4 pb-3 xl:col-span-5 xl:py-3'>
        <Chip color='var(--warning)'>
          <ClockIcon strokeWidth={2.25} />
          Pending
        </Chip>
        <Swap
          swapKey={invitation.sentLabel}
          variants={labelVariants}
          className='text-muted-foreground text-xs'
        >
          {invitation.sentLabel}
        </Swap>
        <div className='ml-auto flex items-center gap-1'>
          <ResendButton email={invitation.email} onResend={resend} />
          <RevokeButton email={invitation.email} onRevoke={revoke} />
        </div>
      </div>
    </div>
  );
}
