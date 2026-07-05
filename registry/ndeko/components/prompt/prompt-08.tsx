'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll } from '@/components/core/word-roll';
import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import {
  CalendarIcon,
  CircleCheckIcon,
  MapPinIcon,
  WalletIcon,
  XIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import {
  fadePresence,
  rowPresenceOf,
  springOf,
} from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import {
  hold,
  keyDelayOf,
  prefixesOf,
  PRESS_LEAD_MS,
  pressedQuietOf,
  spokenUnless,
  usePress,
} from './_parts/demonstration';
import { useAutosize } from './_parts/use-autosize';
import { nounOf } from './_parts/words';

export type OrderStatus =
  'paid' | 'pending' | 'shipped' | 'refunded' | 'cancelled';

export type Order = {
  id: string;
  customer: string;
  country: string;
  /** ISO day, 2026-03-10. */
  placedOn: string;
  amount: number;
  status: OrderStatus;
};

type FilterKind = 'amount' | 'period' | 'country' | 'status';

type PeriodKind =
  | 'today'
  | 'yesterday'
  | 'this-week'
  | 'last-week'
  | 'last-7-days'
  | 'this-month'
  | 'last-month';

export type WeekReading = 'calendar' | 'rolling';

export type AskFilterHandle = {
  /** Replaces the question, as typing in the field does. */
  type: (text: string) => void;
  /** Shows a button held down: `week:rolling`, `week:calendar` or `chip:` and the key of a filter. */
  press: (key: string) => void;
  answerWeek: (reading: WeekReading) => void;
  /** Removes a filter by its key, as the cross of its chip does. */
  remove: (key: string) => void;
  /** A new question with nothing removed and nothing answered yet. */
  reset: (text: string) => void;
};

type DayRange = {
  from: string;
  to: string;
};

type Phrase = {
  start: number;
  end: number;
  text: string;
};

type FilterDetail =
  | { kind: 'amount'; isOver: boolean; value: number }
  | { kind: 'period'; period: PeriodKind }
  | { kind: 'country'; country: string }
  | { kind: 'status'; status: OrderStatus };

export type ParsedFilter = FilterDetail & {
  key: string;
  phrase: Phrase;
};

type Matcher = {
  pattern: RegExp;
  detailOf: (match: RegExpMatchArray) => FilterDetail;
};

function amountOf(digits: string, thousands: string | undefined) {
  const plain = digits.replace(/,/g, '');
  const value = Number(plain);
  if (thousands) {
    return value * 1000;
  }
  return value;
}

function periodMatcher(period: PeriodKind, pattern: RegExp): Matcher {
  return { pattern, detailOf: () => ({ kind: 'period', period }) };
}

function countryMatcher(country: string, pattern: RegExp): Matcher {
  return { pattern, detailOf: () => ({ kind: 'country', country }) };
}

function statusMatcher(status: OrderStatus, pattern: RegExp): Matcher {
  return { pattern, detailOf: () => ({ kind: 'status', status }) };
}

const MATCHERS: Matcher[] = [
  {
    pattern:
      /\b(?:over|above|more than|greater than|at least)\s+\$?(\d[\d,]*)(k)?\b/gi,
    detailOf: (match) => ({
      kind: 'amount',
      isOver: true,
      value: amountOf(match[1] ?? '0', match[2]),
    }),
  },
  {
    pattern: /\b(?:under|below|less than|at most)\s+\$?(\d[\d,]*)(k)?\b/gi,
    detailOf: (match) => ({
      kind: 'amount',
      isOver: false,
      value: amountOf(match[1] ?? '0', match[2]),
    }),
  },
  periodMatcher('last-7-days', /\b(?:last|past)\s+(?:7|seven)\s+days\b/gi),
  periodMatcher('last-week', /\blast\s+week\b/gi),
  periodMatcher('this-week', /\bthis\s+week\b/gi),
  periodMatcher('today', /\btoday\b/gi),
  periodMatcher('yesterday', /\byesterday\b/gi),
  periodMatcher('this-month', /\bthis\s+month\b/gi),
  periodMatcher('last-month', /\blast\s+month\b/gi),
  countryMatcher('Canada', /\b(?:(?:to|in|from)\s+)?canada\b/gi),
  countryMatcher('Germany', /\b(?:(?:to|in|from)\s+)?germany\b/gi),
  countryMatcher('France', /\b(?:(?:to|in|from)\s+)?france\b/gi),
  countryMatcher('Japan', /\b(?:(?:to|in|from)\s+)?japan\b/gi),
  countryMatcher('Brazil', /\b(?:(?:to|in|from)\s+)?brazil\b/gi),
  countryMatcher(
    'United States',
    /\b(?:(?:to|in|from)\s+)?(?:the\s+(?:us|usa)|usa|united states)\b/gi
  ),
  statusMatcher('paid', /\bpaid\b/gi),
  statusMatcher('pending', /\b(?:unpaid|pending)\b/gi),
  statusMatcher('shipped', /\bshipped\b/gi),
  statusMatcher('refunded', /\brefund(?:ed|s)?\b/gi),
  statusMatcher('cancelled', /\bcancell?ed\b/gi),
];

function overlapsAny(phrase: Phrase, taken: ParsedFilter[]) {
  return taken.some((filter) => {
    const startsBeforeEnd = phrase.start < filter.phrase.end;
    const endsAfterStart = phrase.end > filter.phrase.start;
    return startsBeforeEnd && endsAfterStart;
  });
}

function byStart(first: ParsedFilter, second: ParsedFilter) {
  return first.phrase.start - second.phrase.start;
}

export function parseFilters(text: string) {
  const found: ParsedFilter[] = [];
  for (const matcher of MATCHERS) {
    for (const match of text.matchAll(matcher.pattern)) {
      const start = match.index ?? 0;
      const phraseText = match[0];
      const end = start + phraseText.length;
      const phrase = { start, end, text: phraseText };
      if (overlapsAny(phrase, found)) {
        continue;
      }
      const detail = matcher.detailOf(match);
      const normalized = phraseText.toLowerCase();
      const key = `${detail.kind}:${normalized}`;
      found.push({ ...detail, key, phrase });
    }
  }
  return found.sort(byStart);
}

const TODAY = '2026-03-18';

const PERIOD_RANGE: Record<Exclude<PeriodKind, 'last-week'>, DayRange> = {
  today: { from: '2026-03-18', to: '2026-03-18' },
  yesterday: { from: '2026-03-17', to: '2026-03-17' },
  'this-week': { from: '2026-03-16', to: '2026-03-22' },
  'last-7-days': { from: '2026-03-12', to: TODAY },
  'this-month': { from: '2026-03-01', to: '2026-03-31' },
  'last-month': { from: '2026-02-01', to: '2026-02-28' },
};

const WEEK_RANGE: Record<WeekReading, DayRange> = {
  calendar: { from: '2026-03-09', to: '2026-03-15' },
  rolling: { from: '2026-03-12', to: TODAY },
};

const PERIOD_LABEL: Record<Exclude<PeriodKind, 'last-week'>, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  'this-week': 'This week',
  'last-7-days': 'Last 7 days',
  'this-month': 'March',
  'last-month': 'February',
};

