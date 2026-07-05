'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId, useRef, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { XIcon } from '@/registry/ndeko/lib/icons';
import { CONTROL_RECIPE } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Chip } from '@/registry/ndeko/ui/chip';

import {
  ADDRESS_LOOK,
  type AddressEntry,
  type AddressLook,
} from './invite-emails';
import { chipVariantsOf } from './motion';

export type FieldChip = { email: string; look: AddressLook };

export function chipsOf(entries: AddressEntry[]): FieldChip[] {
  return entries.map((entry) => ({
    email: entry.email,
    look: ADDRESS_LOOK[entry.state],
  }));
}

const COMMIT_KEYS = new Set(['Enter', ',', ';', ' ', 'Tab']);

function placeholderOf(hasChips: boolean, empty: string, more: string) {
  if (hasChips) {
    return more;
  }
  return empty;
}

function AddressChip({
  chip,
  allowsLayout,
  onRemove,
}: {
  chip: FieldChip;
  allowsLayout: boolean;
  onRemove: (email: string) => void;
}) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const variants = chipVariantsOf(shouldReduceMotion);
  const ChipGlyph = chip.look.icon;
  const hasHint = chip.look.hint.length > 0;

  function remove() {
    onRemove(chip.email);
  }

  return (
    <motion.li
      layout={allowsLayout}
      variants={variants}
      initial='hidden'
      animate='shown'
      exit='hidden'
      title={chip.look.hint}
      className='flex max-w-full'
    >
      <Chip
        color={chip.look.color}
        className='h-6 max-w-full gap-1 pr-0.5 pl-1.5 text-xs'
      >
        {ChipGlyph && <ChipGlyph strokeWidth={2.25} />}
        <span className='truncate'>{chip.email}</span>
        {hasHint && <span className='sr-only'>{chip.look.hint}</span>}
        <button
          type='button'
          aria-label={`Remove ${chip.email}`}
          onClick={remove}
          className='hover:bg-foreground/10 focus-visible:ring-ring/25 flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-[5px] opacity-70 transition-[opacity,background-color] duration-150 outline-none hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-[3px]'
        >
          <XIcon className='size-3' />
        </button>
      </Chip>
    </motion.li>
  );
}

type AddressFieldProps = {
  label: string;
  chips: FieldChip[];
  onAdd: (text: string) => void;
  onRemove: (email: string) => void;
  /** Enter on an empty line, or Cmd Enter at any time, sends what the field holds. */
  onSubmitShortcut?: () => void;
  /** Sits at the right end of the field, such as the role of the batch. */
  trailing?: React.ReactNode;
  placeholder?: string;
  morePlaceholder?: string;
  describedBy?: string;
  isInvalid?: boolean;
  disabled?: boolean;
  className?: string;
};

/**
 * One field for many addresses, like the To line of a mail: each address becomes a chip tinted by what sending
 * will do with it, a pasted list fills it at once, Backspace on an empty line takes the last chip back.
 */
export function AddressField({
  label,
  chips,
  onAdd,
  onRemove,
  onSubmitShortcut,
  trailing,
  placeholder = 'name@company.com, another@company.com',
  morePlaceholder = 'Add another address',
  describedBy,
  isInvalid = false,
  disabled = false,
  className,
}: AddressFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState('');
  const shouldReduceMotion = usePrefersReducedMotion();
  const allowsLayout = !shouldReduceMotion;
  const hasChips = chips.length > 0;
  const hasTrailing = Boolean(trailing);
  const shownPlaceholder = placeholderOf(
    hasChips,
    placeholder,
    morePlaceholder
  );
  const lastChip = chips.at(-1);

  function focusInput() {
    inputRef.current?.focus();
  }

  function commitDraft() {
    const typed = draft.trim();
    if (typed.length === 0) {
      return false;
    }
    onAdd(typed);
    setDraft('');
    return true;
  }

  function changeDraft(event: React.ChangeEvent<HTMLInputElement>) {
    setDraft(event.target.value);
  }

  function removeChip(email: string) {
    onRemove(email);
    focusInput();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const isEnter = event.key === 'Enter';
    const hasModifier = event.metaKey || event.ctrlKey;
    const isDraftEmpty = draft.trim().length === 0;
    const isSubmitShortcut = isEnter && hasModifier;
    const isEnterOnEmptyLine = isEnter && isDraftEmpty;
    const asksToSend = isSubmitShortcut || isEnterOnEmptyLine;
    if (asksToSend && onSubmitShortcut) {
      event.preventDefault();
      commitDraft();
      onSubmitShortcut();
      return;
    }
    if (COMMIT_KEYS.has(event.key)) {
      const hasCommitted = commitDraft();
      const isTab = event.key === 'Tab';
      const keepsTabMoving = isTab && !hasCommitted;
      if (!keepsTabMoving) {
        event.preventDefault();
      }
      return;
    }
    const isBackspace = event.key === 'Backspace';
    const takesLastChip = isBackspace && draft.length === 0;
    if (takesLastChip && lastChip) {
      onRemove(lastChip.email);
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData('text');
    event.preventDefault();
    onAdd(`${draft} ${pasted}`);
    setDraft('');
  }

  return (
    <div
      role='presentation'
      onClick={focusInput}
      data-invalid={isInvalid || undefined}
      className={cn(
        CONTROL_RECIPE,
        'flex min-h-9 cursor-text items-start gap-1 p-1',
        'focus-within:border-foreground/30 focus-within:ring-ring/25 focus-within:ring-[3px]',
        className
      )}
    >
      <div className='relative flex max-h-[7rem] min-w-0 flex-1 flex-wrap items-center gap-1 overflow-y-auto overscroll-contain'>
        {hasChips && (
          <ul aria-label='Addresses to invite' className='contents'>
            <AnimatePresence initial={false} mode='popLayout'>
              {chips.map((chip) => (
                <AddressChip
                  key={chip.email}
                  chip={chip}
                  allowsLayout={allowsLayout}
                  onRemove={removeChip}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
        <label htmlFor={inputId} className='sr-only'>
          {label}
        </label>
        <input
          ref={inputRef}
          id={inputId}
          type='text'
          inputMode='email'
          autoComplete='off'
          spellCheck={false}
          value={draft}
          disabled={disabled}
          aria-describedby={describedBy}
          aria-invalid={isInvalid || undefined}
          placeholder={shownPlaceholder}
          onChange={changeDraft}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={commitDraft}
          className='placeholder:text-muted-foreground/75 h-7 min-w-36 flex-1 bg-transparent px-1.5 text-base outline-none disabled:cursor-not-allowed md:text-[13px]'
        />
      </div>
      {hasTrailing && (
        <div className='flex h-7 shrink-0 items-center'>{trailing}</div>
      )}
    </div>
  );
}
