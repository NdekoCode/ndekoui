'use client';

import { motion } from 'motion/react';
import { useId } from 'react';

import { WordRoll } from '@/components/core/word-roll';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import {
  CheckIcon,
  ChevronDownIcon,
  LinkIcon,
} from '@/registry/ndeko/lib/icons';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap, Fold } from '@/registry/ndeko/ui/chat-motion';
import { Chip } from '@/registry/ndeko/ui/chip';

import { KIND_STYLES, type Entry } from './data';
import { dayLabelOf } from './groups';
import { anchorOf } from './hash';
import { entryKeyOf } from './session';

const DETAIL_LABELS = ['Show details', 'Hide details'];

function detailLabelOf(isOpen: boolean) {
  if (isOpen) {
    return 'Hide details';
  }
  return 'Show details';
}

function chevronClassOf(isOpen: boolean) {
  if (isOpen) {
    return 'rotate-180';
  }
  return undefined;
}

type EntryRowProps = {
  entry: Entry;
  isOpen: boolean;
  isCopied: boolean;
  pressed: string | null;
  onToggle: (entryId: string) => void;
  onCopy: (entryId: string) => void;
};

export function EntryRow({
  entry,
  isOpen,
  isCopied,
  pressed,
  onToggle,
  onCopy,
}: EntryRowProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const detailsId = useId();
  const kind = KIND_STYLES[entry.kind];
  const detailLabel = detailLabelOf(isOpen);

  return (
    <motion.li
      id={anchorOf(entry.id)}
      data-anchor={entryKeyOf(entry.id)}
      {...rowPresenceOf(shouldReduceMotion)}
      className='overflow-hidden'
    >
      <article className='grid gap-2 px-1.5 py-4 @2xl:grid-cols-[6rem_minmax(0,1fr)] @2xl:gap-6'>
        <time
          dateTime={entry.date}
          className='text-muted-foreground text-[13px] tabular-nums @2xl:pt-1'
        >
          {dayLabelOf(entry.date)}
        </time>
        <div className='flex min-w-0 flex-col gap-2'>
          <div className='flex items-start gap-2'>
            <h4 className='min-w-0 flex-1 text-base font-semibold text-balance'>
              {entry.title}
            </h4>
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              aria-label={`Copy the link to ${entry.title}`}
              onClick={() => onCopy(entry.id)}
              className={cn(
                'text-muted-foreground shrink-0',
                pressedQuietOf(pressed === `copy-${entry.id}`)
              )}
            >
              <Swap swapKey={String(isCopied)}>
                {isCopied && <CheckIcon />}
                {!isCopied && <LinkIcon />}
              </Swap>
            </Button>
          </div>
          <div>
            <Chip color={kind.color}>{kind.label}</Chip>
          </div>
          <p className='text-muted-foreground text-sm text-pretty'>
            {entry.summary}
          </p>
          <Fold open={isOpen} id={detailsId}>
            <ul className='flex flex-col gap-1.5 pt-1 text-[13px]'>
              {entry.changes.map((change) => (
                <li key={change} className='flex items-baseline gap-2.5'>
                  <span
                    aria-hidden='true'
                    className='bg-foreground/25 size-1 shrink-0 -translate-y-[0.2em] rounded-full'
                  />
                  {change}
                </li>
              ))}
            </ul>
          </Fold>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            aria-expanded={isOpen}
            aria-controls={detailsId}
            onClick={() => onToggle(entry.id)}
            className={cn(
              'text-primary-ink self-start',
              pressedQuietOf(pressed === `toggle-${entry.id}`)
            )}
          >
            <WordRoll text={detailLabel} labels={DETAIL_LABELS} />
            <ChevronDownIcon
              className={cn(
                'transition-transform duration-200 ease-(--ease-out-strong)',
                chevronClassOf(isOpen)
              )}
            />
          </Button>
        </div>
      </article>
    </motion.li>
  );
}
