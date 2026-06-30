'use client';

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useState } from 'react';

import {
  CheckIcon,
  CircleAlertIcon,
  CopyIcon,
  EllipsisIcon,
  RotateCcwIcon,
  UserMinusIcon,
} from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';

import { memberById, type Role } from './_parts/people';
import { PresenceAvatar } from './_parts/presence-avatar';
import { RoleMenu } from './_parts/role-menu';
import { Swap } from './_parts/swap';

const MEMBER = memberById('sana');

const COPIED_RESET_MS = 1600;

const ARRIVE: Transition = { duration: 0.18, ease: [0.23, 1, 0.32, 1] };

const LEAVE: Transition = { duration: 0.12, ease: [0.23, 1, 0.32, 1] };

const BLUR_VARIANTS: Variants = {
  enter: { opacity: 0, filter: 'blur(2px)' },
  visible: { opacity: 1, filter: 'blur(0px)', transition: ARRIVE },
  exit: { opacity: 0, filter: 'blur(2px)', transition: LEAVE },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1, transition: ARRIVE },
  exit: { opacity: 0, transition: LEAVE },
};

function variantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return BLUR_VARIANTS;
}

function copyLabelOf(isCopied: boolean) {
  if (isCopied) {
    return 'Email copied';
  }
  return 'Copy email';
}

function CurrentTask() {
  return (
    <div className='hidden min-w-0 flex-col items-end gap-0.5 md:flex'>
      <span className='flex min-w-0 items-center gap-1.5'>
        <span
          role='img'
          aria-label='Bug'
          className='gem-plate inline-flex size-4 shrink-0 items-center justify-center rounded-[5px] [--gem:var(--destructive)]'
        >
          <CircleAlertIcon strokeWidth={2.5} className='size-2.5' />
        </span>
        <span className='text-muted-foreground text-xs tabular-nums'>
          FRN-152
        </span>
        <span className='max-w-40 truncate text-[13px]'>
          Photo sync drops captions
        </span>
      </span>
      <span className='text-muted-foreground text-xs'>
        Today <span className='text-foreground tabular-nums'>2h 05m</span>
      </span>
    </div>
  );
}

type MemberDetailsProps = {
  role: Role;
  onRoleChange: (role: Role) => void;
  onRemove: () => void;
};

function MemberDetails({ role, onRoleChange, onRemove }: MemberDetailsProps) {
  const [isCopied, setIsCopied] = useState(false);
  const copyLabel = copyLabelOf(isCopied);

  function copyEmail() {
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), COPIED_RESET_MS);
  }

  return (
    <div className='flex items-center gap-3'>
      <PresenceAvatar member={MEMBER} />
      <div className='min-w-0 flex-1'>
        <p className='truncate text-[13px] leading-5 font-medium'>
          {MEMBER.name}
        </p>
        <p className='text-muted-foreground truncate text-xs'>{MEMBER.title}</p>
      </div>
      <CurrentTask />
      <RoleMenu role={role} memberName={MEMBER.name} onChange={onRoleChange} />
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label={`More actions for ${MEMBER.name}`}
              className='text-muted-foreground'
            />
          }
        >
          <EllipsisIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-52'>
          <DropdownMenuItem closeOnClick={false} onClick={copyEmail}>
            <Swap swapKey={String(isCopied)}>
              {isCopied && <CheckIcon className='text-success-foreground' />}
              {!isCopied && <CopyIcon />}
            </Swap>
            {copyLabel}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant='destructive' onClick={onRemove}>
            <UserMinusIcon />
            Remove from team
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function RemovedNotice({ onUndo }: { onUndo: () => void }) {
  return (
    <div className='flex min-h-9 items-center gap-3'>
      <p className='text-muted-foreground min-w-0 flex-1 text-[13px]'>
        <span className='text-foreground font-medium'>{MEMBER.name}</span> was
        removed from Atlas Redesign. Open tasks stay assigned to Sana
      </p>
      <Button size='sm' variant='outline' onClick={onUndo}>
        <RotateCcwIcon />
        Undo
      </Button>
    </div>
  );
}

export default function Teams03() {
  const shouldReduceMotion = useReducedMotion();
  const [role, setRole] = useState<Role>(MEMBER.role);
  const [isRemoved, setIsRemoved] = useState(false);
  const variants = variantsOf(shouldReduceMotion);

  function remove() {
    setIsRemoved(true);
  }

  function undo() {
    setIsRemoved(false);
  }

  return (
    <div className='bg-card hairline-ring ring-border w-full max-w-[36rem] rounded-xl px-3 py-2.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <AnimatedSize>
        <div aria-live='polite' className='relative'>
          <AnimatePresence mode='popLayout' initial={false}>
            <motion.div
              key={String(isRemoved)}
              variants={variants}
              initial='enter'
              animate='visible'
              exit='exit'
            >
              {!isRemoved && (
                <MemberDetails
                  role={role}
                  onRoleChange={setRole}
                  onRemove={remove}
                />
              )}
              {isRemoved && <RemovedNotice onUndo={undo} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </AnimatedSize>
    </div>
  );
}
