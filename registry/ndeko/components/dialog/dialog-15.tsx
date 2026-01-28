'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useEffect, useId, useRef, useState } from 'react';

import {
  CheckIcon,
  CopyIcon,
  LoaderCircleIcon,
  PlusIcon,
  UserRoundPlusIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/registry/ndeko/ui/dialog';
import { Input } from '@/registry/ndeko/ui/input';
import { Label } from '@/registry/ndeko/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/registry/ndeko/ui/tooltip';

type SubmitState = 'idle' | 'sending' | 'sent';

type InviteRow = {
  id: number;
  email: string;
};

const INITIAL_ROWS: InviteRow[] = [
  { id: 1, email: 'kofi@fernhill.studio' },
  { id: 2, email: 'lena@fernhill.studio' },
  { id: 3, email: '' },
];

const INVITE_LINK = 'https://acme.example/join/k7p2m9';
const COPIED_RESET_MS = 1500;
const SENDING_DURATION_MS = 1000;

const ICON_TILE =
  'keycap-3d text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg';

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };
const ROW_TRANSITION: Transition = { duration: 0.2, ease: [0.2, 0, 0, 1] };
const SHIFT_TRANSITION: Transition = {
  type: 'spring',
  bounce: 0,
  duration: 0.3,
};
const INSTANT_TRANSITION: Transition = { duration: 0 };

const ROW_VARIANTS: Variants = {
  hidden: { height: 0, opacity: 0 },
  shown: { height: 'auto', opacity: 1 },
};

const ICON_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const ROW_FADE_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1 },
};

const LABEL_VARIANTS: Variants = {
  enter: { opacity: 0, filter: 'blur(2px)' },
  visible: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(2px)' },
};

const ICON_FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function rowVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return ROW_FADE_VARIANTS;
  }
  return ROW_VARIANTS;
}

function iconVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return ICON_FADE_VARIANTS;
  }
  return ICON_VARIANTS;
}

function labelVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return ICON_FADE_VARIANTS;
  }
  return LABEL_VARIANTS;
}

function shiftTransitionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT_TRANSITION;
  }
  return SHIFT_TRANSITION;
}

function sentLabelOf(count: number) {
  if (count === 1) {
    return '1 invite sent';
  }
  return `${count} invites sent`;
}

function submitViewOf(state: SubmitState, filledCount: number) {
  if (state === 'sending') {
    return {
      key: 'sending',
      icon: <LoaderCircleIcon className='animate-spin' />,
      label: 'Sending invites…',
    };
  }
  if (state === 'sent') {
    return {
      key: 'sent',
      icon: <CheckIcon />,
      label: sentLabelOf(filledCount),
    };
  }
  return { key: 'idle', icon: null, label: 'Send invites' };
}

function isFilled(row: InviteRow) {
  const email = row.email.trim();
  return email !== '';
}

function copyGlyphOf(isCopied: boolean) {
  if (isCopied) {
    return {
      key: 'copied',
      icon: <CheckIcon className='text-success-foreground' />,
    };
  }
  return { key: 'copy', icon: <CopyIcon /> };
}

function copyLabelOf(isCopied: boolean) {
  if (isCopied) {
    return 'Link copied';
  }
  return 'Copy invite link';
}

function nextRowIdOf(rows: InviteRow[]) {
  const ids = rows.map((row) => row.id);
  const highestId = Math.max(0, ...ids);
  return highestId + 1;
}

function lastRowRefOf(
  index: number,
  rowCount: number,
  ref: React.RefObject<HTMLInputElement | null>
) {
  const isLastRow = index === rowCount - 1;
  if (isLastRow) {
    return ref;
  }
  return undefined;
}