const WEEK_LABEL: Record<WeekReading, string> = {
  calendar: 'Mar 9 to 15',
  rolling: 'Last 7 days',
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  paid: 'Paid',
  pending: 'Pending',
  shipped: 'Shipped',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
};

const STATUS_BADGE: Record<
  OrderStatus,
  'success' | 'warning' | 'info' | 'secondary' | 'destructive'
> = {
  paid: 'success',
  pending: 'warning',
  shipped: 'info',
  refunded: 'secondary',
  cancelled: 'destructive',
};

const KIND_ICON: Record<FilterKind, Icon> = {
  amount: WalletIcon,
  period: CalendarIcon,
  country: MapPinIcon,
  status: CircleCheckIcon,
};

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const MONEY = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function dayLabelOf(isoDay: string) {
  const [, month, day] = isoDay.split('-');
  const monthIndex = Number(month) - 1;
  const monthName = MONTHS[monthIndex] ?? '';
  const dayNumber = Number(day);
  return `${monthName} ${dayNumber}`;
}

function isAmbiguous(filter: ParsedFilter) {
  return filter.kind === 'period' && filter.period === 'last-week';
}

function rangeOf(filter: ParsedFilter, reading: WeekReading | null) {
  if (filter.kind !== 'period') {
    return null;
  }
  if (filter.period === 'last-week') {
    if (!reading) {
      return null;
    }
    return WEEK_RANGE[reading];
  }
  return PERIOD_RANGE[filter.period];
}

