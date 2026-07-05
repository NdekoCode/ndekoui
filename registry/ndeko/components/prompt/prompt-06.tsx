'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import {
  ArrowUpIcon,
  CheckIcon,
  CircleAlertIcon,
  RotateCcwIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import { EASE_OUT_STRONG } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { TextLoader } from '@/registry/ndeko/ui/chat-loader';
import { Input } from '@/registry/ndeko/ui/input';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { isOwnKey, useAutosize } from './_parts/use-autosize';

export type RewriteRequest = {
  phrase: string;
  instruction: string;
  before: string;
  after: string;
  /** 1 for the first take, then one more for each Try again. */
  attempt: number;
};

type Range = {
  start: number;
  end: number;
};

type Mode =
  'idle' | 'rewriting' | 'review' | 'accepting' | 'settling' | 'failed';

type DiffKind = 'same' | 'removed' | 'added';

type DiffPart = {
  kind: DiffKind;
  word: string;
};

const QUICK_ASKS = ['Shorter', 'Friendlier', 'More direct'];

const BAR_GAP = 8;

const ACCEPT_FADE_MS = 160;

const SETTLE_MS = 700;

const WORD_STAGGER_S = 0.06;

/** The paragraph and its mirror share these metrics, so the phrase is measured where it is drawn. */
const TEXT_BOX = 'px-1 py-0.5 text-sm leading-6';

/** A read-only textarea keeps no caret for Shift and the arrows, so the text stays selectable and edits are refused instead. */
function refuseEdit(event: Event) {
  event.preventDefault();
}

function keepValue() {}

