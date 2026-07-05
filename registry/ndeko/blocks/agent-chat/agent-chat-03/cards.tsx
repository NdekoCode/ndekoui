'use client';

import { useEffect, useState } from 'react';

import { ZapIcon } from '@/registry/ndeko/lib/icons';
import { Badge } from '@/registry/ndeko/ui/badge';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { Chip } from '@/registry/ndeko/ui/chip';
import { LetterTile } from '@/registry/ndeko/ui/letter-tile';

import {
  CARD_FIELDS,
  FIELD_TEXT,
  ISSUE_LABELS,
  typedLengthOf,
  WORKSPACE,
  type CardField,
  type CardId,
  type FieldId,
} from './data';
import { TYPE_TICK_MS } from './session';

const CHARS_PER_TICK = 2;

export type CardStatus = 'writing' | 'draft' | 'live';

const STATUS_WORD: Record<CardStatus, string> = {
  writing: 'Writing',
  draft: 'Draft',
  live: 'Live',
};

function badgeVariantOf(status: CardStatus) {
  if (status === 'live') {
    return 'success';
  }
  return 'secondary';
}

function useTypedCount(total: number, isTyping: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isTyping) {
      return;
    }
    const timer = setInterval(() => {
      setCount((current) => Math.min(total, current + CHARS_PER_TICK));
    }, TYPE_TICK_MS);
    return () => clearInterval(timer);
  }, [isTyping, total]);

  return count;
}

type TypedPart = {
  field: CardField;
  text: string;
  isCurrent: boolean;
};

/** The fields of a card are typed one after the other: each takes its share of the characters typed so far. */
function typedPartsOf(card: CardId, count: number): TypedPart[] {
  const parts: TypedPart[] = [];
  let start = 0;
  for (const field of CARD_FIELDS[card]) {
    const full = FIELD_TEXT[field.id];
    const end = start + full.length;
    const available = Math.max(0, count - start);
    const text = full.slice(0, available);
    const hasStarted = count >= start;
    const isCurrent = hasStarted && count < end;
    parts.push({ field, text, isCurrent });
    start = end;
  }
  return parts;
}

function Caret() {
  return (
    <span
      aria-hidden='true'
      className='bg-primary ms-px inline-block h-[1em] w-[2px] animate-pulse rounded-full align-[-0.15em]'
    />
  );
}

function FieldLabel({ label }: { label: string }) {
  return (
    <span className='text-muted-foreground w-16 shrink-0 text-xs leading-7'>
      {label}
    </span>
  );
}

/** Only this list re-renders while a card writes itself. */
function TypingFields({ card, isActive }: { card: CardId; isActive: boolean }) {
  const total = typedLengthOf(card);
  const count = useTypedCount(total, isActive);
  const parts = typedPartsOf(card, count);

  return (
    <div className='flex flex-col'>
      {parts.map((part) => (
        <div key={part.field.id} className='flex min-h-7 gap-3'>
          <FieldLabel label={part.field.label} />
          <span className='min-w-0 flex-1 text-[13px] leading-7'>
            {part.text}
            {part.isCurrent && <Caret />}
          </span>
        </div>
      ))}
    </div>
  );
}

type FieldsProps = {
  card: CardId;
  fields: Record<FieldId, string>;
  isLocked: boolean;
  onEdit: (id: FieldId, text: string) => void;
};

function SettledFields({ card, fields, isLocked, onEdit }: FieldsProps) {
  return (
    <div className='flex flex-col'>
      {CARD_FIELDS[card].map((field) => (
        <label key={field.id} className='flex min-h-7 gap-3'>
          <FieldLabel label={field.label} />
          {isLocked && (
            <span className='min-w-0 flex-1 text-[13px] leading-7'>
              {fields[field.id]}
            </span>
          )}
          {!isLocked && (
            <input
              value={fields[field.id]}
              onChange={(event) => onEdit(field.id, event.target.value)}
              className='hover:bg-foreground/[0.04] focus-visible:bg-card focus-visible:ring-ring/25 -mx-1.5 h-7 min-w-0 flex-1 rounded-md bg-transparent px-1.5 text-base transition-[background-color,box-shadow] duration-150 outline-none focus-visible:ring-[3px] md:text-[13px]'
            />
          )}
        </label>
      ))}
    </div>
  );
}

function CardMark({ card }: { card: CardId }) {
  if (card === 'issue') {
    return <BrandTile brand='linear' size='lg' />;
  }
  if (card === 'post') {
    return <LetterTile initial={WORKSPACE.initial} size='lg' />;
  }
  return (
    <span
      aria-hidden='true'
      className='keycap-3d text-muted-foreground inline-flex size-7 shrink-0 items-center justify-center rounded-md'
    >
      <ZapIcon className='size-3.5' />
    </span>
  );
}

const CARD_TITLE: Record<CardId, string> = {
  rule: 'Automation rule',
  issue: 'Linear issue',
  post: WORKSPACE.name,
};

const CARD_KIND: Record<CardId, string> = {
  rule: 'Runs on every new message',
  issue: 'Opened by the rule',
  post: 'Posted by the rule',
};

type CanvasCardProps = FieldsProps & {
  status: CardStatus;
  /** False while the block is off screen: the typing holds. */
  isActive: boolean;
};

export function CanvasCard({
  card,
  status,
  isActive,
  fields,
  isLocked,
  onEdit,
}: CanvasCardProps) {
  const isWriting = status === 'writing';
  const showsLabels = card === 'issue' && !isWriting;

  return (
    <article className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] flex flex-col gap-3 rounded-xl p-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <header className='flex items-center gap-2.5'>
        <CardMark card={card} />
        <div className='flex min-w-0 flex-1 flex-col leading-tight'>
          <h3 className='truncate text-sm font-medium'>{CARD_TITLE[card]}</h3>
          <span className='text-muted-foreground truncate text-xs'>
            {CARD_KIND[card]}
          </span>
        </div>
        <Badge variant={badgeVariantOf(status)}>
          <Swap swapKey={status}>{STATUS_WORD[status]}</Swap>
        </Badge>
      </header>
      {isWriting && <TypingFields card={card} isActive={isActive} />}
      {!isWriting && (
        <SettledFields
          card={card}
          fields={fields}
          isLocked={isLocked}
          onEdit={onEdit}
        />
      )}
      {showsLabels && (
        <ul aria-label='Labels' className='flex flex-wrap gap-1.5 ps-[4.75rem]'>
          {ISSUE_LABELS.map((label) => (
            <li
              key={label.name}
              className='transition-[opacity,scale] duration-300 ease-(--ease-out-strong) starting:scale-90 starting:opacity-0'
            >
              <Chip color={label.color}>{label.name}</Chip>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
