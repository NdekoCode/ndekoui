'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useId, useRef, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll, type WordRollWord } from '@/components/core/word-roll';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { CheckIcon, RotateCcwIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { springOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Kbd } from '@/registry/ndeko/ui/kbd';
import { LetterTile } from '@/registry/ndeko/ui/letter-tile';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { isShortcutKey } from './_parts/keys';
import { countOf } from './_parts/words';

export type Suggestion = {
  id: string;
  /** Words the edit takes out; empty for an insertion. */
  removed: string;
  /** Words the edit puts in; empty for a deletion. */
  added: string;
  /** Why the edit helps, in a few words. */
  reason: string;
};

export type ProsePiece =
  | { kind: 'text'; text: string }
  | { kind: 'suggestion'; suggestion: Suggestion };

export type Decision = 'accepted' | 'rejected';

type CardPlace = { left: number; top: number };

const CARD_WIDTH = 256;

const CARD_GAP = 6;

const NEXT_KEYS = ['j', 'arrowright', 'arrowdown'];

const PREVIOUS_KEYS = ['k', 'arrowleft', 'arrowup'];

function suggestionsOf(pieces: ProsePiece[]) {
  const suggestions: Suggestion[] = [];
  for (const piece of pieces) {
    if (piece.kind === 'suggestion') {
      suggestions.push(piece.suggestion);
    }
  }
  return suggestions;
}

function removedToneOf(decision: Decision | undefined) {
  if (decision === 'rejected') {
    return 'decoration-transparent bg-transparent text-foreground';
  }
  return 'decoration-destructive-ink/70 bg-destructive/10 text-destructive-ink';
}

function addedToneOf(decision: Decision | undefined) {
  if (decision === 'accepted') {
    return 'decoration-transparent bg-transparent text-foreground';
  }
  return 'decoration-success-foreground/70 bg-success/10 text-success-foreground';
}

const PART_EXIT = { opacity: 0, transition: { duration: 0.15 } };

type SuggestionMarkProps = {
  suggestion: Suggestion;
  decision: Decision | undefined;
  position: number;
  total: number;
  isActive: boolean;
  isTabStop: boolean;
  cardId: string;
  isCardOpen: boolean;
  register: (id: string, node: HTMLElement | null) => void;
  onActivate: (id: string, node: HTMLElement) => void;
};

function SuggestionMark({
  suggestion,
  decision,
  position,
  total,
  isActive,
  isTabStop,
  cardId,
  isCardOpen,
  register,
  onActivate,
}: SuggestionMarkProps) {
  const isPending = decision === undefined;
  const hasRemoved = suggestion.removed !== '';
  const hasAdded = suggestion.added !== '';
  const keepsRemoved = decision !== 'accepted';
  const keepsAdded = decision !== 'rejected';
  const showsRemoved = hasRemoved && keepsRemoved;
  const showsAdded = hasAdded && keepsAdded;
  const isExpanded = isActive && isCardOpen;
  const parts = (
    <>
      <AnimatePresence initial={false}>
        {showsRemoved && (
          <motion.span
            key='removed'
            exit={PART_EXIT}
            className={cn(
              'rounded-[3px] line-through decoration-1 transition-[color,background-color,text-decoration-color] duration-300',
              removedToneOf(decision)
            )}
          >
            {isPending && <span className='sr-only'>Delete: </span>}
            {suggestion.removed}
          </motion.span>
        )}
      </AnimatePresence>
      <AnimatePresence initial={false}>
        {showsAdded && (
          <motion.span
            key='added'
            exit={PART_EXIT}
            className={cn(
              'rounded-[3px] underline decoration-1 underline-offset-[3px] transition-[color,background-color,text-decoration-color] duration-300',
              addedToneOf(decision)
            )}
          >
            {isPending && <span className='sr-only'> Insert: </span>}
            {suggestion.added}
          </motion.span>
        )}
      </AnimatePresence>
    </>
  );

  if (!isPending) {
    return <span>{parts}</span>;
  }

  function activate(event: React.SyntheticEvent<HTMLSpanElement>) {
    onActivate(suggestion.id, event.currentTarget);
  }

  function openFromKeys(event: React.KeyboardEvent<HTMLSpanElement>) {
    const isEnter = event.key === 'Enter';
    const isSpace = event.key === ' ';
    const opens = isEnter || isSpace;
    if (opens) {
      event.preventDefault();
      onActivate(suggestion.id, event.currentTarget);
    }
  }

  return (
    <span
      ref={(node) => register(suggestion.id, node)}
      role='button'
      tabIndex={tabIndexOf(isTabStop)}
      aria-label={`Suggestion ${position} of ${total}: ${suggestion.reason}`}
      aria-expanded={isExpanded}
      aria-controls={cardId}
      onFocus={activate}
      onClick={activate}
      onKeyDown={openFromKeys}
      className={cn(
        'focus-visible:ring-ring/40 cursor-pointer rounded-[3px] box-decoration-clone transition-[background-color,box-shadow] duration-150 outline-none focus-visible:ring-2',
        activeToneOf(isActive)
      )}
    >
      {parts}
    </span>
  );
}

