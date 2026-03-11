'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  useReducedMotion,
} from 'motion/react';

import { MailIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';

import { ROLE_LABEL, type Invitation } from './data';
import {
  MEMBER_CARD_HEIGHT,
  MEMBER_GRID,
  swapVariantsOf,
} from './member-parts';

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

type InvitationRowProps = {
  invitation: Invitation;
  onResend: (invitationId: string) => void;
  onRevoke: (invitationId: string) => void;
};

/** A pending invitation: not a member yet, so its outline is dashed. */
export function InvitationRow({
  invitation,
  onResend,
  onRevoke,
}: InvitationRowProps) {
  const shouldReduceMotion = useReducedMotion();
  const variants = swapVariantsOf(shouldReduceMotion);

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
        <span className='keycap-3d text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-full'>
          <MailIcon className='size-4' />
        </span>
        <div className='flex min-w-0 flex-col gap-0.5'>
          <p className='truncate text-[13px] font-medium'>{invitation.email}</p>
          <p className='text-muted-foreground truncate text-xs'>
            {`Invited as ${ROLE_LABEL[invitation.role]}`}
          </p>
        </div>
      </div>
      <div className='xl:hairline-l border-foreground/20 col-span-3 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 border-dashed px-4 pb-3 xl:col-span-5 xl:py-3'>
        <span className='text-muted-foreground relative inline-flex text-xs'>
          <AnimatePresence mode='popLayout' initial={false}>
            <motion.span
              key={invitation.sentLabel}
              variants={variants}
              initial='enter'
              animate='visible'
              exit='exit'
              transition={SWAP_TRANSITION}
            >
              {`Waiting for them to join · ${invitation.sentLabel}`}
            </motion.span>
          </AnimatePresence>
        </span>
        <div className='ml-auto flex items-center gap-1'>
          <Button variant='ghost' size='sm' onClick={resend}>
            Resend
          </Button>
          <Button
            variant='ghost'
            size='sm'
            onClick={revoke}
            className='text-destructive-ink hover:bg-destructive/10 hover:text-destructive-ink'
          >
            Revoke
          </Button>
        </div>
      </div>
    </div>
  );
}