const WORD_CHARACTER = /[\p{L}\p{N}'’-]/u;

const SPACE = /\s/;

function isSpaceAt(text: string, index: number) {
  const character = text[index] ?? '';
  return SPACE.test(character);
}

function isWordAt(text: string, index: number) {
  const character = text[index] ?? '';
  return WORD_CHARACTER.test(character);
}

/** A selection grown to whole words and trimmed of spaces, so a rewrite never cuts a word in half. */
export function phraseRangeOf(
  text: string,
  start: number,
  end: number
): Range | null {
  let from = start;
  let to = end;
  while (from < to && isSpaceAt(text, from)) {
    from += 1;
  }
  while (to > from && isSpaceAt(text, to - 1)) {
    to -= 1;
  }
  if (from >= to) {
    return null;
  }
  while (from > 0 && isWordAt(text, from - 1)) {
    from -= 1;
  }
  while (to < text.length && isWordAt(text, to)) {
    to += 1;
  }
  return { start: from, end: to };
}

function sameRange(first: Range | null, second: Range | null) {
  if (first === null) {
    return second === null;
  }
  if (second === null) {
    return false;
  }
  const sameStart = first.start === second.start;
  return sameStart && first.end === second.end;
}

function wordsIn(text: string) {
  const trimmed = text.trim();
  if (trimmed === '') {
    return [];
  }
  return trimmed.split(/\s+/);
}

function zeroRow(length: number) {
  return Array.from({ length }, () => 0);
}

function lcsTable(oldWords: string[], newWords: string[]) {
  const rowCount = oldWords.length + 1;
  const columnCount = newWords.length + 1;
  const table = Array.from({ length: rowCount }, () => zeroRow(columnCount));
  for (let row = oldWords.length - 1; row >= 0; row -= 1) {
    for (let column = newWords.length - 1; column >= 0; column -= 1) {
      const isSame = oldWords[row] === newWords[column];
      if (isSame) {
        table[row][column] = table[row + 1][column + 1] + 1;
        continue;
      }
      const skipOld = table[row + 1][column];
      const skipNew = table[row][column + 1];
      table[row][column] = Math.max(skipOld, skipNew);
    }
  }
  return table;
}

/** Word by word: what stays, what goes and what arrives, removals before their replacement. */
export function diffWords(oldText: string, newText: string): DiffPart[] {
  const oldWords = wordsIn(oldText);
  const newWords = wordsIn(newText);
  const table = lcsTable(oldWords, newWords);
  const parts: DiffPart[] = [];
  let row = 0;
  let column = 0;
  while (row < oldWords.length && column < newWords.length) {
    const isSame = oldWords[row] === newWords[column];
    if (isSame) {
      parts.push({ kind: 'same', word: oldWords[row] });
      row += 1;
      column += 1;
      continue;
    }
    const keepsMoreBySkippingOld =
      table[row + 1][column] >= table[row][column + 1];
    if (keepsMoreBySkippingOld) {
      parts.push({ kind: 'removed', word: oldWords[row] });
      row += 1;
      continue;
    }
    parts.push({ kind: 'added', word: newWords[column] });
    column += 1;
  }
  for (const word of oldWords.slice(row)) {
    parts.push({ kind: 'removed', word });
  }
  for (const word of newWords.slice(column)) {
    parts.push({ kind: 'added', word });
  }
  return parts;
}

function placeBar(
  container: HTMLElement,
  bar: HTMLElement,
  phrase: HTMLElement
) {
  const box = container.getBoundingClientRect();
  const whole = phrase.getBoundingClientRect();
  const lines = phrase.getClientRects();
  const firstLine = lines[0] ?? whole;
  const lineCentre = (firstLine.left + firstLine.right) / 2;
  const centre = lineCentre - box.left;
  const barWidth = bar.offsetWidth;
  const barHeight = bar.offsetHeight;
  const wantedLeft = centre - barWidth / 2;
  const maxLeft = Math.max(0, box.width - barWidth);
  const left = Math.min(Math.max(0, wantedLeft), maxLeft);
  const firstLineTop = firstLine.top - box.top;
  const above = firstLineTop - barHeight - BAR_GAP;
  const below = whole.bottom - box.top + BAR_GAP;
  bar.style.left = `${left}px`;
  if (above >= 0) {
    bar.style.top = `${above}px`;
    return;
  }
  bar.style.top = `${below}px`;
}

function wordStyleOf(kind: DiffKind) {
  if (kind === 'removed') {
    return 'text-destructive-ink/60 decoration-destructive-ink/60 line-through';
  }
  if (kind === 'added') {
    return 'text-primary-ink decoration-primary-ink/50 underline underline-offset-[3px]';
  }
  return '';
}

function spaceBefore(index: number) {
  if (index === 0) {
    return '';
  }
  return ' ';
}

type TrackedChangeProps = {
  parts: DiffPart[];
  isAccepting: boolean;
  phraseRef: React.Ref<HTMLSpanElement>;
};

function arrivalDelaysOf(parts: DiffPart[]) {
  const delays: number[] = [];
  let addedCount = 0;
  for (const part of parts) {
    const delay = addedCount * WORD_STAGGER_S;
    delays.push(delay);
    if (part.kind === 'added') {
      addedCount += 1;
    }
  }
  return delays;
}

function TrackedChange({ parts, isAccepting, phraseRef }: TrackedChangeProps) {
  const shouldReduceMotion = useReducedMotion();
  const delays = arrivalDelaysOf(parts);
  const arrival = arrivalOf(shouldReduceMotion);
  const removedOpacity = removedOpacityOf(isAccepting);

  return (
    <span ref={phraseRef}>
      {parts.map((part, index) => {
        const space = spaceBefore(index);
        if (part.kind === 'removed') {
          return (
            <span key={`removed-${index}`}>
              {space}
              <motion.del
                initial={false}
                animate={{ opacity: removedOpacity }}
                transition={{ duration: 0.15 }}
                className={wordStyleOf('removed')}
              >
                {part.word}
              </motion.del>
            </span>
          );
        }
        if (part.kind === 'added') {
          return (
            <span key={`added-${index}`}>
              {space}
              <motion.ins
                initial={arrival}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.22,
                  ease: EASE_OUT_STRONG,
                  delay: delays[index],
                }}
                className={cn('inline-block', wordStyleOf('added'))}
              >
                {part.word}
              </motion.ins>
            </span>
          );
        }
        return (
          <span key={`same-${index}`}>
            {space}
            {part.word}
          </span>
        );
      })}
    </span>
  );
}

function removedOpacityOf(isAccepting: boolean) {
  if (isAccepting) {
    return 0;
  }
  return 1;
}

function arrivalOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return { opacity: 0, y: 0 };
  }
  return { opacity: 0, y: 3 };
}

const BAR_PRESENCE = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.1 } },
  transition: { duration: 0.15, ease: EASE_OUT_STRONG },
};

