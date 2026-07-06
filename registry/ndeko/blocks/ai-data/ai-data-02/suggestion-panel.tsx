'use client';

import { pressedSolidOf } from '@/registry/ndeko/lib/demonstration';
import {
  CircleCheckIcon,
  LoaderIcon,
  UndoIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { LetterTile } from '@/registry/ndeko/ui/letter-tile';

import { guestNamesOf, requestLineOf } from './ask';
import { dayOf, EXAMPLES, timeRangeOf } from './data';
import type { Slot, Suggestion } from './find';
import { slotLineOf, type Booking, type Search } from './session';

/**
 * Each time offered arrives a little after the one ranked above it. The wait is on the fade only:
 * the tint that answers the pointer never waits.
 */
const ARRIVAL_DELAY = ['delay-0', 'delay-[0ms,75ms]', 'delay-[0ms,150ms]'];

const ROW =
  'flex items-center gap-2.5 rounded-lg p-2 transition-[background-color,opacity] duration-[150ms,300ms] starting:opacity-0';

const EXAMPLE =
  'focus-visible:ring-ring/25 hover:bg-foreground/[0.05] w-full cursor-pointer rounded-lg px-2.5 py-2 text-start text-[13px] leading-5 text-pretty transition-colors duration-150 outline-none focus-visible:ring-[3px]';

function rowToneOf(isHot: boolean) {
  if (isHot) {
    return 'bg-foreground/[0.05]';
  }
  return undefined;
}

/** The best time carries the one primary action of the block. */
function bookVariantOf(rank: number) {
  if (rank === 1) {
    return 'default';
  }
  return 'outline';
}

function calendarsWordOf(count: number) {
  if (count === 1) {
    return '1 calendar';
  }
  return `${count} calendars`;
}

/** Thu 19, 11:00 to 11:45. */
function slotLabelOf(slot: Slot) {
  const day = dayOf(slot.day);
  return `${day.label} ${day.date}, ${timeRangeOf(slot.start, slot.end)}`;
}

type ExamplesProps = {
  onExample: (text: string) => void;
};

function Examples({ onExample }: ExamplesProps) {
  return (
    <div className='flex flex-col gap-1.5'>
      <p className='text-muted-foreground px-2.5 text-xs'>
        Ask in your own words, or start from one of these
      </p>
      <ul className='flex flex-col'>
        {EXAMPLES.map((example) => (
          <li key={example}>
            <button
              type='button'
              onClick={() => onExample(example)}
              className={EXAMPLE}
            >
              {example}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

type SuggestionRowProps = {
  suggestion: Suggestion;
  isHot: boolean;
  isPressed: boolean;
  onHover: (rank: number | null) => void;
  onBook: (rank: number) => void;
};

function SuggestionRow({
  suggestion,
  isHot,
  isPressed,
  onHover,
  onBook,
}: SuggestionRowProps) {
  const { rank } = suggestion;

  return (
    <li
      onPointerEnter={() => onHover(rank)}
      onPointerLeave={() => onHover(null)}
      className={cn(ROW, ARRIVAL_DELAY[rank - 1], rowToneOf(isHot))}
    >
      <LetterTile initial={String(rank)} />
      <div className='flex min-w-0 flex-1 flex-col'>
        <p className='truncate text-[13px] leading-5 font-medium tabular-nums'>
          {slotLabelOf(suggestion)}
        </p>
        <p className='text-muted-foreground text-xs text-pretty'>
          {suggestion.reason}
        </p>
      </div>
      <Button
        type='button'
        size='sm'
        variant={bookVariantOf(rank)}
        data-book={rank}
        aria-label={`Book ${slotLineOf(suggestion)}`}
        onClick={() => onBook(rank)}
        onFocus={() => onHover(rank)}
        onBlur={() => onHover(null)}
        className={pressedSolidOf(isPressed)}
      >
        Book
      </Button>
    </li>
  );
}

type BookedProps = {
  booking: Booking;
  onUndo: () => void;
};

/** The bar under the card empties over the five seconds the undo stays. */
function Booked({ booking, onUndo }: BookedProps) {
  const guests = guestNamesOf(booking.attendees);

  return (
    <div className='bg-success/10 relative flex flex-col gap-2.5 overflow-hidden rounded-lg p-3 transition-opacity duration-200 starting:opacity-0'>
      <div className='flex items-start gap-2'>
        <CircleCheckIcon className='text-success-foreground mt-0.5 size-4 shrink-0' />
        <div className='flex min-w-0 flex-col'>
          <p className='text-[13px] leading-5 font-medium tabular-nums'>
            Booked {slotLabelOf(booking)}
          </p>
          <p className='text-xs'>With {guests}, on every calendar</p>
        </div>
      </div>
      <div className='flex items-center gap-2 ps-6'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          data-undo={booking.id}
          onClick={onUndo}
        >
          <UndoIcon />
          Undo
        </Button>
        <span className='text-xs'>for 5 seconds</span>
      </div>
      <span
        aria-hidden='true'
        className='bg-success/60 absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 transition-transform duration-[5000ms] ease-linear motion-reduce:hidden starting:scale-x-100'
      />
    </div>
  );
}

export type SuggestionPanelProps = {
  search: Search | null;
  hot: number | null;
  /** The meeting that can still be undone. */
  booking: Booking | null;
  pressed: string | null;
  onExample: (text: string) => void;
  onHover: (rank: number | null) => void;
  onBook: (rank: number) => void;
  onUndo: () => void;
  onClear: () => void;
};

/** What the assistant says back: what it is checking, the times it found, then the one that was booked. */
export function SuggestionPanel({
  search,
  hot,
  booking,
  pressed,
  onExample,
  onHover,
  onBook,
  onUndo,
  onClear,
}: SuggestionPanelProps) {
  if (!search) {
    return <Examples onExample={onExample} />;
  }
  const requestLine = requestLineOf(search.request);

  if (search.status === 'shading') {
    const calendars = calendarsWordOf(search.request.attendees.length);
    return (
      <div className='flex flex-col gap-1 px-2.5 py-2'>
        <p className='flex items-center gap-2 text-[13px] leading-5 font-medium'>
          <LoaderIcon
            aria-hidden='true'
            className='text-muted-foreground size-4 animate-spin'
          />
          Checking {calendars}
        </p>
        <p className='text-muted-foreground ps-6 text-xs'>{requestLine}</p>
      </div>
    );
  }

  if (search.status === 'booked') {
    if (!booking) {
      return null;
    }
    return <Booked key={booking.id} booking={booking} onUndo={onUndo} />;
  }

  return (
    <div className='flex flex-col gap-1.5'>
      <div className='flex items-center gap-2 ps-2.5'>
        <p className='text-muted-foreground min-w-0 flex-1 truncate text-xs'>
          {requestLine}
        </p>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          data-search-clear
          onClick={onClear}
          className='text-muted-foreground'
        >
          Clear
        </Button>
      </div>
      <ol aria-label='Times found' className='flex flex-col gap-0.5'>
        {search.suggestions.map((suggestion) => (
          <SuggestionRow
            key={suggestion.rank}
            suggestion={suggestion}
            isHot={hot === suggestion.rank}
            isPressed={pressed === `book-${suggestion.rank}`}
            onHover={onHover}
            onBook={onBook}
          />
        ))}
      </ol>
    </div>
  );
}