function tabIndexOf(isTabStop: boolean) {
  if (isTabStop) {
    return 0;
  }
  return -1;
}

function activeToneOf(isActive: boolean) {
  if (isActive) {
    return 'bg-foreground/[0.06]';
  }
  return '';
}

type SuggestionCardProps = {
  suggestion: Suggestion;
  position: number;
  total: number;
  place: CardPlace;
  cardId: string;
  onAccept: () => void;
  onReject: () => void;
};

function SuggestionCard({
  suggestion,
  position,
  total,
  place,
  cardId,
  onAccept,
  onReject,
}: SuggestionCardProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const glide = springOf(shouldReduceMotion);

  return (
    <motion.div
      id={cardId}
      role='group'
      aria-label={`Suggestion ${position} of ${total}`}
      className='surface-raised absolute z-20 flex flex-col gap-2 rounded-xl p-2.5'
      style={{ width: CARD_WIDTH }}
      initial={{ opacity: 0, scale: 0.97, x: place.left, y: place.top }}
      animate={{ opacity: 1, scale: 1, x: place.left, y: place.top }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.1 } }}
      transition={glide}
    >
      <p className='flex items-baseline justify-between gap-2 text-xs'>
        <span className='text-foreground font-medium'>{suggestion.reason}</span>
        <span className='text-muted-foreground shrink-0 tabular-nums'>
          {position} of {total}
        </span>
      </p>
      <span className='flex items-center gap-1.5'>
        <Button type='button' size='sm' onClick={onAccept}>
          <CheckIcon />
          Accept
          <Kbd className='ms-0.5'>Y</Kbd>
        </Button>
        <Button type='button' size='sm' variant='outline' onClick={onReject}>
          <XIcon />
          Reject
          <Kbd className='ms-0.5'>N</Kbd>
        </Button>
      </span>
    </motion.div>
  );
}

/** Under the last line of the mark, kept inside the paragraph so it never runs off a narrow piece. */
function placeOf(container: HTMLElement, mark: HTMLElement): CardPlace {
  const origin = container.getBoundingClientRect();
  const fragments = mark.getClientRects();
  const lastIndex = fragments.length - 1;
  const last = fragments[lastIndex] ?? mark.getBoundingClientRect();
  const rawLeft = last.left - origin.left;
  const roomLeft = origin.width - CARD_WIDTH;
  const maxLeft = Math.max(0, roomLeft);
  const boundedLeft = Math.min(rawLeft, maxLeft);
  const left = Math.max(0, boundedLeft);
  const lineBottom = last.bottom - origin.top;
  const top = lineBottom + CARD_GAP;
  return { left, top };
}

function isMarkTarget(target: EventTarget) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const role = target.getAttribute('role');
  return role === 'button';
}

/** From no active mark, moving forward lands on the first and moving back on the last. */
function movedIndexOf(currentIndex: number, step: number, count: number) {
  const hasCurrent = currentIndex >= 0;
  if (!hasCurrent) {
    return firstIndexFor(step, count);
  }
  const moved = currentIndex + step;
  const shifted = moved + count;
  return shifted % count;
}

function firstIndexFor(step: number, count: number) {
  if (step > 0) {
    return 0;
  }
  return count - 1;
}

function cardSuggestionOf(isCardOpen: boolean, active: Suggestion | undefined) {
  if (!isCardOpen) {
    return undefined;
  }
  return active;
}

function leftWordsOf(left: number, total: number): WordRollWord[] {
  if (left === 0) {
    return ['All', String(total), 'settled'];
  }
  const countWord = {
    key: 'left',
    text: String(left),
    node: <MotionNumber value={left} />,
  };
  return [countWord, 'of', String(total), 'left'];
}

type HistoryEntry = { ids: string[] };

export type ProseDiffProps = {
  pieces: ProsePiece[];
  className?: string;
};