const BAR_FADE = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.1 } },
  transition: { duration: 0.15 },
};

function barPresenceOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return BAR_FADE;
  }
  return BAR_PRESENCE;
}

function announcementOf(mode: Mode, proposal: string, isUnchanged: boolean) {
  if (mode === 'rewriting') {
    return 'Rewriting the phrase';
  }
  if (mode === 'review') {
    if (isUnchanged) {
      return 'No change suggested. Try again or discard';
    }
    return `Suggested: ${proposal}. Tab accepts, Escape discards`;
  }
  if (mode === 'settling') {
    return 'Rewrite accepted';
  }
  if (mode === 'failed') {
    return 'The rewrite failed. Try again or discard';
  }
  return '';
}

export type RewriteInPlaceProps = {
  value: string;
  onValueChange: (value: string) => void;
  rewrite: (request: RewriteRequest, signal: AbortSignal) => Promise<string>;
  label: string;
  className?: string;
};

export function RewriteInPlace({
  value,
  onValueChange,
  rewrite,
  label,
  className,
}: RewriteInPlaceProps) {
  const [selection, setSelection] = useState<Range | null>(null);
  const [mode, setMode] = useState<Mode>('idle');
  const [instruction, setInstruction] = useState('');
  const [lastInstruction, setLastInstruction] = useState('');
  const [proposal, setProposal] = useState('');
  const [attempt, setAttempt] = useState(1);
  const [settledRange, setSettledRange] = useState<Range | null>(null);
  const { schedule, clearAll } = useTimeouts();
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const phraseRef = useRef<HTMLSpanElement>(null);
  const fieldRef = useRef<HTMLInputElement>(null);
  const acceptRef = useRef<HTMLButtonElement>(null);
  const request = useRef<AbortController | null>(null);
  const hintId = useId();
  const shouldReduceMotion = useReducedMotion();
  const barPresence = barPresenceOf(shouldReduceMotion);
  const isReviewing = mode === 'review';
  const isAccepting = mode === 'accepting';
  const isSettling = mode === 'settling';
  const showsChange = isReviewing || isAccepting;
  const showsTextarea = !showsChange && !isSettling;
  const isRewriting = mode === 'rewriting';
  const isFailed = mode === 'failed';
  const hasSelection = selection !== null;
  const showsBar = hasSelection && !isSettling;
  const before = sliceBefore(value, selection);
  const phrase = sliceOf(value, selection);
  const after = sliceAfter(value, selection);
  const parts = diffWords(phrase, proposal);
  const isUnchanged = proposal.trim() === phrase.trim();
  const announcement = announcementOf(mode, proposal, isUnchanged);
  useAutosize(textareaRef, value, 1000, showsTextarea);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const bar = barRef.current;
    const phraseElement = phraseRef.current;
    if (!container || !bar || !phraseElement) {
      return;
    }
    placeBar(container, bar, phraseElement);
    const observer = new ResizeObserver(() => {
      placeBar(container, bar, phraseElement);
    });
    observer.observe(container);
    observer.observe(bar);
    return () => observer.disconnect();
  }, [selection, mode, proposal, value]);

  useEffect(() => {
    return () => request.current?.abort();
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    textarea.addEventListener('beforeinput', refuseEdit);
    return () => textarea.removeEventListener('beforeinput', refuseEdit);
  }, [showsTextarea]);

  function askFor(text: string, take: number) {
    if (!selection) {
      return;
    }
    const trimmed = text.trim();
    if (trimmed === '') {
      return;
    }
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLastInstruction(trimmed);
    setAttempt(take);
    setMode('rewriting');
    barRef.current?.focus();
    rewrite(
      { phrase, instruction: trimmed, before, after, attempt: take },
      controller.signal
    )
      .then((next) => {
        if (controller.signal.aborted) {
          return;
        }
        setProposal(next);
        setMode('review');
        requestAnimationFrame(() => focusReview(next));
      })
      .catch(() => {
        if (controller.signal.aborted) {
          return;
        }
        setMode('failed');
      });
  }

  function focusReview(next: string) {
    const isSame = next.trim() === phrase.trim();
    if (isSame) {
      barRef.current?.focus();
      return;
    }
    acceptRef.current?.focus();
  }

  function submitField(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    askFor(instruction, 1);
  }

  function tryAgain() {
    const nextAttempt = attempt + 1;
    askFor(lastInstruction, nextAttempt);
  }

  function closeBar() {
    request.current?.abort();
    clearAll();
    const end = selection?.end ?? 0;
    setSelection(null);
    setMode('idle');
    setProposal('');
    setInstruction('');
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      textarea?.focus();
      textarea?.setSelectionRange(end, end);
    });
  }

  function discard() {
    request.current?.abort();
    setMode('idle');
    setProposal('');
    requestAnimationFrame(() => fieldRef.current?.focus());
  }

  function accept() {
    const canAccept = isReviewing && !isUnchanged;
    if (!canAccept) {
      return;
    }
    if (!selection) {
      return;
    }
    const start = selection.start;
    const end = start + proposal.length;
    setMode('accepting');
    schedule(() => {
      onValueChange(`${before}${proposal}${after}`);
      setSettledRange({ start, end });
      setMode('settling');
    }, ACCEPT_FADE_MS);
    schedule(() => {
      setSettledRange(null);
      setSelection(null);
      setProposal('');
      setInstruction('');
      setMode('idle');
      requestAnimationFrame(() => {
        const textarea = textareaRef.current;
        textarea?.focus();
        textarea?.setSelectionRange(end, end);
      });
    }, ACCEPT_FADE_MS + SETTLE_MS);
  }

  function readSelection(event: React.SyntheticEvent<HTMLTextAreaElement>) {
    if (mode !== 'idle') {
      return;
    }
    const textarea = event.currentTarget;
    const range = phraseRangeOf(
      textarea.value,
      textarea.selectionStart,
      textarea.selectionEnd
    );
    if (sameRange(range, selection)) {
      return;
    }
    setSelection(range);
  }

  function handleKeys(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!isOwnKey(event)) {
      return;
    }
    const isEscape = event.key === 'Escape';
    const isTab = event.key === 'Tab' && !event.shiftKey;
    const isOnAccept = event.target === acceptRef.current;
    const isAcceptKey = isTab && isOnAccept;
    const isWaitingOnAnswer = isRewriting || isFailed;
    if (isReviewing && isEscape) {
      event.preventDefault();
      discard();
      return;
    }
    if (isReviewing && isAcceptKey) {
      event.preventDefault();
      accept();
      return;
    }
    if (isWaitingOnAnswer && isEscape) {
      event.preventDefault();
      discard();
      return;
    }
    if (hasSelection && isEscape) {
      event.preventDefault();
      closeBar();
    }
  }

  const bar = (
    <motion.div
      key='bar'
      ref={barRef}
      tabIndex={-1}
      role='group'
      aria-label='Rewrite the selected phrase'
      className='surface-raised absolute z-20 w-[19rem] max-w-full rounded-xl p-1.5 outline-none'
      {...barPresence}
    >
      <AnimatedSize>
        {isReviewing && (
          <div className='flex flex-wrap items-center gap-1'>
            {isUnchanged && (
              <p className='text-muted-foreground w-full px-1.5 pb-1 text-xs'>
                This already reads well
              </p>
            )}
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={discard}
              aria-keyshortcuts='Escape'
              className='text-muted-foreground'
            >
              <XIcon />
              Discard
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={tryAgain}
              className='text-muted-foreground'
            >
              <RotateCcwIcon />
              Try again
            </Button>
            {!isUnchanged && (
              <Button
                ref={acceptRef}
                type='button'
                size='sm'
                onClick={accept}
                aria-keyshortcuts='Tab'
                className='ms-auto'
              >
                <CheckIcon />
                Accept
                <span className='text-primary-foreground/70 text-[11px] font-normal'>
                  Tab
                </span>
              </Button>
            )}
          </div>
        )}
        {isAccepting && (
          <p className='text-muted-foreground flex h-7 items-center gap-2 px-2 text-xs'>
            <CheckIcon className='text-success-foreground size-3.5' />
            Accepted
          </p>
        )}
        {isRewriting && (
          <p className='flex h-7 items-center px-2'>
            <TextLoader text='Rewriting' size='sm' />
          </p>
        )}
        {isFailed && (
          <div className='flex items-center gap-2 ps-2'>
            <CircleAlertIcon className='text-destructive-ink size-3.5 shrink-0' />
            <p className='text-destructive-ink min-w-0 flex-1 text-xs'>
              Could not rewrite this phrase
            </p>
            <Button type='button' variant='ghost' size='sm' onClick={tryAgain}>
              <RotateCcwIcon />
              Try again
            </Button>
          </div>
        )}
        {mode === 'idle' && (
          <div className='flex flex-col gap-1.5'>
            <div className='flex flex-wrap gap-1'>
              {QUICK_ASKS.map((ask) => (
                <Button
                  key={ask}
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => askFor(ask, 1)}
                >
                  {ask}
                </Button>
              ))}
            </div>
            <form onSubmit={submitField} className='relative'>
              <Input
                ref={fieldRef}
                value={instruction}
                onChange={(event) => setInstruction(event.target.value)}
                aria-label='How should it read?'
                placeholder='How should it read?'
                className='pe-9'
              />
              <Button
                type='submit'
                size='icon-sm'
                aria-label='Rewrite'
                disabled={instruction.trim() === ''}
                className='absolute end-0.5 top-1/2 size-7 -translate-y-1/2'
              >
                <ArrowUpIcon />
              </Button>
            </form>
          </div>
        )}
      </AnimatedSize>
    </motion.div>
  );

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeys}
      className={cn('relative', className)}
    >
      <AnimatedSize>
        {showsTextarea && (
          <div className='relative'>
            <div
              aria-hidden='true'
              className={cn(
                TEXT_BOX,
                'pointer-events-none absolute inset-0 break-words whitespace-pre-wrap text-transparent'
              )}
            >
              {before}
              {hasSelection && (
                <motion.span
                  ref={phraseRef}
                  animate={{ opacity: highlightPulseOf(isRewriting) }}
                  transition={highlightTransitionOf(isRewriting)}
                  className='bg-primary/15 dark:bg-primary/25 rounded-[3px]'
                >
                  {phrase}
                </motion.span>
              )}
              {after}
            </div>
            <textarea
              ref={textareaRef}
              aria-readonly='true'
              inputMode='none'
              value={value}
              onChange={keepValue}
              onSelect={readSelection}
              aria-label={label}
              aria-describedby={hintId}
              className={cn(
                TEXT_BOX,
                'focus-visible:ring-ring/25 relative block w-full resize-none overflow-hidden rounded-md bg-transparent outline-none focus-visible:ring-[3px]'
              )}
            />
          </div>
        )}
        {!showsTextarea && (
          <div className={cn(TEXT_BOX, 'break-words whitespace-pre-wrap')}>
            {showsChange && (
              <>
                {before}
                <TrackedChange
                  parts={parts}
                  isAccepting={isAccepting}
                  phraseRef={phraseRef}
                />
                {after}
              </>
            )}
            {isSettling && <SettledText value={value} range={settledRange} />}
          </div>
        )}
      </AnimatedSize>
      <AnimatePresence>{showsBar && bar}</AnimatePresence>
      <p id={hintId} className='sr-only'>
        Select a phrase with the mouse or with Shift and the arrow keys, then
        press Tab to reach the rewrite bar.
      </p>
      <LiveRegion message={announcement} />
    </div>
  );
}

