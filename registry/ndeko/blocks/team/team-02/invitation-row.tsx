'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  useReducedMotion,
} from 'motion/react';

import {
  EllipsisIcon,
  MailIcon,
  SendIcon,
  TrashIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';

import { ROLE_LABEL, type Invitation } from './data';
import { TABLE_GRID, TABLE_ROW_HEIGHT, swapVariantsOf } from './member-parts';

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const ROW_EXIT = { opacity: 0, transition: { duration: 0.14 } };

type InvitationRowProps = {
  invitation: Invitation;
  onResend: (invitationId: string) => void;
  onRevoke: (invitationId: string) => void;
};

function SentLabel({ label }: { label: string }) {
  const shouldReduceMotion = useReducedMotion();
  const variants = swapVariantsOf(shouldReduceMotion);

  return (
    <span className='relative inline-flex'>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span
          key={label}
          variants={variants}
          initial='enter'
          animate='visible'
          exit='exit'
          transition={SWAP_TRANSITION}
        >
          {`Waiting for them to join · ${label}`}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** A pending invitation inside the table: muted, with its actions in the row menu. */
export function InvitationRow({
  invitation,
  onResend,
  onRevoke,
}: InvitationRowProps) {
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
      exit={ROW_EXIT}
      className={cn(TABLE_GRID, 'bg-card')}
    >
      <div
        role='cell'
        className={cn(
          TABLE_ROW_HEIGHT,
          'flex min-w-0 items-center gap-3 px-4 py-3'
        )}
      >
        <span className='keycap-3d text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-full'>
          <MailIcon className='size-4' />
        </span>
        <div className='flex min-w-0 flex-col gap-0.5'>
          <p className='text-muted-foreground truncate text-[13px] font-medium'>
            {invitation.email}
          </p>
          <p className='text-muted-foreground truncate text-xs'>
            {`Invited as ${ROLE_LABEL[invitation.role]}`}
          </p>
        </div>
      </div>
      <div
        role='cell'
        className='hairline-l border-border text-muted-foreground hidden min-w-0 items-center px-4 py-3 text-xs md:col-span-2 md:flex xl:col-span-4'
      >
        <SentLabel label={invitation.sentLabel} />
      </div>
      <div role='cell' className='md:hidden' />
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
