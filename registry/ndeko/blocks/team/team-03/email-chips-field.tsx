'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useRef } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { XIcon, type Icon } from '@/registry/ndeko/lib/icons';
import { CONTROL_RECIPE } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Chip } from '@/registry/ndeko/ui/chip';

const SEPARATOR_KEYS = new Set(['Enter', ',', ' ', 'Tab']);

const CHIP_TRANSITION: Transition = {
  duration: 0.15,
  ease: [0.23, 1, 0.32, 1],
};

const CHIP_PRESENCE: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  shown: { opacity: 1, scale: 1 },
};

const CHIP_FADE: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1 },
};

export type ChipLook = { color: string; icon: Icon | null; hint: string };

const NEUTRAL_LOOK: ChipLook = {
  color: 'var(--muted-foreground)',
  icon: null,
  hint: '',
};

function neutralLook() {
  return NEUTRAL_LOOK;
}

function chipVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return CHIP_FADE;
  }
  return CHIP_PRESENCE;
}

type EmailChipsFieldProps = {
  id: string;
  emails: string[];
  draft: string;
  isInvalid: boolean;
  describedBy?: string;
  onDraftChange: (draft: string) => void;
  onCommit: (text: string) => void;
  onRemove: (email: string) => void;
  /** Tints each chip by what sending will do with its address. */
  lookOf?: (email: string) => ChipLook;
};

/** Addresses become chips on Enter, comma or space; a pasted list splits into chips. */
export function EmailChipsField({
  id,
  emails,
  draft,
  isInvalid,
  describedBy,
  onDraftChange,
  onCommit,
  onRemove,
  lookOf = neutralLook,
}: EmailChipsFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const chipVariants = chipVariantsOf(shouldReduceMotion);
  const hasDraft = draft.trim().length > 0;
  const lastEmail = emails.at(-1);

  function focusInput() {
    inputRef.current?.focus();
  }

  function changeDraft(event: React.ChangeEvent<HTMLInputElement>) {
    onDraftChange(event.target.value);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const isSeparator = SEPARATOR_KEYS.has(event.key);
    const commitsDraft = isSeparator && hasDraft;
    if (commitsDraft) {
      event.preventDefault();
      onCommit(draft);
      return;
    }
    const isBackspace = event.key === 'Backspace';
    const removesLast = isBackspace && !hasDraft;
    if (removesLast && lastEmail) {
      onRemove(lastEmail);
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData('text');
    const hasSeveral = /[\s,;]/.test(pasted.trim());
    if (hasSeveral) {
      event.preventDefault();
      onCommit(pasted);
    }
  }

  function commitOnBlur() {
    if (hasDraft) {
      onCommit(draft);
    }
  }

  return (
    <div
      onClick={focusInput}
      data-invalid={isInvalid || undefined}
      className={cn(
        CONTROL_RECIPE,
        'flex min-h-9 cursor-text flex-wrap items-center gap-1 px-1.5 py-1',
        'focus-within:border-foreground/30 focus-within:ring-ring/25 focus-within:ring-[3px]'
      )}
    >
      <AnimatePresence initial={false}>
        {emails.map((email) => {
          const look = lookOf(email);
          const ChipGlyph = look.icon;
          const hasHint = look.hint.length > 0;

          function removeEmail() {
            onRemove(email);
            focusInput();
          }

          return (
            <motion.span
              key={email}
              layout
              variants={chipVariants}
              initial='hidden'
              animate='shown'
              exit='hidden'
              transition={CHIP_TRANSITION}
              className='flex'
            >
              <Chip
                color={look.color}
                title={look.hint}
                className='h-6 max-w-56 gap-1 pr-0.5 pl-2 text-[13px]'
              >
                {ChipGlyph && <ChipGlyph strokeWidth={2.25} />}
                <span className='truncate'>{email}</span>
                {hasHint && <span className='sr-only'>{look.hint}</span>}
                <button
                  type='button'
                  aria-label={`Remove ${email}`}
                  onClick={removeEmail}
                  className='hover:bg-foreground/10 focus-visible:ring-ring/25 flex size-5 cursor-pointer items-center justify-center rounded-[5px] outline-none focus-visible:ring-[3px]'
                >
                  <XIcon className='size-3' />
                </button>
              </Chip>
            </motion.span>
          );
        })}
      </AnimatePresence>
      <input
        ref={inputRef}
        id={id}
        type='email'
        multiple
        autoComplete='off'
        value={draft}
        aria-invalid={isInvalid}
        aria-describedby={describedBy}
        placeholder='name@company.com'
        onChange={changeDraft}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={commitOnBlur}
        className='placeholder:text-muted-foreground/75 h-6 min-w-40 flex-1 bg-transparent px-1 text-base outline-none md:text-[13px]'
      />
    </div>
  );
}
