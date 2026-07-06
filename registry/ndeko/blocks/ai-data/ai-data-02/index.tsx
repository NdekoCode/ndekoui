'use client';

import { useCallback, useId, useMemo, useRef } from 'react';

import { useSession } from '@/registry/ndeko/hooks/use-session';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import {
  pressedSolidOf,
  spokenUnless,
} from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold } from '@/registry/ndeko/ui/chat-motion';
import { Input } from '@/registry/ndeko/ui/input';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';
import { ToggleGroup, ToggleGroupItem } from '@/registry/ndeko/ui/toggle-group';

import { DAYS, EXAMPLES, PEOPLE, WEEK_LABEL, type DayId } from './data';
import {
  INITIAL,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  SCRIPT,
  takenOf,
  THINK_MS,
  UNDO_MS,
  type CalendarState,
} from './session';
import { SuggestionPanel } from './suggestion-panel';
import { WeekCalendar } from './week-calendar';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

const [ASK_EXAMPLE] = EXAMPLES;

const DAY_SEGMENTS: Segment<DayId>[] = DAYS.map((day) => ({
  value: day.id,
  label: `${day.label} ${day.date}`,
}));

type DotStyle = React.CSSProperties & { '--person': string };

function describedByOf(hasHint: boolean, hintId: string) {
  if (hasHint) {
    return hintId;
  }
  return undefined;
}

/** The meeting whose undo is still open, for the card that offers it. */
function undoableOf(state: CalendarState) {
  const booking = state.bookings.find(
    (candidate) => candidate.id === state.undoId
  );
  return booking ?? null;
}