export function ProseDiff({ pieces, className }: ProseDiffProps) {
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [place, setPlace] = useState<CardPlace>({ left: 0, top: 0 });
  const [notice, setNotice] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const undoRef = useRef<HTMLButtonElement>(null);
  const marks = useRef(new Map<string, HTMLElement>());
  const isReturningFocus = useRef(false);
  const cardId = useId();
  const suggestions = suggestionsOf(pieces);
  const pending = suggestions.filter(
    (entry) => decisions[entry.id] === undefined
  );
  const total = suggestions.length;
  const leftWords = leftWordsOf(pending.length, total);
  const active = pending.find((entry) => entry.id === activeId);
  const tabStopId = active?.id ?? pending[0]?.id;
  const cardSuggestion = cardSuggestionOf(isCardOpen, active);
  const hasHistory = history.length > 0;
  const hasPending = pending.length > 0;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    if (!activeId) {
      return;
    }
    const markId = activeId;
    const observer = new ResizeObserver(() => {
      const mark = marks.current.get(markId);
      if (!mark) {
        return;
      }
      setPlace(placeOf(container, mark));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [activeId]);

  function register(id: string, node: HTMLElement | null) {
    if (node) {
      marks.current.set(id, node);
      return;
    }
    marks.current.delete(id);
  }

  function activate(id: string, node: HTMLElement) {
    const container = containerRef.current;
    const isReturning = isReturningFocus.current;
    isReturningFocus.current = false;
    setActiveId(id);
    if (!isReturning) {
      setIsCardOpen(true);
    }
    if (container) {
      setPlace(placeOf(container, node));
    }
  }

  function focusMark(id: string) {
    const mark = marks.current.get(id);
    mark?.focus();
  }

  function positionOf(id: string) {
    const index = suggestions.findIndex((entry) => entry.id === id);
    return index + 1;
  }

  function pendingAfter(id: string, nextDecisions: Record<string, Decision>) {
    const index = suggestions.findIndex((entry) => entry.id === id);
    const later = suggestions.slice(index + 1);
    const earlier = suggestions.slice(0, index);
    const order = [...later, ...earlier];
    return order.find((entry) => nextDecisions[entry.id] === undefined);
  }

  function decide(id: string, decision: Decision) {
    const nextDecisions = { ...decisions, [id]: decision };
    setDecisions(nextDecisions);
    setHistory((current) => [...current, { ids: [id] }]);
    const position = positionOf(id);
    setNotice(`Suggestion ${position} ${decision}`);
    const next = pendingAfter(id, nextDecisions);
    if (next) {
      focusMark(next.id);
      return;
    }
    setActiveId(null);
    setIsCardOpen(false);
    undoRef.current?.focus();
  }

  function decideAll(decision: Decision) {
    const ids = pending.map((entry) => entry.id);
    if (ids.length === 0) {
      return;
    }
    setDecisions((current) => {
      const next = { ...current };
      for (const id of ids) {
        next[id] = decision;
      }
      return next;
    });
    setHistory((current) => [...current, { ids }]);
    setActiveId(null);
    setIsCardOpen(false);
    const decided = countOf(ids.length, 'suggestion');
    setNotice(`${decided} ${decision}`);
  }

  function undo() {
    const last = history.at(-1);
    if (!last) {
      return;
    }
    setHistory((current) => current.slice(0, -1));
    setDecisions((current) => {
      const next = { ...current };
      for (const id of last.ids) {
        delete next[id];
      }
      return next;
    });
    const [firstId] = last.ids;
    setNotice('Last decision undone');
    requestAnimationFrame(() => focusMark(firstId));
  }

  function move(step: number) {
    if (!hasPending) {
      return;
    }
    const currentIndex = pending.findIndex((entry) => entry.id === activeId);
    const index = movedIndexOf(currentIndex, step, pending.length);
    focusMark(pending[index].id);
  }

  function handleKeys(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!isShortcutKey(event)) {
      return;
    }
    const key = event.key.toLowerCase();
    const isArrow = key.startsWith('arrow');
    const isOnMark = isMarkTarget(event.target);
    const blocksArrow = isArrow && !isOnMark;
    if (blocksArrow) {
      return;
    }
    if (key === 'escape') {
      closeCard();
      return;
    }
    if (NEXT_KEYS.includes(key)) {
      event.preventDefault();
      move(1);
      return;
    }
    if (PREVIOUS_KEYS.includes(key)) {
      event.preventDefault();
      move(-1);
      return;
    }
    if (!active) {
      return;
    }
    if (key === 'y') {
      event.preventDefault();
      decide(active.id, 'accepted');
      return;
    }
    if (key === 'n') {
      event.preventDefault();
      decide(active.id, 'rejected');
    }
  }

  function closeCard() {
    setIsCardOpen(false);
    if (!activeId) {
      return;
    }
    isReturningFocus.current = true;
    focusMark(activeId);
  }

  function trackFocusLeaving(event: React.FocusEvent<HTMLDivElement>) {
    const next = event.relatedTarget;
    const staysInside =
      next instanceof Node && event.currentTarget.contains(next);
    if (!staysInside) {
      setIsCardOpen(false);
    }
  }

  return (
    <div
      onKeyDown={handleKeys}
      onBlur={trackFocusLeaving}
      className={cn('flex flex-col gap-3', className)}
    >
      <div ref={containerRef} className='relative'>
        <p className='text-[15px] leading-8'>
          {pieces.map((piece, index) => {
            if (piece.kind === 'text') {
              return <span key={index}>{piece.text}</span>;
            }
            const { suggestion } = piece;
            return (
              <SuggestionMark
                key={suggestion.id}
                suggestion={suggestion}
                decision={decisions[suggestion.id]}
                position={positionOf(suggestion.id)}
                total={total}
                isActive={suggestion.id === activeId}
                isTabStop={suggestion.id === tabStopId}
                cardId={cardId}
                isCardOpen={isCardOpen}
                register={register}
                onActivate={activate}
              />
            );
          })}
        </p>
        <AnimatePresence>
          {cardSuggestion && (
            <SuggestionCard
              key='card'
              suggestion={cardSuggestion}
              position={positionOf(cardSuggestion.id)}
              total={total}
              place={place}
              cardId={cardId}
              onAccept={() => decide(cardSuggestion.id, 'accepted')}
              onReject={() => decide(cardSuggestion.id, 'rejected')}
            />
          )}
        </AnimatePresence>
      </div>
      <div className='flex flex-wrap items-center gap-x-3 gap-y-2'>
        <span className='text-muted-foreground min-w-0 flex-1 text-xs'>
          <WordRoll words={leftWords} />
        </span>
        <Button
          ref={undoRef}
          type='button'
          variant='ghost'
          size='sm'
          disabled={!hasHistory}
          focusableWhenDisabled
          onClick={undo}
        >
          <RotateCcwIcon />
          Undo
        </Button>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={!hasPending}
          onClick={() => decideAll('rejected')}
        >
          Reject all
        </Button>
        <Button
          type='button'
          size='sm'
          disabled={!hasPending}
          onClick={() => decideAll('accepted')}
        >
          Accept all
        </Button>
      </div>
      <p className='text-muted-foreground hidden items-center gap-1 text-xs @md:flex'>
        <Kbd>J</Kbd>
        <Kbd>K</Kbd> move, <Kbd>Y</Kbd> accepts, <Kbd>N</Kbd> rejects
      </p>
      <LiveRegion message={notice} />
    </div>
  );
}

