'use client';

import { useInView } from 'motion/react';
import { useId, useRef, useState, type CSSProperties } from 'react';

import { useDocumentVisible } from '@/registry/ndeko/hooks/use-agent-run';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';
import { PauseIcon, PlayIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { Button } from '@/registry/ndeko/ui/button';
import { Card } from '@/registry/ndeko/ui/card';
import { Swap } from '@/registry/ndeko/ui/chat-motion';

import { isKeyboardArrival } from './_parts/keys';

export type RowTag = {
  id: string;
  label: string;
  /** A known product wears its own mark. Leave it out for a plain tag. */
  brand?: BrandSlug;
};

type RowStyle = CSSProperties & { '--marquee-duration': string };

/** One full turn of a row, in seconds. Each row has its own, so two rows never move as one. */
const ROW_SECONDS = [52, 64, 58];

/** A row holds at least this many tags per half, so a short list still fills the card from edge to edge. */
const MIN_TAGS_PER_HALF = 8;

const FADED_EDGES =
  '[mask-image:linear-gradient(to_right,transparent,black_3rem,black_calc(100%_-_3rem),transparent)]';

const TRACK =
  'flex w-max animate-marquee group-hover/tags:[animation-play-state:paused]';

const HALF = 'flex shrink-0 gap-2 pe-2';

const TAG =
  'bg-foreground/[0.05] inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[13px] whitespace-nowrap';

const BRAND_TAG = 'ps-1';

function durationOf(rowIndex: number) {
  const slot = rowIndex % ROW_SECONDS.length;
  const seconds = ROW_SECONDS[slot];
  return `${seconds}s`;
}

function copiesOf(tagCount: number) {
  if (tagCount === 0) {
    return 0;
  }
  const needed = MIN_TAGS_PER_HALF / tagCount;
  return Math.ceil(needed);
}

function directionOf(rowIndex: number) {
  const remainder = rowIndex % 2;
  const isOddRow = remainder === 1;
  if (isOddRow) {
    return '[animation-direction:reverse]';
  }
  return undefined;
}

function playStateOf(isPlaying: boolean) {
  if (isPlaying) {
    return undefined;
  }
  return '[animation-play-state:paused]';
}

function pauseLabelOf(isPaused: boolean) {
  if (isPaused) {
    return 'Play the tags';
  }
  return 'Pause the tags';
}

type TagProps = {
  tag: RowTag;
  /** A tag drawn again to fill the row or to close the loop is not read a second time. */
  isCopy: boolean;
};

function Tag({ tag, isCopy }: TagProps) {
  const hasBrand = tag.brand !== undefined;

  return (
    <li aria-hidden={isCopy} className={cn(TAG, hasBrand && BRAND_TAG)}>
      {tag.brand && <BrandTile brand={tag.brand} className='rounded-full' />}
      {tag.label}
    </li>
  );
}

type TagHalfProps = {
  tags: RowTag[];
  copies: number;
  /** The second half only closes the loop: it repeats the first and stays out of the reading order. */
  isRepeat: boolean;
};

function TagHalf({ tags, copies, isRepeat }: TagHalfProps) {
  const rounds = Array.from({ length: copies }, (_, round) => round);

  return (
    <ul aria-hidden={isRepeat} className={HALF}>
      {rounds.map((round) => {
        const isLaterRound = round > 0;
        const isCopy = isRepeat || isLaterRound;
        return tags.map((tag) => (
          <Tag key={`${round}-${tag.id}`} tag={tag} isCopy={isCopy} />
        ));
      })}
    </ul>
  );
}

type TagRowProps = {
  tags: RowTag[];
  rowIndex: number;
  isPlaying: boolean;
};

function TagRow({ tags, rowIndex, isPlaying }: TagRowProps) {
  const copies = copiesOf(tags.length);
  const rowStyle: RowStyle = { '--marquee-duration': durationOf(rowIndex) };

  return (
    <div className='flex overflow-hidden'>
      <div
        style={rowStyle}
        className={cn(TRACK, directionOf(rowIndex), playStateOf(isPlaying))}
      >
        <TagHalf tags={tags} copies={copies} isRepeat={false} />
        <TagHalf tags={tags} copies={copies} isRepeat />
      </div>
    </div>
  );
}

export type TagRowsCardProps = {
  title: string;
  description: string;
  /** Each list is one row. Odd rows drift the other way. */
  rows: RowTag[][];
  className?: string;
};

export function TagRowsCard({
  title,
  description,
  rows,
  className,
}: TagRowsCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [isPaused, setIsPaused] = useState(false);
  const isInView = useInView(cardRef, { amount: 0.3 });
  const isVisible = useDocumentVisible();
  const shouldReduceMotion = usePrefersReducedMotion();
  const isOnScreen = isInView && isVisible;
  const isPlaying = isOnScreen && !isPaused;

  function togglePause() {
    setIsPaused((current) => !current);
  }

  /** The rows hold still for someone who arrives with the keyboard, and the button then offers to play them. */
  function holdOnKeyboardFocus(event: React.FocusEvent<HTMLDivElement>) {
    if (isKeyboardArrival(event)) {
      setIsPaused(true);
    }
  }

  return (
    <Card
      ref={cardRef}
      role='group'
      aria-labelledby={titleId}
      onFocus={holdOnKeyboardFocus}
      className={cn('group/tags w-full gap-5 overflow-hidden p-0', className)}
    >
      <div className={cn('flex flex-col gap-2 pt-5', FADED_EDGES)}>
        {rows.map((tags, rowIndex) => (
          <TagRow
            key={rowIndex}
            tags={tags}
            rowIndex={rowIndex}
            isPlaying={isPlaying}
          />
        ))}
      </div>
      <div className='flex items-end justify-between gap-3 px-5 pb-5'>
        <div className='min-w-0'>
          <h3 id={titleId} className='text-sm font-medium text-balance'>
            {title}
          </h3>
          <p className='text-muted-foreground mt-1 text-[13px] leading-5'>
            {description}
          </p>
        </div>
        {!shouldReduceMotion && (
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            aria-label={pauseLabelOf(isPaused)}
            onClick={togglePause}
            className='text-muted-foreground -me-1.5 -mb-1'
          >
            <Swap swapKey={String(isPaused)}>
              {isPaused && <PlayIcon />}
              {!isPaused && <PauseIcon />}
            </Swap>
          </Button>
        )}
      </div>
    </Card>
  );
}

const ROWS: RowTag[][] = [
  [
    { id: 'github', label: 'GitHub', brand: 'github' },
    { id: 'linear', label: 'Linear', brand: 'linear' },
    { id: 'notion', label: 'Notion', brand: 'notion' },
    { id: 'figma', label: 'Figma', brand: 'figma' },
    { id: 'sentry', label: 'Sentry', brand: 'sentry' },
    { id: 'stripe', label: 'Stripe', brand: 'stripe' },
    { id: 'vercel', label: 'Vercel', brand: 'vercel' },
    { id: 'jira', label: 'Jira', brand: 'jira' },
  ],
  [
    { id: 'commits', label: 'Commits' },
    { id: 'issues', label: 'Issues' },
    { id: 'designs', label: 'Design files' },
    { id: 'errors', label: 'Errors' },
    { id: 'payments', label: 'Payments' },
    { id: 'deploys', label: 'Deploys' },
    { id: 'meetings', label: 'Meetings' },
    { id: 'documents', label: 'Documents' },
  ],
  [
    { id: 'calendar', label: 'Google Calendar', brand: 'googlecalendar' },
    { id: 'zoom', label: 'Zoom', brand: 'zoom' },
    { id: 'discord', label: 'Discord', brand: 'discord' },
    { id: 'asana', label: 'Asana', brand: 'asana' },
    { id: 'trello', label: 'Trello', brand: 'trello' },
    { id: 'zapier', label: 'Zapier', brand: 'zapier' },
    { id: 'gitlab', label: 'GitLab', brand: 'gitlab' },
    { id: 'hubspot', label: 'HubSpot', brand: 'hubspot' },
  ],
];

export default function Card06() {
  const ref = useRef<HTMLDivElement>(null);

  useKeptHeight(ref);

  return (
    <div ref={ref} className='min-h-[15.25rem] w-full max-w-[24rem]'>
      <TagRowsCard
        title='One timeline for the tools your team already uses'
        description='Commits, issues, designs and payments land in the same place, in the order they happened.'
        rows={ROWS}
      />
    </div>
  );
}
