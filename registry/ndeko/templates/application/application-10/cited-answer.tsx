'use client';

import { Fragment, useState } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';

import { ANSWER_TOKENS, SOURCES, type AnswerToken, type Source } from './data';
import { ANSWER_WORD_MS } from './session';
import {
  inkClassOf,
  leadingSpaceOf,
  shownCountOf,
  StreamCaret,
  useRevealedCount,
} from './stream';

const FALLBACK_SOURCE = SOURCES[0];

function sourceOf(number: number) {
  const source = SOURCES.find((candidate) => candidate.number === number);
  return source ?? FALLBACK_SOURCE;
}

function isCiteOf(token: AnswerToken, number: number) {
  return token.kind === 'cite' && token.source === number;
}

/** A source shows under the answer once its first mark has streamed in. */
function firstMarkOf(source: Source) {
  return ANSWER_TOKENS.findIndex((token) => isCiteOf(token, source.number));
}

function litOverlayOf(isLit: boolean) {
  if (isLit) {
    return 'opacity-100';
  }
  return 'opacity-0';
}

function litTextOf(isLit: boolean) {
  if (isLit) {
    return 'text-primary-ink';
  }
  return 'text-muted-foreground';
}

function toggledPin(current: number | null, number: number) {
  if (current === number) {
    return null;
  }
  return number;
}

type CitationMarkProps = {
  source: Source;
  isShown: boolean;
  isStreaming: boolean;
  isLit: boolean;
  isPinned: boolean;
  onHover: (number: number | null) => void;
  onPin: (number: number) => void;
};

function CitationMark({
  source,
  isShown,
  isStreaming,
  isLit,
  isPinned,
  onHover,
  onPin,
}: CitationMarkProps) {
  function light() {
    onHover(source.number);
  }

  function dim() {
    onHover(null);
  }

  function pin() {
    onPin(source.number);
  }

  return (
    <button
      type='button'
      aria-pressed={isPinned}
      aria-label={`Source ${source.number}: ${source.title}, ${source.product}`}
      onPointerEnter={light}
      onPointerLeave={dim}
      onFocus={light}
      onBlur={dim}
      onClick={pin}
      className={cn(
        'keycap-3d focus-visible:ring-ring/25 relative ms-1 inline-flex h-4 min-w-4 cursor-pointer items-center justify-center rounded-[4px] px-1 align-[0.12em] text-[10px] leading-none font-medium tabular-nums transition-colors duration-150 outline-none focus-visible:ring-[3px]',
        litTextOf(isLit),
        inkClassOf(isStreaming, isShown)
      )}
    >
      <span
        aria-hidden='true'
        className={cn(
          'bg-primary/15 pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-150',
          litOverlayOf(isLit)
        )}
      />
      <span className='relative'>{source.number}</span>
    </button>
  );
}

type SourcePillProps = {
  source: Source;
  isShown: boolean;
  isStreaming: boolean;
  isLit: boolean;
};

function SourcePill({ source, isShown, isStreaming, isLit }: SourcePillProps) {
  return (
    <li
      className={cn(
        'bg-foreground/[0.05] relative flex h-7 max-w-full items-center gap-1.5 overflow-hidden rounded-full ps-1 pe-1.5 text-xs',
        inkClassOf(isStreaming, isShown)
      )}
    >
      <span
        aria-hidden='true'
        className={cn(
          'bg-primary/12 pointer-events-none absolute inset-0 transition-opacity duration-150',
          litOverlayOf(isLit)
        )}
      />
      <BrandTile
        brand={source.brand}
        title={source.product}
        className='relative rounded-full'
      />
      <span
        className={cn(
          'relative min-w-0 truncate transition-colors duration-150',
          litTextOf(isLit)
        )}
      >
        {source.title}
      </span>
      <span className='keycap-3d text-muted-foreground relative inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full px-1 text-[10px] tabular-nums'>
        {source.number}
      </span>
    </li>
  );
}

type CitedAnswerProps = {
  isStreaming: boolean;
  isActive: boolean;
  demoLitSource: number | null;
};

/** Only the answer re-renders while it streams. */
export function CitedAnswer({
  isStreaming,
  isActive,
  demoLitSource,
}: CitedAnswerProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const total = ANSWER_TOKENS.length;
  const isRunning = isStreaming && isActive;
  const count = useRevealedCount(total, isRunning, ANSWER_WORD_MS);
  const shown = shownCountOf(isStreaming, count, total);
  const lastShown = shown - 1;
  const chosen = hovered ?? pinned;
  const lit = chosen ?? demoLitSource;

  function pin(number: number) {
    setPinned((current) => toggledPin(current, number));
  }

  return (
    <div className='flex flex-col gap-3'>
      <p className='text-sm leading-relaxed'>
        {ANSWER_TOKENS.map((token, index) => {
          const isShown = index < shown;
          if (token.kind === 'cite') {
            return (
              <CitationMark
                key={index}
                source={sourceOf(token.source)}
                isShown={isShown}
                isStreaming={isStreaming}
                isLit={lit === token.source}
                isPinned={pinned === token.source}
                onHover={setHovered}
                onPin={pin}
              />
            );
          }
          const hasCaret = isStreaming && index === lastShown;
          return (
            <Fragment key={index}>
              {leadingSpaceOf(index)}
              <span className={inkClassOf(isStreaming, isShown)}>
                {token.text}
                {hasCaret && <StreamCaret />}
              </span>
            </Fragment>
          );
        })}
      </p>
      <ul aria-label='Sources' className='flex flex-wrap gap-1.5'>
        {SOURCES.map((source) => {
          const firstMark = firstMarkOf(source);
          return (
            <SourcePill
              key={source.number}
              source={source}
              isShown={firstMark < shown}
              isStreaming={isStreaming}
              isLit={lit === source.number}
            />
          );
        })}
      </ul>
    </div>
  );
}
