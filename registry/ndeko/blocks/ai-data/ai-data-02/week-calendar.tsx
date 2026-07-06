'use client';

import { AnimatePresence, motion, type Transition } from 'motion/react';
import { memo } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import { hatchOf } from '@/registry/ndeko/lib/hatch';
import { EASE_OUT_STRONG } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { LetterTile } from '@/registry/ndeko/ui/letter-tile';

import {
  clockOf,
  DAYS,
  EVENTS,
  HOURS,
  personOf,
  timeRangeOf,
  TODAY,
  type CalendarEvent,
  type Day,
  type DayId,
  type PersonId,
} from './data';
import { busyBandsOf, type Busy, type Slot, type Suggestion } from './find';
import { boxOf, placesOf, type Box, type Place, type Timed } from './layout';
import { slotLineOf, type Booking, type Search } from './session';

type PersonStyle = React.CSSProperties & { '--person': string };

/** A block shorter than this only has room for its title. */
const TWO_LINES_FROM_MINUTES = 45;

const BUSY_HATCH = hatchOf('var(--foreground)', 20);

/** The busy time of one day is shaded a little after the day before it. */
const SHADE_STAGGER_MS = 70;

/** The times offered land one after the other, the best first. */
const LANDING_STAGGER = 0.08;

const GRID =
  'grid grid-cols-[2.75rem_minmax(0,1fr)] @3xl:grid-cols-[2.75rem_repeat(5,minmax(0,1fr))]';

const BLOCK =
  'relative flex h-full flex-col overflow-hidden rounded-[5px] py-0.5 ps-2.5 pe-1.5 text-[11px] leading-4';

const SOLID = 'bg-[color-mix(in_oklab,var(--person)_16%,var(--card))]';

const GHOST =
  'hairline-border focus-visible:ring-ring/25 flex h-full w-full cursor-pointer items-start gap-1.5 overflow-hidden rounded-[5px] border-dashed px-1.5 py-0.5 text-start text-[11px] leading-4 font-medium tabular-nums outline-none transition-[background-color,border-color] duration-150 focus-visible:ring-[3px]';

function ghostToneOf(isHot: boolean) {
  if (isHot) {
    return 'border-primary bg-primary/[0.16] text-primary-ink';
  }
  return 'border-primary/50 bg-primary/[0.06] text-primary-ink';
}

function slotIdOf(slot: Slot) {
  return `${slot.day}-${slot.start}-${slot.end}`;
}

/** What sits on top of the meetings of a day: a time that is offered, or the meeting it became. */
type SlotItem = Timed & {
  suggestion: Suggestion | null;
  booking: Booking | null;
};

function offerItemOf(suggestion: Suggestion): SlotItem {
  return {
    id: slotIdOf(suggestion),
    start: suggestion.start,
    end: suggestion.end,
    suggestion,
    booking: null,
  };
}

function bookingItemOf(booking: Booking): SlotItem {
  return {
    id: slotIdOf(booking),
    start: booking.start,
    end: booking.end,
    suggestion: null,
    booking,
  };
}

/** The times are on the calendar only while they are offered. */
function offersOn(search: Search | null, day: DayId) {
  if (search?.status !== 'offering') {
    return [];
  }
  return search.suggestions.filter((suggestion) => suggestion.day === day);
}

function isAskedFor(search: Search | null, day: DayId) {
  if (!search) {
    return false;
  }
  return search.request.days.includes(day);
}

/** While a question is open, the days it does not ask about step back. */
function dimOf(isSetAside: boolean) {
  if (isSetAside) {
    return 'opacity-40';
  }
  return 'opacity-100';
}

function shadeOf(isShaded: boolean) {
  if (isShaded) {
    return 'opacity-100';
  }
  return 'opacity-0';
}

function eventVisibilityOf(isShown: boolean) {
  if (isShown) {
    return 'opacity-100';
  }
  return 'pointer-events-none opacity-0';
}

/** A narrow page shows the picked day alone; a wide one shows the week. */
function dayVisibilityOf(isPicked: boolean) {
  if (isPicked) {
    return 'block';
  }
  return 'hidden @3xl:block';
}

function EventBlock({
  title,
  start,
  end,
  person,
}: Pick<CalendarEvent, 'title' | 'start' | 'end' | 'person'>) {
  const owner = personOf(person);
  const style: PersonStyle = { '--person': seriesColorOf(owner.series) };
  const hasRoomForTime = end - start >= TWO_LINES_FROM_MINUTES;

  return (
    <div style={style} className={cn(BLOCK, SOLID)}>
      <span
        aria-hidden='true'
        className='absolute inset-y-0 start-0 w-[3px] bg-(--person)'
      />
      <p className='truncate font-medium'>
        <span className='sr-only'>{owner.shortName}: </span>
        {title}
      </p>
      {hasRoomForTime && (
        <p className='truncate tabular-nums'>{timeRangeOf(start, end)}</p>
      )}
      {!hasRoomForTime && (
        <span className='sr-only'>{timeRangeOf(start, end)}</span>
      )}
    </div>
  );
}