export function labelOfFilter(
  filter: ParsedFilter,
  reading: WeekReading | null
) {
  if (filter.kind === 'amount') {
    const amount = MONEY.format(filter.value);
    if (filter.isOver) {
      return `Over ${amount}`;
    }
    return `Under ${amount}`;
  }
  if (filter.kind === 'country') {
    return filter.country;
  }
  if (filter.kind === 'status') {
    return STATUS_LABEL[filter.status];
  }
  if (filter.period === 'last-week') {
    if (!reading) {
      return 'Last week?';
    }
    return WEEK_LABEL[reading];
  }
  return PERIOD_LABEL[filter.period];
}

function isInRange(order: Order, range: DayRange) {
  const isAfterStart = order.placedOn >= range.from;
  const isBeforeEnd = order.placedOn <= range.to;
  return isAfterStart && isBeforeEnd;
}

/** A filter that still waits for an answer keeps nothing out: the question comes first. */
function keepsOrder(
  order: Order,
  filter: ParsedFilter,
  reading: WeekReading | null
) {
  if (filter.kind === 'amount') {
    if (filter.isOver) {
      return order.amount > filter.value;
    }
    return order.amount < filter.value;
  }
  if (filter.kind === 'country') {
    return order.country === filter.country;
  }
  if (filter.kind === 'status') {
    return order.status === filter.status;
  }
  const range = rangeOf(filter, reading);
  if (!range) {
    return true;
  }
  return isInRange(order, range);
}

function threadPathOf(container: DOMRect, phrase: DOMRect, chip: DOMRect) {
  const phraseCentre = phrase.left + phrase.width / 2;
  const chipCentre = chip.left + chip.width / 2;
  const startX = phraseCentre - container.left;
  const startY = phrase.bottom - container.top + 2;
  const endX = chipCentre - container.left;
  const endY = chip.top - container.top;
  const bend = (endY - startY) / 2;
  const firstControlY = startY + bend;
  const secondControlY = endY - bend;
  return `M ${startX} ${startY} C ${startX} ${firstControlY}, ${endX} ${secondControlY}, ${endX} ${endY}`;
}

function lastLineOf(element: Element) {
  const lines = element.getClientRects();
  const last = lines[lines.length - 1];
  return last ?? element.getBoundingClientRect();
}

function placeThreads(container: HTMLElement) {
  const box = container.getBoundingClientRect();
  const threads = container.querySelectorAll<SVGPathElement>('[data-thread]');
  threads.forEach((thread) => {
    const key = thread.dataset.thread ?? '';
    const escapedKey = CSS.escape(key);
    const phrase = container.querySelector(`[data-phrase="${escapedKey}"]`);
    const chip = container.querySelector(`[data-chip="${escapedKey}"]`);
    if (!phrase) {
      return;
    }
    if (!chip) {
      return;
    }
    const phraseRect = lastLineOf(phrase);
    const chipRect = chip.getBoundingClientRect();
    const path = threadPathOf(box, phraseRect, chipRect);
    thread.setAttribute('d', path);
  });
}