function highlightPulseOf(isRewriting: boolean) {
  if (isRewriting) {
    return [1, 0.45, 1];
  }
  return 1;
}

function highlightTransitionOf(isRewriting: boolean) {
  if (isRewriting) {
    return { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } as const;
  }
  return { duration: 0.2 };
}

function sliceBefore(text: string, range: Range | null) {
  if (!range) {
    return text;
  }
  return text.slice(0, range.start);
}

function sliceOf(text: string, range: Range | null) {
  if (!range) {
    return '';
  }
  return text.slice(range.start, range.end);
}

function sliceAfter(text: string, range: Range | null) {
  if (!range) {
    return '';
  }
  return text.slice(range.end);
}

function SettledText({ value, range }: { value: string; range: Range | null }) {
  if (!range) {
    return <>{value}</>;
  }
  const before = value.slice(0, range.start);
  const accepted = value.slice(range.start, range.end);
  const after = value.slice(range.end);

  return (
    <>
      {before}
      <span className='text-foreground starting:text-primary-ink starting:decoration-primary-ink/50 underline decoration-transparent underline-offset-[3px] transition-[color,text-decoration-color] duration-700 ease-(--ease-out-strong)'>
        {accepted}
      </span>
      {after}
    </>
  );
}

type RewriteKind = 'shorter' | 'friendlier' | 'direct' | 'formal';

