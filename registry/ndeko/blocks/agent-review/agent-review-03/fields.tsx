'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { pressedSolidOf } from '@/registry/ndeko/lib/demonstration';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold, Swap } from '@/registry/ndeko/ui/chat-motion';
import { JsonView } from '@/registry/ndeko/ui/json-view';

import {
  FIELDS,
  isLowConfidence,
  type ExtractField,
  type FieldId,
} from './data';
import type { ReviewStatus } from './session';

const REVIEW_WORD: Record<ReviewStatus, string> = {
  pending: 'Needs a look',
  confirmed: 'Confirmed',
  edited: 'Edited',
};

function confidenceVariantOf(field: ExtractField, review: ReviewStatus) {
  const isSettled = review !== 'pending';
  if (isLowConfidence(field) && !isSettled) {
    return 'warning';
  }
  return 'success';
}

function chipTextOf(field: ExtractField, review: ReviewStatus) {
  const isSettled = review !== 'pending';
  if (isLowConfidence(field) && isSettled) {
    return REVIEW_WORD[review];
  }
  return `${field.confidence}%`;
}

function rowToneOf(isActive: boolean) {
  if (isActive) {
    return 'bg-primary/10';
  }
  return 'hover:bg-foreground/[0.04]';
}

type FlaggedBodyProps = {
  field: ExtractField;
  value: string;
  isPressed: boolean;
  onConfirm: (id: FieldId) => void;
  onEdit: (id: FieldId, value: string) => void;
};

function FlaggedBody({
  field,
  value,
  isPressed,
  onConfirm,
  onEdit,
}: FlaggedBodyProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const isEditing = draft !== null;

  function save() {
    const next = draft?.trim() ?? '';
    setDraft(null);
    if (next !== '') {
      onEdit(field.id, next);
    }
  }

  function handleKeys(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      save();
    }
    if (event.key === 'Escape') {
      setDraft(null);
    }
  }

  return (
    <div className='flex flex-col gap-2 px-2 pb-2'>
      <p className='text-warning-foreground text-xs'>{field.reason}</p>
      {!isEditing && (
        <div className='flex items-center gap-2'>
          <Button
            type='button'
            size='sm'
            onClick={() => onConfirm(field.id)}
            className={pressedSolidOf(isPressed)}
          >
            Confirm {value}
          </Button>
          <Button
            type='button'
            size='sm'
            variant='outline'
            onClick={() => setDraft(value)}
          >
            Edit
          </Button>
        </div>
      )}
      {isEditing && (
        <div className='flex items-center gap-2'>
          <input
            value={draft}
            autoFocus
            aria-label={`${field.label}, corrected value`}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeys}
            className='bg-card hairline-ring ring-foreground/15 focus-visible:ring-ring/25 dark:bg-foreground/[0.04] h-7 min-w-0 flex-1 rounded-md px-2 text-base outline-none focus-visible:ring-[3px] md:text-[13px]'
          />
          <Button type='button' size='sm' onClick={save}>
            Save
          </Button>
        </div>
      )}
    </div>
  );
}

export type FieldListProps = {
  shown: number;
  activeId: FieldId | null;
  pressed: string | null;
  valueOf: (field: ExtractField) => string;
  reviewOf: (id: FieldId) => ReviewStatus;
  onPoint: (id: FieldId | null) => void;
  onPick: (id: FieldId) => void;
  onConfirm: (id: FieldId) => void;
  onEdit: (id: FieldId, value: string) => void;
};

export function FieldList({
  shown,
  activeId,
  pressed,
  valueOf,
  reviewOf,
  onPoint,
  onPick,
  onConfirm,
  onEdit,
}: FieldListProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const fields = FIELDS.slice(0, shown);

  return (
    <ul aria-label='Fields read from the document' className='flex flex-col'>
      <AnimatePresence initial={false}>
        {fields.map((field) => {
          const review = reviewOf(field.id);
          const value = valueOf(field);
          const needsLook = isLowConfidence(field) && review === 'pending';
          const chipText = chipTextOf(field, review);
          return (
            <motion.li
              key={field.id}
              className='overflow-hidden'
              {...rowPresence}
            >
              <div
                className={cn(
                  'rounded-lg transition-colors duration-150',
                  rowToneOf(activeId === field.id)
                )}
              >
                <button
                  type='button'
                  data-row={field.id}
                  onMouseEnter={() => onPoint(field.id)}
                  onMouseLeave={() => onPoint(null)}
                  onFocus={() => onPoint(field.id)}
                  onBlur={() => onPoint(null)}
                  onClick={() => onPick(field.id)}
                  className='focus-visible:ring-ring/25 flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-start outline-none focus-visible:ring-[3px]'
                >
                  <span className='flex min-w-0 flex-1 flex-col leading-tight'>
                    <span className='text-muted-foreground text-xs'>
                      {field.label}
                    </span>
                    <span className='truncate text-[13px] font-medium tabular-nums'>
                      {value}
                    </span>
                  </span>
                  <Badge variant={confidenceVariantOf(field, review)}>
                    <Swap swapKey={chipText} className='tabular-nums'>
                      {chipText}
                    </Swap>
                  </Badge>
                </button>
                <Fold open={needsLook}>
                  <FlaggedBody
                    field={field}
                    value={value}
                    isPressed={pressed === `confirm-${field.id}`}
                    onConfirm={onConfirm}
                    onEdit={onEdit}
                  />
                </Fold>
              </div>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}

function typedValueOf(field: ExtractField, value: string) {
  if (field.type === 'number') {
    return Number(value);
  }
  return value;
}

export function JsonPanel({
  shown,
  valueOf,
}: {
  shown: number;
  valueOf: (field: ExtractField) => string;
}) {
  const record: Record<string, string | number> = {};
  for (const field of FIELDS.slice(0, shown)) {
    record[field.id] = typedValueOf(field, valueOf(field));
  }

  return <JsonView value={record} className='text-xs' />;
}

export function SchemaPanel() {
  return (
    <ul aria-label='Schema' className='flex flex-col'>
      {FIELDS.map((field) => (
        <li
          key={field.id}
          className='flex h-9 items-center justify-between gap-3 px-2 text-[13px]'
        >
          <code className='truncate font-mono text-xs'>{field.id}</code>
          <Badge variant='secondary' className='font-mono'>
            {field.type}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