const FOLLOW_LAYOUT_MS = 500;

type PhraseLook = 'linked' | 'asking' | 'struck';

function phraseClassOf(look: PhraseLook) {
  if (look === 'struck') {
    return 'line-through decoration-foreground/45';
  }
  if (look === 'asking') {
    return 'underline decoration-dotted decoration-warning-foreground/80 underline-offset-4';
  }
  return 'underline decoration-primary-ink/45 underline-offset-4';
}

type PhrasePiece = {
  text: string;
  key: string | null;
  look: PhraseLook;
};

function piecesOfText(
  text: string,
  filters: ParsedFilter[],
  dismissed: string[],
  reading: WeekReading | null
) {
  const pieces: PhrasePiece[] = [];
  let cursor = 0;
  for (const filter of filters) {
    const before = text.slice(cursor, filter.phrase.start);
    if (before !== '') {
      pieces.push({ text: before, key: null, look: 'linked' });
    }
    const isStruck = dismissed.includes(filter.key);
    const isAsking = isAmbiguous(filter) && reading === null;
    let look: PhraseLook = 'linked';
    if (isAsking) {
      look = 'asking';
    }
    if (isStruck) {
      look = 'struck';
    }
    pieces.push({ text: filter.phrase.text, key: filter.key, look });
    cursor = filter.phrase.end;
  }
  const rest = text.slice(cursor);
  if (rest !== '') {
    pieces.push({ text: rest, key: null, look: 'linked' });
  }
  return pieces;
}

const FIELD_TEXT =
  'border border-transparent px-2.5 py-2 text-base leading-6 md:text-[13px]';

type FilterChipProps = {
  filter: ParsedFilter;
  reading: WeekReading | null;
  onRemove: (key: string) => void;
  isRemovePressed: boolean;
};

function FilterChip({
  filter,
  reading,
  onRemove,
  isRemovePressed,
}: FilterChipProps) {
  const KindIcon = KIND_ICON[filter.kind];
  const label = labelOfFilter(filter, reading);
  const isAsking = isAmbiguous(filter) && reading === null;

  return (
    <span
      data-chip={filter.key}
      className={cn(
        'hairline-ring flex h-6 items-center gap-1 rounded-full ps-2 pe-0.5 text-xs transition-colors duration-200',
        chipToneOf(isAsking)
      )}
    >
      <KindIcon className='size-3.5 shrink-0 opacity-70' />
      <WordRoll text={label} />
      <Button
        type='button'
        variant='ghost'
        size='icon-sm'
        aria-label={`Remove the filter ${label}`}
        onClick={() => onRemove(filter.key)}
        className={cn('size-5 rounded-full', pressedQuietOf(isRemovePressed))}
      >
        <XIcon className='size-3' />
      </Button>
    </span>
  );
}

function chipToneOf(isAsking: boolean) {
  if (isAsking) {
    return 'bg-warning/10 text-warning-foreground ring-warning/30';
  }
  return 'bg-card text-foreground ring-foreground/15 dark:bg-foreground/[0.06]';
}

type AskFilterProps = {
  orders: Order[];
  value: string;
  onValueChange: (value: string) => void;
  /** Runs what the field, the chips and the question do, for a demonstration or a control beside them. */
  handleRef?: React.Ref<AskFilterHandle>;
  /** A demonstration drives the piece: its counts are not read aloud. */
  isDemonstrated?: boolean;
  className?: string;
};

