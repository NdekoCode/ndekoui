'use client';

import { Fragment } from 'react';

import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import { pressedSolidOf } from '@/registry/ndeko/lib/demonstration';
import { BookOpenIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';

import { ARTICLES, DRAFT_TOKENS, WRITER, type Article } from './data';
import { DRAFT_WORD_MS } from './session';
import {
  inkClassOf,
  leadingSpaceOf,
  shownCountOf,
  StreamCaret,
  useRevealedCount,
} from './stream';
import { countOf } from './words';

const MARK =
  'keycap-3d text-muted-foreground inline-flex h-4 min-w-4 items-center justify-center rounded-[4px] px-1 text-[10px] leading-none font-medium tabular-nums';

/** Each source lands a little after the one before it. */
const LANDING_DELAY = ['delay-0', 'delay-100', 'delay-200'];

function statusOf(isStreaming: boolean) {
  if (isStreaming) {
    return 'Writing';
  }
  return countOf(ARTICLES.length, 'source');
}

/** A source waits out of sight while the draft streams, then settles from a slightly larger size. */
function landingOf(hasLanded: boolean) {
  if (hasLanded) {
    return 'scale-100 opacity-100';
  }
  return 'invisible scale-[1.04] opacity-0';
}

type SourceChipProps = {
  article: Article;
  order: number;
  hasLanded: boolean;
};

function SourceChip({ article, order, hasLanded }: SourceChipProps) {
  return (
    <li
      className={cn(
        'bg-card dark:bg-foreground/[0.06] flex h-7 max-w-full items-center gap-1.5 rounded-full ps-1.5 pe-2.5 text-xs transition-[opacity,scale] duration-300 ease-(--ease-out-strong)',
        LANDING_DELAY[order],
        landingOf(hasLanded)
      )}
    >
      <span className={cn(MARK, 'rounded-full')}>{article.number}</span>
      <BookOpenIcon className='text-muted-foreground size-3.5 shrink-0' />
      <span className='min-w-0 truncate'>{article.title}</span>
    </li>
  );
}

type DraftCardProps = {
  isStreaming: boolean;
  isActive: boolean;
  isInsertPressed: boolean;
  onInsert: () => void;
  onEdit: () => void;
  onDiscard: () => void;
};

/** Only the draft re-renders while it streams. */
export function DraftCard({
  isStreaming,
  isActive,
  isInsertPressed,
  onInsert,
  onEdit,
  onDiscard,
}: DraftCardProps) {
  const total = DRAFT_TOKENS.length;
  const isRunning = isStreaming && isActive;
  const count = useRevealedCount(total, isRunning, DRAFT_WORD_MS);
  const shown = shownCountOf(isStreaming, count, total);
  const lastShown = shown - 1;
  const status = statusOf(isStreaming);

  return (
    <section
      aria-label='Draft from the copilot'
      className='bg-foreground/[0.04] flex flex-col gap-2.5 rounded-lg p-3'
    >
      <header className='flex items-center gap-2'>
        <MeshTile seed={WRITER.name} color={seriesColorOf(WRITER.series)} />
        <h2 className='min-w-0 flex-1 truncate text-[13px] font-medium'>
          Draft from the copilot
        </h2>
        <Swap swapKey={status} className='text-muted-foreground text-xs'>
          {status}
        </Swap>
      </header>
      <p className='text-[13px] leading-relaxed'>
        {DRAFT_TOKENS.map((token, index) => {
          const isShown = index < shown;
          const ink = inkClassOf(isStreaming, isShown);
          if (token.kind === 'cite') {
            return (
              <span
                key={index}
                className={cn(MARK, 'ms-1 align-[0.12em]', ink)}
              >
                <span className='sr-only'>Source </span>
                {token.article}
              </span>
            );
          }
          const hasCaret = isStreaming && index === lastShown;
          return (
            <Fragment key={index}>
              {leadingSpaceOf(index)}
              <span className={ink}>
                {token.text}
                {hasCaret && <StreamCaret />}
              </span>
            </Fragment>
          );
        })}
      </p>
      <ul aria-label='Sources of the draft' className='flex flex-wrap gap-1.5'>
        {ARTICLES.map((article, index) => (
          <SourceChip
            key={article.number}
            article={article}
            order={index}
            hasLanded={!isStreaming}
          />
        ))}
      </ul>
      <div className='flex flex-wrap items-center gap-2'>
        <Button
          type='button'
          size='sm'
          aria-label='Insert the draft'
          disabled={isStreaming}
          onClick={onInsert}
          className={pressedSolidOf(isInsertPressed)}
        >
          Insert
        </Button>
        <Button
          type='button'
          size='sm'
          variant='outline'
          aria-label='Edit the draft'
          disabled={isStreaming}
          onClick={onEdit}
        >
          Edit
        </Button>
        <Button
          type='button'
          size='sm'
          variant='ghost'
          aria-label='Discard the draft'
          disabled={isStreaming}
          onClick={onDiscard}
          className='text-muted-foreground'
        >
          Discard
        </Button>
      </div>
    </section>
  );
}