export default function AiData02() {
  const {
    ref,
    isInView,
    isAutoplaying,
    state,
    act,
    pressed,
    isFinished,
    restart,
  } = useSession(SESSION);
  const { schedule, clearAll } = useTimeouts();
  const askId = useId();
  const hintId = useId();
  const bookingCount = useRef(0);
  const taken = useMemo(() => takenOf(state.bookings), [state.bookings]);
  const hasHint = state.askHint !== null;
  const message = spokenUnless(isAutoplaying, state.spoken);
  const canReplay = isFinished && !isAutoplaying;

  const focusLater = useCallback(
    (selector: string) => {
      requestAnimationFrame(() => {
        const target = ref.current?.querySelector<HTMLElement>(selector);
        target?.focus();
      });
    },
    [ref]
  );

  /** The busy time stays shaded for a moment before the times are offered, as it does in the demonstration. */
  function offerLater() {
    schedule(() => act({ type: 'offered' }), THINK_MS);
  }

  function ask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    act({ type: 'asked' });
    offerLater();
  }

  function askExample(text: string) {
    act({ type: 'questionTyped', text });
    act({ type: 'asked' });
    offerLater();
    focusLater('[data-ask-field]');
  }

  const hover = useCallback(
    (rank: number | null) => act({ type: 'hovered', rank }),
    [act]
  );

  /** The undo leaves with its button: a focus that sat on it goes back to the question box. */
  const expireUndo = useCallback(
    (id: string) => {
      const undoButton = ref.current?.querySelector(`[data-undo="${id}"]`);
      const hadFocus = undoButton === document.activeElement;
      act({ type: 'undoExpired', id });
      if (undoButton && hadFocus) {
        focusLater('[data-ask-field]');
      }
    },
    [ref, act, focusLater]
  );

  /** The time that was pressed is gone once it is booked, so the focus goes to Undo, the next thing a person may want. */
  const book = useCallback(
    (rank: number) => {
      bookingCount.current += 1;
      const id = `booking-${bookingCount.current}`;
      act({ type: 'booked', rank, id });
      schedule(() => expireUndo(id), UNDO_MS);
      focusLater(`[data-undo="${id}"]`);
    },
    [act, schedule, expireUndo, focusLater]
  );

  function undo() {
    act({ type: 'undone' });
    focusLater('[data-book="1"]');
  }

  function clearSearch() {
    act({ type: 'searchCleared' });
    focusLater('[data-ask-field]');
  }

  function showCalendars(values: unknown[]) {
    const kept = PEOPLE.filter((person) => values.includes(person.id));
    const shown = kept.map((person) => person.id);
    act({ type: 'calendarsShown', shown });
  }

  /** A press that waits on a timer belongs to the round it was made in. */
  function replay() {
    clearAll();
    restart();
  }

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-background text-foreground @container min-h-dvh w-full'
      >
        <div className='mx-auto flex max-w-6xl flex-col gap-4 p-4 @3xl:gap-5 @3xl:p-8'>
          <header className='flex flex-wrap items-center gap-x-3 gap-y-2'>
            <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
              <h1 className='text-lg font-semibold text-balance'>
                Week of {WEEK_LABEL}
              </h1>
              <p className='text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs'>
                Three calendars
                <Badge variant='secondary'>Illustrative</Badge>
              </p>
            </div>
            <ReplayButton
              isShown={canReplay}
              onReplay={replay}
              label='Replay'
            />
            <ToggleGroup
              multiple
              size='sm'
              aria-label='Calendars shown'
              value={state.shown}
              onValueChange={showCalendars}
            >
              {PEOPLE.map((person) => {
                const dotStyle: DotStyle = {
                  '--person': seriesColorOf(person.series),
                };
                return (
                  <ToggleGroupItem
                    key={person.id}
                    value={person.id}
                    className='gap-1.5 ps-1.5 pe-2.5 text-xs'
                  >
                    <Avatar seed={person.name} className='size-5' />
                    {person.shortName}
                    <span
                      aria-hidden='true'
                      style={dotStyle}
                      className='size-2 rounded-full bg-(--person)'
                    />
                  </ToggleGroupItem>
                );
              })}
            </ToggleGroup>
          </header>

          <div className='flex flex-col gap-4 @5xl:flex-row @5xl:items-start @5xl:gap-6'>
            <div className='flex flex-col gap-3 @5xl:w-80 @5xl:shrink-0'>
              <form onSubmit={ask} className='flex flex-col gap-1.5'>
                <div className='flex items-center gap-2'>
                  <label htmlFor={askId} className='sr-only'>
                    Ask for a time
                  </label>
                  <Input
                    id={askId}
                    data-ask-field
                    autoComplete='off'
                    placeholder={ASK_EXAMPLE}
                    value={state.question}
                    aria-invalid={hasHint}
                    aria-describedby={describedByOf(hasHint, hintId)}
                    onChange={(event) =>
                      act({ type: 'questionTyped', text: event.target.value })
                    }
                  />
                  <Button
                    type='submit'
                    className={cn(
                      'shrink-0',
                      pressedSolidOf(pressed === 'ask')
                    )}
                  >
                    Find a time
                  </Button>
                </div>
                <Fold open={hasHint}>
                  <p id={hintId} className='text-destructive-ink text-xs'>
                    {state.askHint}
                  </p>
                </Fold>
              </form>
              <div className='min-h-[14rem]'>
                <SuggestionPanel
                  search={state.search}
                  hot={state.hot}
                  booking={undoableOf(state)}
                  pressed={pressed}
                  onExample={askExample}
                  onHover={hover}
                  onBook={book}
                  onUndo={undo}
                  onClear={clearSearch}
                />
              </div>
            </div>
            <div className='flex min-w-0 flex-1 flex-col gap-3'>
              <Segments
                value={state.day}
                segments={DAY_SEGMENTS}
                onValueChange={(day) => act({ type: 'dayPicked', day })}
                label='Day shown'
                className='w-full @3xl:hidden'
              />
              <WeekCalendar
                shown={state.shown}
                day={state.day}
                search={state.search}
                hot={state.hot}
                bookings={state.bookings}
                taken={taken}
                onHover={hover}
                onBook={book}
              />
            </div>
          </div>
        </div>
        <LiveRegion message={message} />
      </div>
    </ClockGate>
  );
}