export function AskFilter({
  orders,
  value,
  onValueChange,
  handleRef,
  isDemonstrated = false,
  className,
}: AskFilterProps) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [reading, setReading] = useState<WeekReading | null>(null);
  const { pressed, press } = usePress<string>();
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const fieldId = useId();
  const shouldReduceMotion = useReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const spring = springOf(shouldReduceMotion);
  const chipTransition = { ...fadePresence().transition, layout: spring };
  const filters = parseFilters(value);
  const live = filters.filter((filter) => !dismissed.includes(filter.key));
  const pieces = piecesOfText(value, filters, dismissed, reading);
  const asking = live.find((filter) => isAmbiguous(filter) && reading === null);
  const shown = orders.filter((order) =>
    live.every((filter) => keepsOrder(order, filter, reading))
  );
  const isEmpty = shown.length === 0;
  const hasFilters = live.length > 0;
  const appliedLabels = live.map((filter) => labelOfFilter(filter, reading));
  const announcement = announcementOf(
    shown.length,
    orders.length,
    appliedLabels,
    asking
  );
  const threadKeys = live.map((filter) => filter.key).join('|');
  useAutosize(textareaRef, value, 160);

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }
    const root: HTMLElement = element;
    placeThreads(root);
    const observer = new ResizeObserver(() => placeThreads(root));
    observer.observe(root);
    return () => observer.disconnect();
  }, [value]);

  // The chips glide to their new place when a filter comes, goes or gets its answer:
  // the threads follow them for that long, and only then.
  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }
    const root: HTMLElement = element;
    const until = performance.now() + FOLLOW_LAYOUT_MS;
    let frame = 0;
    function follow(now: number) {
      placeThreads(root);
      if (now < until) {
        frame = requestAnimationFrame(follow);
      }
    }
    frame = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(frame);
  }, [threadKeys, reading]);

  function remove(key: string) {
    setDismissed((current) => [...current, key]);
  }

  function reset(text: string) {
    onValueChange(text);
    setDismissed([]);
    setReading(null);
  }

  function clearFilters() {
    onValueChange('');
    setDismissed([]);
    setReading(null);
    textareaRef.current?.focus();
  }

  function changeText(event: React.ChangeEvent<HTMLTextAreaElement>) {
    applyText(event.target.value);
  }

  function applyText(next: string) {
    onValueChange(next);
    const nextKeys = parseFilters(next).map((filter) => filter.key);
    setDismissed((current) => current.filter((key) => nextKeys.includes(key)));
    const stillAsksWeek = nextKeys.some((key) =>
      key.startsWith('period:last week')
    );
    if (!stillAsksWeek) {
      setReading(null);
    }
  }

  function blockNewLine(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  }

  function followScroll(event: React.UIEvent<HTMLTextAreaElement>) {
    const mirror = mirrorRef.current;
    if (mirror) {
      mirror.scrollTop = event.currentTarget.scrollTop;
    }
  }

  useImperativeHandle(handleRef, () => ({
    type: applyText,
    press,
    answerWeek: setReading,
    remove,
    reset,
  }));

  return (
    <div
      ref={containerRef}
      className={cn('relative flex flex-col gap-3', className)}
    >
      <div className='flex flex-col gap-1.5'>
        <label htmlFor={fieldId} className='text-[13px] font-medium'>
          Show me
        </label>
        <div className='bg-card hairline-ring ring-foreground/12 dark:ring-foreground/15 has-[textarea:focus]:ring-ring/25 dark:bg-foreground/[0.04] relative rounded-md shadow-[0_1px_2px_rgb(0_0_0/0.05)] transition-shadow duration-150 has-[textarea:focus]:ring-[3px]'>
          <div
            ref={mirrorRef}
            aria-hidden='true'
            className={cn(
              FIELD_TEXT,
              'pointer-events-none absolute inset-0 overflow-hidden break-words whitespace-pre-wrap text-transparent'
            )}
          >
            {pieces.map((piece, index) => {
              if (piece.key === null) {
                return <span key={`text:${index}`}>{piece.text}</span>;
              }
              return (
                <span
                  key={`${index}:${piece.key}`}
                  data-phrase={piece.key}
                  className={cn(
                    'rounded-[2px] transition-[text-decoration-color] duration-300 starting:decoration-transparent',
                    phraseClassOf(piece.look)
                  )}
                >
                  {piece.text}
                </span>
              );
            })}
          </div>
          <textarea
            ref={textareaRef}
            id={fieldId}
            rows={1}
            value={value}
            onChange={changeText}
            onKeyDown={blockNewLine}
            onScroll={followScroll}
            placeholder='orders over 500 from last week to Canada'
            spellCheck={false}
            className={cn(
              FIELD_TEXT,
              'placeholder:text-muted-foreground/75 relative block w-full resize-none bg-transparent outline-none'
            )}
          />
        </div>
      </div>
      <svg
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 size-full overflow-visible'
      >
        <AnimatePresence initial={false}>
          {live.map((filter) => (
            <motion.path
              key={filter.key}
              data-thread={filter.key}
              fill='none'
              strokeWidth='1'
              className={threadToneOf(isAmbiguous(filter) && reading === null)}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
              transition={{ duration: threadDurationOf(shouldReduceMotion) }}
            />
          ))}
        </AnimatePresence>
      </svg>
      <AnimatedSize>
        <ul
          aria-label='Filters'
          className='flex min-h-6 flex-wrap gap-1.5 pt-3'
        >
          <AnimatePresence initial={false} mode='popLayout'>
            {live.map((filter) => (
              <motion.li
                key={filter.key}
                layout
                layoutDependency={threadKeys}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={chipTransition}
              >
                <FilterChip
                  filter={filter}
                  reading={reading}
                  onRemove={remove}
                  isRemovePressed={pressed === `chip:${filter.key}`}
                />
              </motion.li>
            ))}
          </AnimatePresence>
          {!hasFilters && (
            <li className='text-muted-foreground text-xs'>
              No filter yet: try an amount, a period, a country or a status
            </li>
          )}
        </ul>
        <AnimatePresence initial={false}>
          {asking && (
            <motion.div
              key='asking'
              className='@container overflow-hidden'
              {...rowPresence}
            >
              <div className='bg-warning/10 mt-3 flex flex-col gap-2 rounded-lg p-2.5 @lg:flex-row @lg:items-center'>
                <p className='text-warning-foreground min-w-0 flex-1 text-xs leading-5'>
                  “{asking.phrase.text}” could mean two things. Calendar week or
                  the last 7 days?
                </p>
                <div className='flex shrink-0 flex-wrap gap-1.5'>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => setReading('calendar')}
                    className={pressedQuietOf(pressed === 'week:calendar')}
                  >
                    Calendar week, {WEEK_LABEL.calendar}
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => setReading('rolling')}
                    className={pressedQuietOf(pressed === 'week:rolling')}
                  >
                    Last 7 days
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </AnimatedSize>
      <OrderTable
        orders={shown}
        total={orders.length}
        rowPresence={rowPresence}
      />
      <AnimatePresence initial={false}>
        {isEmpty && (
          <motion.div key='empty' className='overflow-hidden' {...rowPresence}>
            <div className='bg-foreground/[0.03] dark:bg-foreground/[0.05] flex flex-col items-center gap-3 rounded-lg px-4 py-6 text-center'>
              <p className='text-muted-foreground text-[13px] text-balance'>
                No orders match {appliedLabels.join(', ')}
              </p>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={clearFilters}
              >
                <XIcon />
                Clear filters
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <LiveRegion message={spokenUnless(isDemonstrated, announcement)} />
    </div>
  );
}

function threadToneOf(isAsking: boolean) {
  if (isAsking) {
    return 'stroke-warning';
  }
  return 'stroke-foreground/30';
}

function threadDurationOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return 0;
  }
  return 0.45;
}