const KIND_WORDS: { kind: RewriteKind; pattern: RegExp }[] = [
  { kind: 'shorter', pattern: /short|brief|concise|trim|tight/i },
  { kind: 'friendlier', pattern: /friend|warm|kind|polite|soft|nice/i },
  { kind: 'formal', pattern: /formal|professional/i },
  { kind: 'direct', pattern: /direct|clear|firm|plain|assertive|blunt/i },
];

function kindOf(instruction: string): RewriteKind {
  const match = KIND_WORDS.find((entry) => entry.pattern.test(instruction));
  return match?.kind ?? 'direct';
}

type PreparedRewrite = {
  phrase: string;
  takes: Record<RewriteKind, string[]>;
};

/** Hand-written takes for the phrases of the demo letter; any other phrase falls back on the rules below. */
const PREPARED: PreparedRewrite[] = [
  {
    phrase:
      'I just wanted to reach out because we were wondering if it might be possible to get a credit for the October order',
    takes: {
      shorter: [
        'Could we get a credit for the October order',
        'We would like a credit for the October order',
      ],
      friendlier: [
        'I hope you are well! We would love to ask whether a credit for the October order is possible',
        'Hope all is well. Would a credit for the October order be possible',
      ],
      direct: [
        'Please issue a credit for the October order',
        'We need a credit for the October order',
      ],
      formal: [
        'We are writing to request a credit for the October order',
        'We kindly request a credit for the October order',
      ],
    },
  },
  {
    phrase:
      'since a few of the lines seem to have been billed above the price we agreed on',
    takes: {
      shorter: [
        'since some lines were billed above our agreed price',
        'as some lines exceed the agreed price',
      ],
      friendlier: [
        'since a few lines look like they were billed a little above the price we agreed on',
        'because a few lines seem to have slipped above our agreed price',
      ],
      direct: [
        'because several lines were billed above the agreed price',
        'because lines 4, 7 and 9 exceed the agreed price',
      ],
      formal: [
        'as several lines were invoiced above the agreed price',
        'given that several lines exceed the contracted price',
      ],
    },
  },
  {
    phrase: 'Please let us know at your earliest convenience',
    takes: {
      shorter: ['Please reply soon', 'Let us know soon'],
      friendlier: [
        'Let us know whenever you get a chance, thank you',
        'Thanks so much for looking into it',
      ],
      direct: ['Please reply by Friday', 'Please confirm the credit by Friday'],
      formal: [
        'We look forward to your reply',
        'We would appreciate your prompt reply',
      ],
    },
  },
];

