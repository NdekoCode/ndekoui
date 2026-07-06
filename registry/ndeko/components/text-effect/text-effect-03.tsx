'use client';

import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import {
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  keyDelayOf,
  prefixesOf,
  pressedQuietOf,
  PRESS_LEAD_MS,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  SearchIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import { fadePresence, springOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Input } from '@/registry/ndeko/ui/input';
import { Kbd, KbdGroup } from '@/registry/ndeko/ui/kbd';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { useHover } from './_parts/use-hover';

/** A control of the find bar a demonstration can press. */
export type FindControl = 'open' | 'previous' | 'next' | 'close';

type StepDirection = 1 | -1;

type Piece =
  | { kind: 'text'; text: string }
  | { kind: 'match'; text: string; order: number };

type SentenceLayout = {
  pieces: Piece[];
  hasMatch: boolean;
};

type ArticleLayout = {
  title: SentenceLayout[];
  paragraphs: SentenceLayout[][];
  total: number;
};

type Search = {
  query: string;
  /** The match the plate is on, counted from 0 in the order of the page. */
  active: number;
};

type FocusAfter = 'field' | 'opener' | null;

/** A sentence ends at its stop, with any closing quote or bracket and the space after it. */
const SENTENCE_PATTERN = /[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g;

const NO_SEARCH: Search = { query: '', active: 0 };

/** A count is said once the person stops typing, not on every key. */
const COUNT_SAID_AFTER_MS = 500;

/** A match closer than this to the edge of the frame is scrolled into the middle. */
const SCROLL_MARGIN_PX = 24;

const APPLE_PLATFORM = /Mac|iPhone|iPad|iPod/;

function subscribeToNothing() {
  return () => {};
}

function readIsApple() {
  return APPLE_PLATFORM.test(navigator.userAgent);
}

function appleOnServer() {
  return false;
}

/** The key that goes with F to find in a page: Command on Apple systems, Control elsewhere. */
function useFindModifier() {
  const isApple = useSyncExternalStore(
    subscribeToNothing,
    readIsApple,
    appleOnServer
  );
  if (isApple) {
    return '⌘';
  }
  return 'Ctrl';
}

function sentencesOf(text: string) {
  const found = text.match(SENTENCE_PATTERN);
  if (!found) {
    return [text];
  }
  return found;
}

/** The sentence cut into plain text and matches, each match numbered in the order of the page from `firstOrder`. */
function piecesOf(sentence: string, needle: string, firstOrder: number) {
  const pieces: Piece[] = [];
  const haystack = sentence.toLowerCase();
  const keepsIndexes = haystack.length === sentence.length;
  const canMatch = needle.length > 0 && keepsIndexes;
  if (!canMatch) {
    return [{ kind: 'text', text: sentence } satisfies Piece];
  }
  let from = 0;
  let order = firstOrder;
  for (
    let at = haystack.indexOf(needle);
    at >= 0;
    at = haystack.indexOf(needle, from)
  ) {
    if (at > from) {
      pieces.push({ kind: 'text', text: sentence.slice(from, at) });
    }
    const end = at + needle.length;
    pieces.push({ kind: 'match', text: sentence.slice(at, end), order });
    order += 1;
    from = end;
  }
  if (from < sentence.length) {
    pieces.push({ kind: 'text', text: sentence.slice(from) });
  }
  return pieces;
}

function matchCountOf(pieces: Piece[]) {
  const matches = pieces.filter((piece) => piece.kind === 'match');
  return matches.length;
}

/** Lays out a block of text as sentences, numbering its matches from `firstOrder`; hands back the next number too. */
function blockLayoutOf(text: string, needle: string, firstOrder: number) {
  const sentences: SentenceLayout[] = [];
  let order = firstOrder;
  for (const sentence of sentencesOf(text)) {
    const pieces = piecesOf(sentence, needle, order);
    const count = matchCountOf(pieces);
    order += count;
    sentences.push({ pieces, hasMatch: count > 0 });
  }
  return { sentences, nextOrder: order };
}

function articleLayoutOf(
  title: string,
  paragraphs: readonly string[],
  query: string
): ArticleLayout {
  const needle = query.toLowerCase();
  const titleBlock = blockLayoutOf(title, needle, 0);
  const laidParagraphs: SentenceLayout[][] = [];
  let order = titleBlock.nextOrder;
  for (const paragraph of paragraphs) {
    const block = blockLayoutOf(paragraph, needle, order);
    laidParagraphs.push(block.sentences);
    order = block.nextOrder;
  }
  return {
    title: titleBlock.sentences,
    paragraphs: laidParagraphs,
    total: order,
  };
}

function wrappedOf(index: number, total: number) {
  return ((index % total) + total) % total;
}

function steppedSearchOf(
  current: Search,
  direction: StepDirection,
  total: number
) {
  if (total === 0) {
    return current;
  }
  const shown = activeOf(current, total);
  const next = wrappedOf(shown + direction, total);
  return { query: current.query, active: next };
}

function activeOf(search: Search, total: number) {
  if (total === 0) {
    return 0;
  }
  return Math.min(search.active, total - 1);
}

function countSentenceOf(total: number) {
  if (total === 0) {
    return 'No matches';
  }
  if (total === 1) {
    return '1 match';
  }
  return `${total} matches`;
}

function scrollBehaviorOf(isStill: boolean): ScrollBehavior {
  if (isStill) {
    return 'auto';
  }
  return 'smooth';
}

/** Brings the match the plate is on into the frame, scrolling the frame alone and never the page. */
function revealActiveMatch(frame: HTMLElement, behavior: ScrollBehavior) {
  const mark = frame.querySelector<HTMLElement>('[data-active-match]');
  if (!mark) {
    return;
  }
  const top = mark.offsetTop;
  const bottom = top + mark.offsetHeight;
  const viewTop = frame.scrollTop + SCROLL_MARGIN_PX;
  const viewBottom = frame.scrollTop + frame.clientHeight - SCROLL_MARGIN_PX;
  const isAbove = top < viewTop;
  const isBelow = bottom > viewBottom;
  if (!isAbove && !isBelow) {
    return;
  }
  const middle = top - frame.clientHeight / 2 + mark.offsetHeight / 2;
  frame.scrollTo({ top: Math.max(0, middle), behavior });
}

function isFindShortcut(event: React.KeyboardEvent) {
  const isF = event.key.toLowerCase() === 'f';
  const hasModifier = event.metaKey || event.ctrlKey;
  return isF && hasModifier;
}

type SentenceProps = {
  sentence: SentenceLayout;
  isSearching: boolean;
  activeOrder: number;
  plateKey: string;
  isStill: boolean;
};

/** A sentence that holds a match stays lit; the others dim while a search finds something. */
function Sentence({
  sentence,
  isSearching,
  activeOrder,
  plateKey,
  isStill,
}: SentenceProps) {
  const isDimmed = isSearching && !sentence.hasMatch;

  return (
    <span
      data-dimmed={isDimmed}
      className='transition-opacity duration-300 ease-(--ease-out-strong) data-[dimmed=true]:opacity-30'
    >
      {sentence.pieces.map((piece, index) => {
        if (piece.kind === 'text') {
          return <span key={`text-${index}`}>{piece.text}</span>;
        }
        const isActive = piece.order === activeOrder;
        return (
          <mark
            key={`match-${piece.order}`}
            data-active-match={isActive || undefined}
            className='bg-primary/15 text-foreground relative isolate rounded-[3px]'
          >
            {isActive && (
              <motion.span
                layoutId='find-plate'
                layoutDependency={plateKey}
                transition={springOf(isStill)}
                aria-hidden='true'
                className='bg-primary/30 absolute -inset-x-[3px] -inset-y-px -z-10 rounded-[5px]'
              />
            )}
            {piece.text}
          </mark>
        );
      })}
    </span>
  );
}

export type LitFindHandle = {
  open: () => void;
  /** Puts this text in the find field, as typed. */
  type: (query: string) => void;
  /** Carries the plate to the next match, or to the one before with -1. */
  step: (direction: StepDirection) => void;
  close: () => void;
};

export type LitFindProps = {
  title: string;
  /** The article, as paragraphs of plain text. */
  paragraphs: readonly string[];
  /** Shows a control of the find bar held down, for a demonstration that presses it. */
  pressed?: FindControl | null;
  /** Searches from outside, for a demonstration. */
  handleRef?: React.Ref<LitFindHandle>;
  className?: string;
};

/**
 * An article searched by light. While a search finds something, everything dims except the
 * sentences that hold a match, and one plate travels from match to match with Enter and Shift with
 * Enter while the frame scrolls it into view. Command or Control with F opens the field from inside
 * the piece, and Escape clears it.
 */
export function LitFind({
  title,
  paragraphs,
  pressed = null,
  handleRef,
  className,
}: LitFindProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState<Search>(NO_SEARCH);
  const [announcement, setAnnouncement] = useState('');
  const frameRef = useRef<HTMLElement>(null);
  const fieldRef = useRef<HTMLInputElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const focusAfter = useRef<FocusAfter>(null);
  const countTimer = useRef<number | undefined>(undefined);
  const groupId = useId();
  const titleId = useId();
  const isStill = usePrefersReducedMotion();
  const modifier = useFindModifier();
  const layout = useMemo(
    () => articleLayoutOf(title, paragraphs, search.query),
    [title, paragraphs, search.query]
  );
  const total = layout.total;
  const active = activeOf(search, total);
  const hasQuery = search.query.length > 0;
  const isSearching = hasQuery && total > 0;
  const hasNoMatch = hasQuery && total === 0;
  const plateKey = `${search.query}:${active}`;

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || !isSearching) {
      return;
    }
    revealActiveMatch(frame, scrollBehaviorOf(isStill));
  }, [plateKey, isSearching, isStill]);

  useEffect(() => {
    const target = focusAfter.current;
    focusAfter.current = null;
    if (target === 'field') {
      fieldRef.current?.focus();
      fieldRef.current?.select();
    }
    if (target === 'opener') {
      openerRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    return () => window.clearTimeout(countTimer.current);
  }, []);

  function open() {
    setIsOpen(true);
  }

  function type(query: string) {
    setSearch({ query, active: 0 });
  }

  function step(direction: StepDirection) {
    setSearch((current) => {
      const currentLayout = articleLayoutOf(title, paragraphs, current.query);
      return steppedSearchOf(current, direction, currentLayout.total);
    });
  }

  function close() {
    window.clearTimeout(countTimer.current);
    setIsOpen(false);
    setSearch(NO_SEARCH);
  }

  function openFromPerson() {
    if (isOpen) {
      fieldRef.current?.focus();
      fieldRef.current?.select();
      return;
    }
    focusAfter.current = 'field';
    open();
  }

  function closeFromPerson() {
    focusAfter.current = 'opener';
    close();
    setAnnouncement('Find closed');
  }

  function stepFromPerson(direction: StepDirection) {
    if (total === 0) {
      return;
    }
    const next = wrappedOf(active + direction, total);
    step(direction);
    setAnnouncement(`Match ${next + 1} of ${total}`);
  }

  function typeFromPerson(event: React.ChangeEvent<HTMLInputElement>) {
    const query = event.target.value;
    type(query);
    window.clearTimeout(countTimer.current);
    if (query.length === 0) {
      return;
    }
    const count = articleLayoutOf(title, paragraphs, query).total;
    countTimer.current = window.setTimeout(() => {
      setAnnouncement(countSentenceOf(count));
    }, COUNT_SAID_AFTER_MS);
  }

  function keysInField(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') {
      return;
    }
    event.preventDefault();
    if (event.shiftKey) {
      stepFromPerson(-1);
      return;
    }
    stepFromPerson(1);
  }

  function keysOnPiece(event: React.KeyboardEvent<HTMLDivElement>) {
    if (isFindShortcut(event)) {
      event.preventDefault();
      openFromPerson();
      return;
    }
    const isEscape = event.key === 'Escape';
    if (isEscape && isOpen) {
      event.preventDefault();
      closeFromPerson();
    }
  }

  useImperativeHandle(handleRef, () => ({ open, type, step, close }));

  return (
    <div
      onKeyDown={keysOnPiece}
      className={cn('@container flex w-full flex-col gap-2', className)}
    >
      <div className='relative h-8'>
        <AnimatePresence mode='popLayout' initial={false}>
          {!isOpen && (
            <motion.div
              key='opener'
              {...fadePresence()}
              className='flex h-8 items-center'
            >
              <Button
                ref={openerRef}
                type='button'
                variant='outline'
                size='sm'
                onClick={openFromPerson}
                className={pressedQuietOf(pressed === 'open')}
              >
                <SearchIcon />
                Find in article
                <KbdGroup className='ms-1'>
                  <Kbd>{modifier}</Kbd>
                  <Kbd>F</Kbd>
                </KbdGroup>
              </Button>
            </motion.div>
          )}
          {isOpen && (
            <motion.div
              key='bar'
              {...fadePresence()}
              className='flex h-8 items-center gap-1'
            >
              <Input
                ref={fieldRef}
                type='search'
                aria-label='Find in the article'
                placeholder='Find in article'
                value={search.query}
                onChange={typeFromPerson}
                onKeyDown={keysInField}
                className='min-w-0 flex-1'
              />
              <span
                aria-hidden='true'
                className='text-muted-foreground flex w-[4.75rem] shrink-0 justify-center text-xs tabular-nums'
              >
                {isSearching && (
                  <span className='inline-flex items-baseline gap-1'>
                    <MotionNumber value={active + 1} />
                    of
                    <MotionNumber value={total} />
                  </span>
                )}
                {hasNoMatch && 'No matches'}
              </span>
              <Button
                type='button'
                variant='ghost'
                size='icon-sm'
                aria-label='Previous match'
                disabled={!isSearching}
                onClick={() => stepFromPerson(-1)}
                className={pressedQuietOf(pressed === 'previous')}
              >
                <ChevronUpIcon />
              </Button>
              <Button
                type='button'
                variant='ghost'
                size='icon-sm'
                aria-label='Next match'
                disabled={!isSearching}
                onClick={() => stepFromPerson(1)}
                className={pressedQuietOf(pressed === 'next')}
              >
                <ChevronDownIcon />
              </Button>
              <Button
                type='button'
                variant='ghost'
                size='icon-sm'
                aria-label='Close find'
                onClick={closeFromPerson}
                className={pressedQuietOf(pressed === 'close')}
              >
                <XIcon />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <LayoutGroup id={groupId}>
        <motion.article
          ref={frameRef}
          layoutScroll
          tabIndex={0}
          aria-labelledby={titleId}
          className='bg-foreground/[0.03] focus-visible:ring-ring/25 relative max-h-48 overflow-y-auto rounded-xl px-4 py-3 text-[13px] leading-relaxed outline-none focus-visible:ring-[3px]'
        >
          <h3 id={titleId} className='mb-2 text-sm font-medium text-balance'>
            {layout.title.map((sentence, index) => (
              <Sentence
                key={index}
                sentence={sentence}
                isSearching={isSearching}
                activeOrder={active}
                plateKey={plateKey}
                isStill={isStill}
              />
            ))}
          </h3>
          {layout.paragraphs.map((sentences, paragraphIndex) => (
            <p key={paragraphIndex} className='mt-2 text-pretty first:mt-0'>
              {sentences.map((sentence, index) => (
                <Sentence
                  key={index}
                  sentence={sentence}
                  isSearching={isSearching}
                  activeOrder={active}
                  plateKey={plateKey}
                  isStill={isStill}
                />
              ))}
            </p>
          ))}
        </motion.article>
      </LayoutGroup>
      <LiveRegion message={announcement} />
    </div>
  );
}

type FindBeat =
  | { after: number; kind: 'open' }
  | { after: number; kind: 'type'; query: string }
  | { after: number; kind: 'press'; control: FindControl }
  | { after: number; kind: 'step'; direction: StepDirection }
  | { after: number; kind: 'close' };

const ARTICLE_TITLE = 'Keeping the light at Cape Farrow';

const ARTICLE = [
  'The lighthouse on Cape Farrow has kept its light burning since 1874. At dusk the keeper climbs the tower and winds the clockwork that turns the lens, which folds a single lamp into one beam that sweeps the bay every ten seconds.',
  'Ships tell one light from another by its rhythm. Two short flashes and a long one mean Cape Farrow; three short flashes belong to the harbour wall, whose lamp is green. On a clear night the beam carries twenty miles.',
  'Fog is the hard part. When the light cannot reach the water, the keeper starts the horn and runs both until daylight. The logbook gives one line to every night, and most lines say the same thing: light kept.',
];

const QUERY = 'light';

const TYPING: FindBeat[] = prefixesOf(QUERY).map((query, index): FindBeat => ({
  after: keyDelayOf(index, 600, 130),
  kind: 'type',
  query,
}));

function stepBeats(control: FindControl, direction: StepDirection): FindBeat[] {
  return [
    { after: 1000, kind: 'press', control },
    { after: PRESS_LEAD_MS, kind: 'step', direction },
  ];
}

/** Opens the field and types, steps forward to a match below the fold and back once, then closes, each control pressed the way a person would. */
const FIND_BEATS: FindBeat[] = [
  { after: 1300, kind: 'press', control: 'open' },
  { after: PRESS_LEAD_MS, kind: 'open' },
  ...TYPING,
  ...stepBeats('next', 1),
  ...stepBeats('next', 1),
  ...stepBeats('next', 1),
  ...stepBeats('next', 1),
  ...stepBeats('previous', -1),
  { after: 1800, kind: 'press', control: 'close' },
  { after: PRESS_LEAD_MS, kind: 'close' },
];

export default function TextEffect03() {
  const find = useRef<LitFindHandle>(null);
  const isStill = usePrefersReducedMotion();
  const { pressed, press } = usePress<FindControl>();
  const { isHovered, hoverHandlers } = useHover();
  const steps: AutoplayStep[] = FIND_BEATS.map((beat) => ({
    after: beat.after,
    run: () => playBeat(beat),
  }));
  const { ref } = useAutoplay(steps, {
    loopAfter: 1500,
    onReset: () => find.current?.close(),
    isEnabled: !isHovered,
  });

  /** Under reduced motion the piece rests on a search under way: the word lit, the plate on its third match. */
  useEffect(() => {
    if (!isStill) {
      return;
    }
    find.current?.open();
    find.current?.type(QUERY);
    find.current?.step(1);
    find.current?.step(1);
  }, [isStill]);

  function playBeat(beat: FindBeat) {
    if (beat.kind === 'press') {
      press(beat.control);
      return;
    }
    if (beat.kind === 'open') {
      find.current?.open();
      return;
    }
    if (beat.kind === 'type') {
      find.current?.type(beat.query);
      return;
    }
    if (beat.kind === 'step') {
      find.current?.step(beat.direction);
      return;
    }
    find.current?.close();
  }

  return (
    <div ref={ref} className='w-full max-w-[32rem]' {...hoverHandlers}>
      <LitFind
        handleRef={find}
        title={ARTICLE_TITLE}
        paragraphs={ARTICLE}
        pressed={pressed}
      />
    </div>
  );
}
