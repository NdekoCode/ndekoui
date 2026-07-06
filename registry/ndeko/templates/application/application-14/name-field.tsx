'use client';

import { useRef, useState } from 'react';

import { PencilIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';

type RenameInputProps = {
  value: string;
  label: string;
  /** `name` is null when nothing changed. `isFromKey` tells a key ended the edit, so the focus has to be put back. */
  onSettle: (name: string | null, isFromKey: boolean) => void;
  className?: string;
};

/** A name edited where it stands: Enter keeps it, Escape gives it up, leaving the field keeps it. */
export function RenameInput({
  value,
  label,
  onSettle,
  className,
}: RenameInputProps) {
  const [draft, setDraft] = useState(value);
  const isSettled = useRef(false);

  /** The field leaves the page when a key settles it, which blurs it: only the first of the two counts. */
  function settle(next: string, isFromKey: boolean) {
    if (isSettled.current) {
      return;
    }
    isSettled.current = true;
    const name = next.trim();
    const isNewName = name !== '' && name !== value;
    if (isNewName) {
      onSettle(name, isFromKey);
      return;
    }
    onSettle(null, isFromKey);
  }

  function settleFromKeys(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) {
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      settle(draft, true);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      settle(value, true);
    }
  }

  return (
    <input
      autoFocus
      value={draft}
      aria-label={label}
      onChange={(event) => setDraft(event.target.value)}
      onFocus={(event) => event.currentTarget.select()}
      onKeyDown={settleFromKeys}
      onBlur={() => settle(draft, false)}
      className={cn(
        'bg-card text-foreground ring-ring/25 w-full min-w-0 rounded-sm px-1 text-base ring-[3px] outline-none select-text md:text-[13px]',
        className
      )}
    />
  );
}

type NameFieldProps = {
  value: string;
  /** The name of the field: "Workflow name". */
  label: string;
  /** What the button does, before the name: "Rename the workflow". */
  action: string;
  onRename: (name: string) => void;
  className?: string;
};

export function NameField({
  value,
  label,
  action,
  onRename,
  className,
}: NameFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  function settle(name: string | null, isFromKey: boolean) {
    setIsEditing(false);
    if (name !== null) {
      onRename(name);
    }
    if (isFromKey) {
      requestAnimationFrame(() => buttonRef.current?.focus());
    }
  }

  if (isEditing) {
    return (
      <RenameInput
        value={value}
        label={label}
        onSettle={settle}
        className={cn('h-6 font-medium', className)}
      />
    );
  }

  return (
    <button
      ref={buttonRef}
      type='button'
      aria-label={`${action}: ${value}`}
      onClick={() => setIsEditing(true)}
      className={cn(
        'group/name hover:bg-foreground/5 focus-visible:ring-ring/25 -mx-1 flex h-6 min-w-0 cursor-text items-center gap-1.5 rounded-sm px-1 text-start font-medium outline-none focus-visible:ring-[3px]',
        className
      )}
    >
      <span className='min-w-0 truncate'>{value}</span>
      <PencilIcon className='text-muted-foreground size-3 shrink-0 opacity-0 transition-opacity duration-150 group-hover/name:opacity-100 group-focus-visible/name:opacity-100' />
    </button>
  );
}
