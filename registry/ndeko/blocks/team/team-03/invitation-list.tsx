'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';

import { MailIcon, SendIcon, TrashIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Chip } from '@/registry/ndeko/ui/chip';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/registry/ndeko/ui/tooltip';

import { ROLE_LABEL, type Invitation } from './data';

const PRESENCE_IN: Transition = { duration: 0.2, ease: [0.23, 1, 0.32, 1] };

const PRESENCE_OUT: Transition = { duration: 0.14, ease: [0.23, 1, 0.32, 1] };

const ROW_PRESENCE: Variants = {
  hidden: { height: 0, opacity: 0, transition: PRESENCE_OUT },
  shown: { height: 'auto', opacity: 1, transition: PRESENCE_IN },
};

const ROW_FADE: Variants = {
  hidden: { opacity: 0, transition: PRESENCE_OUT },
  shown: { opacity: 1, transition: PRESENCE_IN },
};

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const SWAP_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export const LIST_SURFACE =
  'bg-card hairline-ring ring-border hairline-divide-y divide-border overflow-hidden rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]';

function rowVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return ROW_FADE;
  }
  return ROW_PRESENCE;
}

function swapVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return SWAP_VARIANTS;
}

function SentLine({ invitation }: { invitation: Invitation }) {
  const shouldReduceMotion = useReducedMotion();
  const variants = swapVariantsOf(shouldReduceMotion);
  const line = `Invited by ${invitation.invitedBy} · ${invitation.sentLabel}`;

  return (
    <span className='text-muted-foreground relative flex min-w-0 text-xs'>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span
          key={line}
          variants={variants}
          initial='enter'
          animate='visible'
          exit='exit'
          transition={SWAP_TRANSITION}
          className='truncate'
        >
          {line}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function IconAction({
  label,
  hint,
  isDestructive = false,
  onClick,
  children,
}: {
  label: string;
  hint: string;
  isDestructive?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={label}
            onClick={onClick}
            className={cn(
              'text-muted-foreground',
              isDestructive &&
                'hover:bg-destructive/10 hover:text-destructive-ink'
            )}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  );
}

type InvitationListProps = {
  invitations: Invitation[];
  isCompact?: boolean;
  onResend: (invitationId: string) => void;
  onRevoke: (invitationId: string) => void;
};

export function InvitationList({
  invitations,
  isCompact = false,
  onResend,
  onRevoke,
}: InvitationListProps) {
  const shouldReduceMotion = useReducedMotion();
  const rowVariants = rowVariantsOf(shouldReduceMotion);

  return (
    <ul className={LIST_SURFACE}>
      <AnimatePresence initial={false}>
        {invitations.map((invitation) => {
          function resend() {
            onResend(invitation.id);
          }

          function revoke() {
            onRevoke(invitation.id);
          }

          return (
            <motion.li
              key={invitation.id}
              variants={rowVariants}
              initial='hidden'
              animate='shown'
              exit='hidden'
              className='overflow-hidden'
            >
              <div className='flex min-h-14 items-center gap-3 px-3 py-2.5'>
                {!isCompact && (
                  <span className='keycap-3d text-muted-foreground hidden size-8 shrink-0 items-center justify-center rounded-full sm:flex'>
                    <MailIcon className='size-4' />
                  </span>
                )}
                <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
                  <p className='truncate text-[13px] font-medium'>
                    {invitation.email}
                  </p>
                  <SentLine invitation={invitation} />
                </div>
                <Chip
                  color='var(--muted-foreground)'
                  className='hidden sm:inline-flex'
                >
                  {ROLE_LABEL[invitation.role]}
                </Chip>
                <div className='flex shrink-0 items-center'>
                  <IconAction
                    label={`Resend to ${invitation.email}`}
                    hint='Resend'
                    onClick={resend}
                  >
                    <SendIcon />
                  </IconAction>
                  <IconAction
                    label={`Revoke the invitation of ${invitation.email}`}
                    hint='Revoke'
                    isDestructive
                    onClick={revoke}
                  >
                    <TrashIcon />
                  </IconAction>
                </div>
              </div>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