export default function Dialog15() {
  const id = useId();
  const emailsLabelId = `${id}-emails`;
  const linkId = `${id}-link`;
  const [rows, setRows] = useState(INITIAL_ROWS);
  const [isCopied, setIsCopied] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [addedRowCount, setAddedRowCount] = useState(0);
  const lastInputRef = useRef<HTMLInputElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const rowVariants = rowVariantsOf(shouldReduceMotion);
  const iconVariants = iconVariantsOf(shouldReduceMotion);
  const labelVariants = labelVariantsOf(shouldReduceMotion);
  const shiftTransition = shiftTransitionOf(shouldReduceMotion);
  const glyph = copyGlyphOf(isCopied);
  const filledCount = rows.filter(isFilled).length;
  const submitView = submitViewOf(submitState, filledCount);
  const hasSubmitIcon = submitView.icon !== null;
  const isIdle = submitState === 'idle';
  const hasNoEmail = filledCount === 0;
  const isSubmitBlocked = !isIdle || hasNoEmail;

  useEffect(() => {
    if (addedRowCount > 0) {
      lastInputRef.current?.focus();
    }
  }, [addedRowCount]);

  useEffect(() => {
    if (submitState !== 'sending') {
      return;
    }
    const timeout = window.setTimeout(() => {
      setSubmitState('sent');
    }, SENDING_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [submitState]);

  useEffect(() => {
    if (!isCopied) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setIsCopied(false);
    }, COPIED_RESET_MS);
    return () => window.clearTimeout(timeout);
  }, [isCopied]);

  function resetOnOpen(open: boolean) {
    if (open) {
      setSubmitState('idle');
    }
  }

  function sendInvites(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitBlocked) {
      return;
    }
    setSubmitState('sending');
  }

  function addRow() {
    setRows((current) => {
      const newRow = { id: nextRowIdOf(current), email: '' };
      return [...current, newRow];
    });
    setAddedRowCount((count) => count + 1);
  }

  function updateEmail(rowId: number, email: string) {
    setRows((current) =>
      current.map((row) => {
        if (row.id !== rowId) {
          return row;
        }
        return { ...row, email };
      })
    );
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(INVITE_LINK);
      setIsCopied(true);
    } catch {
      setIsCopied(false);
    }
  }

  return (
    <Dialog onOpenChange={resetOnOpen}>
      <DialogTrigger render={<Button variant='outline' />}>
        Invite teammates
      </DialogTrigger>
      <DialogContent initialFocus={lastInputRef}>
        <div className='flex flex-col gap-4'>
          <span aria-hidden='true' className={ICON_TILE}>
            <UserRoundPlusIcon className='size-5' />
          </span>
          <DialogHeader>
            <DialogTitle>Invite teammates</DialogTitle>
            <DialogDescription>
              People you invite join Fernhill Studio and see every project
              shared with the team.
            </DialogDescription>
          </DialogHeader>
        </div>
        <form className='flex flex-col gap-5' onSubmit={sendInvites}>
          <div className='flex flex-col gap-2'>
            <span
              id={emailsLabelId}
              className='text-foreground text-[13px] leading-none font-medium'
            >
              Invite by email
            </span>
            <div
              role='group'
              aria-labelledby={emailsLabelId}
              className='-my-1 flex flex-col'
            >
              <AnimatePresence initial={false}>
                {rows.map((row, index) => (
                  <motion.div
                    key={row.id}
                    className='-mx-1 overflow-hidden px-1 py-1'
                    variants={rowVariants}
                    initial='hidden'
                    animate='shown'
                    exit='hidden'
                    transition={ROW_TRANSITION}
                  >
                    <Input
                      ref={lastRowRefOf(index, rows.length, lastInputRef)}
                      type='email'
                      aria-label={`Email ${index + 1}`}
                      placeholder='teammate@fernhill.studio'
                      value={row.email}
                      readOnly={!isIdle}
                      onChange={(event) => {
                        updateEmail(row.id, event.currentTarget.value);
                      }}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='-ms-2.5 w-fit'
              disabled={!isIdle}
              onClick={addRow}
            >
              <PlusIcon className='opacity-60' />
              Add another
            </Button>
          </div>
          <Button
            type='submit'
            size='lg'
            className='w-full data-disabled:opacity-100'
            disabled={isSubmitBlocked}
            focusableWhenDisabled
          >
            <AnimatePresence mode='popLayout' initial={false}>
              {hasSubmitIcon && (
                <motion.span
                  key={submitView.key}
                  className='flex'
                  variants={iconVariants}
                  initial='enter'
                  animate='visible'
                  exit='exit'
                  transition={SWAP_TRANSITION}
                >
                  {submitView.icon}
                </motion.span>
              )}
            </AnimatePresence>
            <motion.span
              layout
              transition={shiftTransition}
              className='relative flex'
              aria-live='polite'
            >
              <AnimatePresence mode='popLayout' initial={false}>
                <motion.span
                  key={submitView.key}
                  className='flex'
                  variants={labelVariants}
                  initial='enter'
                  animate='visible'
                  exit='exit'
                  transition={SWAP_TRANSITION}
                >
                  {submitView.label}
                </motion.span>
              </AnimatePresence>
            </motion.span>
          </Button>
        </form>
        <div className='mt-2 grid gap-2'>
          <Label htmlFor={linkId}>Invite with a link</Label>
          <div className='relative'>
            <Input
              id={linkId}
              readOnly
              defaultValue={INVITE_LINK}
              className='pe-9'
            />
            <Tooltip>
              <TooltipTrigger
                delay={0}
                render={
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon-sm'
                    onClick={copyLink}
                    disabled={isCopied}
                    focusableWhenDisabled
                    aria-label={copyLabelOf(isCopied)}
                    className='text-muted-foreground absolute inset-y-0 end-0.5 my-auto data-disabled:opacity-100'
                  />
                }
              >
                <AnimatePresence mode='popLayout' initial={false}>
                  <motion.span
                    key={glyph.key}
                    className='flex'
                    variants={iconVariants}
                    initial='enter'
                    animate='visible'
                    exit='exit'
                    transition={SWAP_TRANSITION}
                  >
                    {glyph.icon}
                  </motion.span>
                </AnimatePresence>
              </TooltipTrigger>
              <TooltipContent>Copy invite link</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