const SLOT_EXIT = {
  opacity: 0,
  scale: 0.96,
  transition: { duration: 0.12, ease: EASE_OUT_STRONG },
};

const SLOT_FADE_EXIT = { opacity: 0, transition: { duration: 0.12 } };

const SLOT_FADE_START = { opacity: 0 };

const SLOT_START = { opacity: 0, scale: 1.04 };

const SLOT_FADE_TARGET = { opacity: 1 };

const SLOT_TARGET = { opacity: 1, scale: 1 };

const SLOT_BOOKED_TARGET = { opacity: 1, scale: [1.04, 1] };

function slotStartOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return SLOT_FADE_START;
  }
  return SLOT_START;
}

/** A time that is booked settles again, from a slightly larger size, as it turns solid. */
function slotTargetOf(isBooked: boolean, shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return SLOT_FADE_TARGET;
  }
  if (isBooked) {
    return SLOT_BOOKED_TARGET;
  }
  return SLOT_TARGET;
}

function slotExitOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return SLOT_FADE_EXIT;
  }
  return SLOT_EXIT;
}

function slotTransitionOf(suggestion: Suggestion | null): Transition {
  const settle = { duration: 0.3, ease: EASE_OUT_STRONG };
  if (!suggestion) {
    return settle;
  }
  const delay = (suggestion.rank - 1) * LANDING_STAGGER;
  return { ...settle, delay };
}

function boxStyleOf(box: Box): React.CSSProperties {
  return { top: box.top, height: box.height, left: box.left, width: box.width };
}

function ghostLabelOf(suggestion: Suggestion) {
  const when = slotLineOf(suggestion);
  return `Book suggestion ${suggestion.rank}: ${when}. ${suggestion.reason}`;
}

type BookedBlockProps = {
  booking: Booking;
  shown: PersonId[];
};

/** A meeting booked here sits on the calendar of everyone in it: it shows while one of them does. */
function BookedBlock({ booking, shown }: BookedBlockProps) {
  const isShown = booking.attendees.some((person) => shown.includes(person));

  return (
    <div
      aria-hidden={!isShown}
      className={cn(
        'h-full transition-opacity duration-200',
        eventVisibilityOf(isShown)
      )}
    >
      <EventBlock
        title={booking.title}
        start={booking.start}
        end={booking.end}
        person='you'
      />
    </div>
  );
}

type SlotBlockProps = {
  item: SlotItem;
  place: Place | undefined;
  shown: PersonId[];
  hot: number | null;
  onHover: (rank: number | null) => void;
  onBook: (rank: number) => void;
};

/**
 * One element from the dashed offer to the solid meeting: only its look changes when it is booked.
 * It never gets shorter than its number, however short the meeting asked for.
 */
function SlotBlock({
  item,
  place,
  shown,
  hot,
  onHover,
  onBook,
}: SlotBlockProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const { suggestion, booking } = item;
  const isBooked = booking !== null;
  const box = boxOf(item, place);

  return (
    <motion.div
      initial={slotStartOf(shouldReduceMotion)}
      animate={slotTargetOf(isBooked, shouldReduceMotion)}
      exit={slotExitOf(shouldReduceMotion)}
      transition={slotTransitionOf(suggestion)}
      style={boxStyleOf(box)}
      className='absolute z-10 min-h-5 p-px'
    >
      {suggestion && (
        <button
          type='button'
          data-ghost={suggestion.rank}
          aria-label={ghostLabelOf(suggestion)}
          onClick={() => onBook(suggestion.rank)}
          onPointerEnter={() => onHover(suggestion.rank)}
          onPointerLeave={() => onHover(null)}
          onFocus={() => onHover(suggestion.rank)}
          onBlur={() => onHover(null)}
          className={cn(GHOST, ghostToneOf(hot === suggestion.rank))}
        >
          <LetterTile initial={String(suggestion.rank)} size='sm' />
          <span className='min-w-0 truncate'>
            {timeRangeOf(suggestion.start, suggestion.end)}
          </span>
        </button>
      )}
      {booking && <BookedBlock booking={booking} shown={shown} />}
    </motion.div>
  );
}

type DayColumnProps = {
  day: Day;
  isPicked: boolean;
  shown: PersonId[];
  search: Search | null;
  hot: number | null;
  bookings: Booking[];
  taken: Busy[];
  shadeOrder: number;
  onHover: (rank: number | null) => void;
  onBook: (rank: number) => void;
};