function suggestion(
  id: string,
  removed: string,
  added: string,
  reason: string
): ProsePiece {
  return { kind: 'suggestion', suggestion: { id, removed, added, reason } };
}

function text(value: string): ProsePiece {
  return { kind: 'text', text: value };
}

const PIECES: ProsePiece[] = [
  suggestion(
    'opening',
    'We are pleased to announce that starting from',
    'From',
    'A shorter opening'
  ),
  text(' 1 October, Brightmoor will '),
  suggestion('verb', 'charge', 'bill', 'Matches the word on the invoice'),
  text(' a flat fee of 18.40 EUR per pallet on bulk orders'),
  suggestion(
    'threshold',
    '',
    ' of 40 pallets or more',
    'Says which orders the fee covers'
  ),
  text('. This makes pricing '),
  suggestion('grammar', 'more ', '', 'Fixes the grammar'),
  text(
    'simpler for our customers. Orders under 40 pallets keep the tiered rates they have today. '
  ),
  suggestion(
    'closing',
    'If you have any questions, please do not hesitate to contact your account manager.',
    'Questions? Your account manager can help.',
    'Shorter and warmer'
  ),
];

export default function Review11() {
  return (
    <div className='bg-card hairline-ring ring-border @container w-full max-w-[38rem] rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <p className='text-muted-foreground mb-3 flex items-center gap-2 text-xs'>
        <LetterTile initial='W' series={3} />
        <span>
          <span className='text-foreground font-medium'>Writer</span> suggests
          five edits to the customer notice
        </span>
      </p>
      <ProseDiff pieces={PIECES} />
    </div>
  );
}