type Rule = [RegExp, string];

const RULES: Record<RewriteKind, Rule[]> = {
  shorter: [
    [/\bI just wanted to reach out because\s*/gi, ''],
    [/\bwe were wondering if it might be possible to\b/gi, 'could we'],
    [/\bat your earliest convenience\b/gi, 'soon'],
    [/\bseem to have been\b/gi, 'were'],
    [/\ba few of the\b/gi, 'some'],
    [/\bin order to\b/gi, 'to'],
    [/\b(just|really|very|actually|basically|quite) /gi, ''],
  ],
  friendlier: [
    [/\bPlease let us know\b/g, 'Could you let us know'],
    [/\bat your earliest convenience\b/gi, 'whenever you get a chance'],
    [/\bwe were wondering if\b/gi, 'we would love to know if'],
    [/\bbilled above\b/gi, 'billed a little above'],
  ],
  direct: [
    [/\bI just wanted to reach out because\s*/gi, ''],
    [/\bwe were wondering if it might be possible to get\b/gi, 'please issue'],
    [/\bseem to have been\b/gi, 'were'],
    [/\b(I think|perhaps|maybe) /gi, ''],
    [/\bmight\b/gi, 'will'],
    [/\bat your earliest convenience\b/gi, 'by Friday'],
  ],
  formal: [
    [/\bHi\b/g, 'Dear'],
    [/\blet us know\b/gi, 'advise us'],
    [/\bget\b/gi, 'obtain'],
    [/\bsince\b/gi, 'as'],
  ],
};

