'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  ClockIcon,
  EllipsisIcon,
  SendIcon,
  TrashIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Chip } from '@/registry/ndeko/ui/chip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';

import { ROLE_LABEL, type Invitation } from './data';
import { rowPresenceOf, TABLE_GRID, TABLE_ROW_HEIGHT } from './member-parts';

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

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

type InvitationRowProps = {
  invitation: Invitation;
  onResend: (invitationId: string) => void;
  onRevoke: (invitationId: string) => void;
};

/** Someone invited who has not joined: an empty dashed slot with the first letter of the address and a clock. */
function PendingAvatar({ email }: { email: string }) {
  return (
    <span aria-hidden='true' className='relative inline-flex shrink-0'>
      <span className='hairline-border border-foreground/25 text-muted-foreground flex size-9 items-center justify-center rounded-full border-dashed text-[13px] font-medium'>
        {initialOf(email)}
      </span>
      <span className='bg-card absolute -right-0.5 -bottom-0.5 flex rounded-full p-px'>
        <span className='chip-3d flex size-4 items-center justify-center rounded-full [--chip:var(--warning)]'>
          <ClockIcon className='size-2.5' strokeWidth={2.75} />
        </span>
      </span>
    </span>
  );
}

/** When the invitation is sent again, the sent line becomes the new one in place. */
function SentLabel({ label }: { label: string }) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const variants = labelSwapOf(shouldReduceMotion);

  return (
    <span className='relative inline-flex min-w-0'>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span
          key={label}
          className='truncate'
          variants={variants}
          initial='enter'
          animate='visible'
          exit='exit'
          transition={SWAP_TRANSITION}
        >
          {label}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** A pending invitation inside the table: a dashed avatar slot, its state chip and its actions in the row menu. */
export function InvitationRow({
  invitation,
  onResend,
  onRevoke,
}: InvitationRowProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);

  function resend() {
    onResend(invitation.id);
  }

  function revoke() {
    onRevoke(invitation.id);
  }

  return (
    <motion.div
      role='row'
      layout='position'
      variants={rowPresence}
      initial='hidden'
      animate='shown'
      exit='hidden'
      className={cn(TABLE_GRID, 'bg-card')}
    >
      <div
        role='cell'
        className={cn(
          TABLE_ROW_HEIGHT,
          'flex min-w-0 items-center gap-3 px-4 py-3'
        )}
      >
        <PendingAvatar email={invitation.email} />
        <div className='flex min-w-0 flex-col gap-0.5'>
          <p className='truncate text-[13px] font-medium'>{invitation.email}</p>
          <p className='text-muted-foreground truncate text-xs'>
            {`Invited as ${ROLE_LABEL[invitation.role]}`}
          </p>
        </div>
      </div>
      <div
        role='cell'
        className='hairline-l border-border text-muted-foreground hidden min-w-0 items-center gap-2.5 px-4 py-3 text-xs md:col-span-2 md:flex xl:col-span-4'
      >
        <Chip color='var(--warning)'>
          <ClockIcon strokeWidth={2.25} />
          Pending
        </Chip>
        <SentLabel label={invitation.sentLabel} />
      </div>
      <div role='cell' className='flex items-center md:hidden'>
        <Chip color='var(--warning)'>
          <ClockIcon strokeWidth={2.25} />
          Pending
        </Chip>
      </div>
      <div
        role='cell'
        className='md:hairline-l border-border flex items-center justify-center'
      >
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant='ghost'
                size='icon-sm'
                aria-label={`Actions for the invitation of ${invitation.email}`}
                className='text-muted-foreground'
              />
            }
          >
            <EllipsisIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-48'>
            <DropdownMenuItem onClick={resend}>
              <SendIcon />
              Resend invitation
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant='destructive' onClick={revoke}>
              <TrashIcon />
              Revoke invitation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