function DayColumn({
  day,
  isPicked,
  shown,
  search,
  hot,
  bookings,
  taken,
  shadeOrder,
  onHover,
  onBook,
}: DayColumnProps) {
  const events = EVENTS.filter((event) => event.day === day.id);
  const offers = offersOn(search, day.id);
  const dayBookings = bookings.filter((booking) => booking.day === day.id);
  const slots = [...offers.map(offerItemOf), ...dayBookings.map(bookingItemOf)];
  const places = placesOf([...events, ...slots]);
  const isSearching = search !== null && search.status !== 'booked';
  const isAsked = isAskedFor(search, day.id);
  const isSetAside = isSearching && !isAsked;
  const isShaded = isSearching && isAsked;
  let bands: Slot[] = [];
  if (search && isAsked) {
    bands = busyBandsOf(taken, search.request.attendees, day.id);
  }
  const shadeDelay = `${shadeOrder * SHADE_STAGGER_MS}ms`;

  return (
    <section
      aria-label={`${day.name} ${day.date}`}
      className={cn(
        'hairline-l border-foreground/[0.07] relative h-[27rem] min-w-0',
        dayVisibilityOf(isPicked)
      )}
    >
      <div aria-hidden='true' className='absolute inset-0 flex flex-col'>
        {HOURS.map((hour) => (
          <span
            key={hour}
            className='hairline-t border-foreground/[0.07] flex-1'
          />
        ))}
      </div>
      <div
        className={cn(
          'absolute inset-0 transition-opacity duration-300',
          dimOf(isSetAside)
        )}
      >
        <ul className='absolute inset-0'>
          {events.map((event) => {
            const isShown = shown.includes(event.person);
            const box = boxOf(event, places.get(event.id));
            return (
              <li
                key={event.id}
                aria-hidden={!isShown}
                style={boxStyleOf(box)}
                className={cn(
                  'absolute p-px transition-opacity duration-200',
                  eventVisibilityOf(isShown)
                )}
              >
                <EventBlock
                  title={event.title}
                  start={event.start}
                  end={event.end}
                  person={event.person}
                />
              </li>
            );
          })}
        </ul>
        {bands.map((band) => {
          const box = boxOf({ id: 'band', ...band }, undefined);
          return (
            <span
              key={band.start}
              aria-hidden='true'
              style={{
                top: box.top,
                height: box.height,
                backgroundImage: BUSY_HATCH,
                transitionDelay: shadeDelay,
              }}
              className={cn(
                'bg-background/45 pointer-events-none absolute inset-x-0 transition-opacity duration-300 starting:opacity-0',
                shadeOf(isShaded)
              )}
            />
          );
        })}
        <AnimatePresence initial={false}>
          {slots.map((item) => (
            <SlotBlock
              key={item.id}
              item={item}
              place={places.get(item.id)}
              shown={shown}
              hot={hot}
              onHover={onHover}
              onBook={onBook}
            />
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

function todayToneOf(isToday: boolean) {
  if (isToday) {
    return 'text-primary-ink';
  }
  return 'text-foreground';
}

export type WeekCalendarProps = {
  shown: PersonId[];
  /** The day a narrow page shows. */
  day: DayId;
  search: Search | null;
  hot: number | null;
  bookings: Booking[];
  /** The busy time of every person, which the open question shades for those it asks about. */
  taken: Busy[];
  onHover: (rank: number | null) => void;
  onBook: (rank: number) => void;
};

/** Memoised: a key typed in the question box does not lay the week out again. */
export const WeekCalendar = memo(function WeekCalendar({
  shown,
  day: pickedDay,
  search,
  hot,
  bookings,
  taken,
  onHover,
  onBook,
}: WeekCalendarProps) {
  const askedDays = search?.request.days ?? [];

  return (
    <div className='bg-card hairline-ring ring-border flex min-w-0 flex-col rounded-xl p-3 pt-2.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <div aria-hidden='true' className={cn(GRID, 'hidden pb-2 @3xl:grid')}>
        <span />
        {DAYS.map((day) => (
          <p key={day.id} className='flex items-baseline gap-1.5 px-2 text-xs'>
            <span className='text-muted-foreground'>{day.label}</span>
            <span
              className={cn(
                'font-medium tabular-nums',
                todayToneOf(day.id === TODAY)
              )}
            >
              {day.date}
            </span>
          </p>
        ))}
      </div>
      <div className={GRID}>
        <div aria-hidden='true' className='flex h-[27rem] flex-col'>
          {HOURS.map((hour) => (
            <span
              key={hour}
              className='text-muted-foreground flex-1 pe-2 pt-1 text-end text-[11px] leading-none tabular-nums'
            >
              {clockOf(hour * 60)}
            </span>
          ))}
        </div>
        {DAYS.map((day) => (
          <DayColumn
            key={day.id}
            day={day}
            isPicked={day.id === pickedDay}
            shown={shown}
            search={search}
            hot={hot}
            bookings={bookings}
            taken={taken}
            shadeOrder={askedDays.indexOf(day.id)}
            onHover={onHover}
            onBook={onBook}
          />
        ))}
      </div>
    </div>
  );
});