function announcementOf(
  shownCount: number,
  total: number,
  labels: string[],
  asking: ParsedFilter | undefined
) {
  const orders = nounOf(total, 'order');
  const applied = labels.join(', ');
  const base = `${shownCount} of ${total} ${orders}`;
  if (asking) {
    return `${base}. “${asking.phrase.text}” needs an answer: calendar week or the last 7 days`;
  }
  if (applied === '') {
    return base;
  }
  return `${base}: ${applied}`;
}

type OrderTableProps = {
  orders: Order[];
  total: number;
  rowPresence: ReturnType<typeof rowPresenceOf>;
};

/** In a narrow card the customer and the day step aside, so the country takes the free width. */
const ROW_GRID =
  'grid grid-cols-[3rem_minmax(0,1fr)_4.75rem_3.5rem] items-center gap-1.5 px-2 @xl:gap-2 @xl:grid-cols-[3.5rem_minmax(0,1fr)_6.5rem_3.5rem_5rem_4.5rem]';

function OrderTable({ orders, total, rowPresence }: OrderTableProps) {
  const ordersWord = nounOf(total, 'order');

  return (
    <div className='@container flex flex-col gap-1.5'>
      <p className='text-muted-foreground px-2 text-xs'>
        <MotionNumber value={orders.length} /> of {total} {ordersWord}
      </p>
      <div role='table' aria-label='Orders' className='text-[13px]'>
        <div role='rowgroup'>
          <div
            role='row'
            className={cn(
              ROW_GRID,
              'text-muted-foreground hairline-b border-border h-8 text-xs'
            )}
          >
            <span role='columnheader'>Order</span>
            <span role='columnheader' className='hidden @xl:block'>
              Customer
            </span>
            <span role='columnheader'>Country</span>
            <span role='columnheader' className='hidden @xl:block'>
              Placed
            </span>
            <span role='columnheader'>Status</span>
            <span role='columnheader' className='text-end'>
              Amount
            </span>
          </div>
        </div>
        <div role='rowgroup'>
          <AnimatePresence initial={false}>
            {orders.map((order) => (
              <motion.div
                key={order.id}
                role='row'
                className='hairline-b border-border overflow-hidden'
                {...rowPresence}
              >
                <div className={cn(ROW_GRID, 'h-9')}>
                  <span
                    role='cell'
                    className='text-muted-foreground font-mono text-xs'
                  >
                    {order.id}
                  </span>
                  <span role='cell' className='hidden truncate @xl:block'>
                    {order.customer}
                  </span>
                  <span role='cell' className='truncate'>
                    {order.country}
                  </span>
                  <span
                    role='cell'
                    className='text-muted-foreground hidden tabular-nums @xl:block'
                  >
                    {dayLabelOf(order.placedOn)}
                  </span>
                  <span role='cell'>
                    <Badge variant={STATUS_BADGE[order.status]}>
                      {STATUS_LABEL[order.status]}
                    </Badge>
                  </span>
                  <span role='cell' className='text-end tabular-nums'>
                    {MONEY.format(order.amount)}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

const ORDERS: Order[] = [
  {
    id: '#1042',
    customer: 'Northwind Cafe',
    country: 'Canada',
    placedOn: '2026-03-10',
    amount: 640,
    status: 'paid',
  },
  {
    id: '#1043',
    customer: 'Halvorsen Tools',
    country: 'Germany',
    placedOn: '2026-03-11',
    amount: 220,
    status: 'paid',
  },
  {
    id: '#1044',
    customer: 'Maple and Rye',
    country: 'Canada',
    placedOn: '2026-03-13',
    amount: 890,
    status: 'shipped',
  },
  {
    id: '#1045',
    customer: 'Sora Studio',
    country: 'Japan',
    placedOn: '2026-03-14',
    amount: 1240,
    status: 'pending',
  },
  {
    id: '#1046',
    customer: 'Bluefin Market',
    country: 'Canada',
    placedOn: '2026-03-16',
    amount: 515,
    status: 'paid',
  },
  {
    id: '#1047',
    customer: 'Atelier Brun',
    country: 'France',
    placedOn: '2026-03-16',
    amount: 95,
    status: 'refunded',
  },
  {
    id: '#1048',
    customer: 'Cedar Lane Books',
    country: 'Canada',
    placedOn: '2026-03-04',
    amount: 730,
    status: 'paid',
  },
  {
    id: '#1049',
    customer: 'Pampa Coffee',
    country: 'Brazil',
    placedOn: '2026-03-17',
    amount: 310,
    status: 'shipped',
  },
  {
    id: '#1050',
    customer: 'Lakeside Outfitters',
    country: 'Canada',
    placedOn: '2026-03-17',
    amount: 460,
    status: 'pending',
  },
  {
    id: '#1051',
    customer: 'Kestrel Labs',
    country: 'United States',
    placedOn: '2026-03-12',
    amount: 1980,
    status: 'paid',
  },
];

const EXAMPLES = [
  'paid orders under 300',
  'refunded this month',
  'orders to Japan this week',
];

const START_QUERY = 'orders over 500 from last week to Canada';

type DemoQuestion = {
  text: string;
  /** The key of the filter the demonstration removes at the end. */
  removes: string;
};

/** A round types one of these questions, a different one each time. Both leave the week to be asked. */
const DEMO_QUESTIONS: DemoQuestion[] = [
  { text: 'paid orders to Canada last week', removes: 'status:paid' },
  { text: 'orders from last week to Japan', removes: 'country:to japan' },
];

export default function Prompt08() {
  const [query, setQuery] = useState(START_QUERY);
  const [exampleRound, setExampleRound] = useState(0);
  const [round, setRound] = useState(0);
  const filter = useRef<AskFilterHandle>(null);
  const question = DEMO_QUESTIONS[round % DEMO_QUESTIONS.length];
  const removedChip = `chip:${question.removes}`;

  function tryExample(example: string) {
    setQuery(example);
    setExampleRound((current) => current + 1);
  }

  function resetDemo() {
    filter.current?.reset(START_QUERY);
    setRound((current) => current + 1);
  }

  const typing = prefixesOf(question.text).map((typed, index) => ({
    after: keyDelayOf(index, 700, 52),
    run: () => filter.current?.type(typed),
  }));
  const steps: AutoplayStep[] = [
    { after: 1800, run: () => filter.current?.type('') },
    ...typing,
    { after: 1100, run: () => filter.current?.press('week:rolling') },
    { after: PRESS_LEAD_MS, run: () => filter.current?.answerWeek('rolling') },
    { after: 1900, run: () => filter.current?.press(removedChip) },
    {
      after: PRESS_LEAD_MS,
      run: () => filter.current?.remove(question.removes),
    },
    { after: 1700, run: hold },
  ];
  const { ref, isAutoplaying } = useAutoplay(steps, {
    loopAfter: 2400,
    onReset: resetDemo,
  });

  return (
    <div ref={ref} className='flex w-full max-w-[40rem] flex-col gap-3'>
      <AskFilter
        key={exampleRound}
        orders={ORDERS}
        value={query}
        onValueChange={setQuery}
        handleRef={filter}
        isDemonstrated={isAutoplaying}
        className='bg-card hairline-ring ring-border rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
      />
      <div className='flex flex-wrap items-center gap-1.5 px-1'>
        <span className='text-muted-foreground text-xs'>Try</span>
        {EXAMPLES.map((example) => (
          <Button
            key={example}
            type='button'
            variant='ghost'
            size='sm'
            onClick={() => tryExample(example)}
            className='text-muted-foreground h-6 px-2'
          >
            {example}
          </Button>
        ))}
      </div>
      <p className='text-muted-foreground px-1 text-[11px]'>
        Today is Wednesday, March 18 in this demo
      </p>
    </div>
  );
}