const SECOND_TAKE_RULES: Record<RewriteKind, Rule[]> = {
  shorter: [[/\bthat /gi, '']],
  friendlier: [[/\bplease\b/gi, 'kindly']],
  direct: [[/\bcould\b/gi, 'please']],
  formal: [[/\bwe\b/g, 'our team']],
};

const TRAILING_MARKS = /[.,;:!?]+$/;

function normalized(text: string) {
  const trimmed = text.trim();
  const withoutMarks = trimmed.replace(TRAILING_MARKS, '');
  return withoutMarks.toLowerCase();
}

function trailingMarksOf(text: string) {
  const match = text.trim().match(TRAILING_MARKS);
  return match?.[0] ?? '';
}

function applyRules(text: string, rules: Rule[]) {
  let next = text;
  for (const [pattern, replacement] of rules) {
    next = next.replace(pattern, replacement);
  }
  return next;
}

function capitalizedLike(original: string, next: string) {
  const startsUpper = /^\p{Lu}/u.test(original.trim());
  if (!startsUpper) {
    return next;
  }
  const firstLetter = next.charAt(0);
  const first = firstLetter.toUpperCase();
  const rest = next.slice(1);
  return `${first}${rest}`;
}

function ruleTake(phrase: string, kind: RewriteKind, attempt: number) {
  const marks = trailingMarksOf(phrase);
  const core = phrase.trim().replace(TRAILING_MARKS, '');
  const firstTake = applyRules(core, RULES[kind]);
  const isSecondTake = attempt > 1;
  let take = firstTake;
  if (isSecondTake) {
    take = applyRules(firstTake, SECOND_TAKE_RULES[kind]);
  }
  const tidy = take.replace(/\s{2,}/g, ' ').trim();
  const cased = capitalizedLike(core, tidy);
  return `${cased}${marks}`;
}

function preparedTake(phrase: string, kind: RewriteKind, attempt: number) {
  const key = normalized(phrase);
  const entry = PREPARED.find(
    (candidate) => normalized(candidate.phrase) === key
  );
  if (!entry) {
    return null;
  }
  const takes = entry.takes[kind];
  const index = (attempt - 1) % takes.length;
  const marks = trailingMarksOf(phrase);
  return `${takes[index]}${marks}`;
}

const THINKING_MS = 900;

function wait(milliseconds: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(resolve, milliseconds);
    signal.addEventListener('abort', () => {
      clearTimeout(timeout);
      reject(new DOMException('The rewrite was cancelled', 'AbortError'));
    });
  });
}

async function demoRewrite(request: RewriteRequest, signal: AbortSignal) {
  await wait(THINKING_MS, signal);
  const kind = kindOf(request.instruction);
  const prepared = preparedTake(request.phrase, kind, request.attempt);
  if (prepared) {
    return prepared;
  }
  return ruleTake(request.phrase, kind, request.attempt);
}

const LETTER =
  'Hi Dana, I just wanted to reach out because we were wondering if it might be possible to get a credit for the October order, since a few of the lines seem to have been billed above the price we agreed on. Please let us know at your earliest convenience.';

export default function Prompt06() {
  const [letter, setLetter] = useState(LETTER);
  const isEdited = letter !== LETTER;

  return (
    <div className='flex w-full max-w-[30rem] flex-col gap-3'>
      <div className='bg-card hairline-ring ring-border flex flex-col gap-3 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
        <div className='flex items-baseline justify-between gap-3'>
          <p className='text-sm font-medium'>Credit request to Brightmoor</p>
          <p className='text-muted-foreground text-xs'>Draft</p>
        </div>
        <RewriteInPlace
          value={letter}
          onValueChange={setLetter}
          rewrite={demoRewrite}
          label='Credit request to Brightmoor'
          className='-mx-1'
        />
      </div>
      <div className='flex min-h-7 items-center justify-between gap-3 px-1'>
        <p className='text-muted-foreground text-xs'>
          Select a phrase, or use Shift and the arrows
        </p>
        {isEdited && (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={() => setLetter(LETTER)}
            className='text-muted-foreground'
          >
            <RotateCcwIcon />
            Start over
          </Button>
        )}
      </div>
    </div>
  );
}
