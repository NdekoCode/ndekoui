'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { noiseAt } from '@/registry/ndeko/lib/speech-envelope';
import { cn } from '@/registry/ndeko/lib/utils';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

import { usePlayWhileSeen } from './_parts/use-play-while-seen';

export type TypewriterMode = 'cycle' | 'retype';

export type TypewriterSlip = {
  /** Where the slip starts in the phrase, counted in characters. */
  at: number;
  /** What is typed there in place of the right letters, before it is noticed and taken back. */
  typed: string;
};

/** A state of the line, and how long it holds before the next one. */
type Beat = {
  text: string;
  holdMs: number;
  /** The whole line is selected, the moment before it is cleared. */
  isSelected: boolean;
  /** The hand rests, so the caret blinks. */
  isIdle: boolean;
};

type Track = {
  beats: readonly Beat[];
  index: number;
  isDone: boolean;
};

/** The time left on a beat that stopped playing, kept so it picks up where it stopped. */
type Pending = {
  beats: readonly Beat[];
  index: number;
  remaining: number;
  startedAt: number;
};

type Word = {
  start: number;
  length: number;
};

/** A person does not type at a steady pace: each key waits between 60% and 150% of this. */
const KEY_MS = 70;

const KEY_STRETCH_MIN = 0.6;

const KEY_STRETCH_SPAN = 0.9;

const AFTER_SPACE_MS = 60;

const AFTER_PUNCTUATION_MS = 220;

const BACKSPACE_MS = 40;

const PHRASE_HOLD_MS = 2200;

const LINE_HOLD_MS = 2600;

const SELECTED_MS = 420;

const CLEARED_MS = 320;

/** The slip is seen a moment after it was typed, not on the key that made it. */
const NOTICE_MS = 480;

const BEFORE_RETYPE_MS = 160;

const BEFORE_TYPING_MS = 280;

/** A line that plays once blinks this long at the end, then its caret goes. */
const LAST_HOLD_MS = 2400;

const BLINK_MS = 1060;

const BLINK_KEYFRAMES: Keyframe[] = [
  { offset: 0, opacity: 1 },
  { offset: 0.45, opacity: 1 },
  { offset: 0.55, opacity: 0 },
  { offset: 0.95, opacity: 0 },
  { offset: 1, opacity: 1 },
];

const PUNCTUATION = ',.;:!?';

/** The default slip swaps two letters of a word at least this long. */
const SLIP_WORD_LENGTH = 4;

/** Joins the phrases into one key, so a new array with the same phrases keeps the line where it is. */
const PHRASE_SEPARATOR = '\u001f';

function charactersOf(text: string) {
  return Array.from(text);
}

function commonLengthOf(first: readonly string[], second: readonly string[]) {
  const shortest = Math.min(first.length, second.length);
  for (let index = 0; index < shortest; index += 1) {
    if (first[index] !== second[index]) {
      return index;
    }
  }
  return shortest;
}

function keyHoldOf(character: string, index: number, seed: number) {
  const noise = noiseAt(index, seed);
  const stretch = KEY_STRETCH_MIN + noise * KEY_STRETCH_SPAN;
  const hold = KEY_MS * stretch;
  if (character === ' ') {
    return Math.round(hold + AFTER_SPACE_MS);
  }
  if (PUNCTUATION.includes(character)) {
    return Math.round(hold + AFTER_PUNCTUATION_MS);
  }
  return Math.round(hold);
}

function idleBeat(text: string, holdMs: number): Beat {
  return { text, holdMs, isSelected: false, isIdle: true };
}

function keyBeat(text: string, holdMs: number): Beat {
  return { text, holdMs, isSelected: false, isIdle: false };
}

/** The line typed key by key from `start`, a beginning of `target`, to the whole of `target`. */
function typedBeats(start: string, target: string, seed: number) {
  const characters = charactersOf(target);
  const startLength = charactersOf(start).length;
  const beats: Beat[] = [];
  for (let index = startLength; index < characters.length; index += 1) {
    const end = index + 1;
    const typed = characters.slice(0, end).join('');
    const holdMs = keyHoldOf(characters[index], index, seed);
    beats.push(keyBeat(typed, holdMs));
  }
  return beats;
}

/** The line taken back key by key from `start` to `target`, a beginning of it. */
function deletedBeats(start: string, target: string) {
  const characters = charactersOf(start);
  const targetLength = charactersOf(target).length;
  const beats: Beat[] = [];
  for (
    let length = characters.length - 1;
    length >= targetLength;
    length -= 1
  ) {
    const text = characters.slice(0, length).join('');
    beats.push(keyBeat(text, BACKSPACE_MS));
  }
  return beats;
}

function withLastHold(beats: Beat[], holdMs: number) {
  const last = beats.at(-1);
  if (last) {
    last.holdMs = holdMs;
  }
  return beats;
}

/** Each phrase rests, is taken back to what it shares with the next one, then the next is typed. */
function cycleBeatsOf(phrases: readonly string[]) {
  const beats: Beat[] = [];
  const count = phrases.length;
  for (let index = 0; index < count; index += 1) {
    const phrase = phrases[index];
    const nextIndex = (index + 1) % count;
    const next = phrases[nextIndex];
    const nextCharacters = charactersOf(next);
    const keep = commonLengthOf(charactersOf(phrase), nextCharacters);
    const kept = nextCharacters.slice(0, keep).join('');
    const resting = idleBeat(phrase, PHRASE_HOLD_MS);
    const deleting = withLastHold(deletedBeats(phrase, kept), BEFORE_TYPING_MS);
    const typing = typedBeats(kept, next, nextIndex);
    beats.push(resting, ...deleting, ...typing);
  }
  return beats;
}

/** The line rests, is selected and cleared, then typed again with a slip that is noticed, taken back and fixed. */
function retypeBeatsOf(text: string, slip: TypewriterSlip | null) {
  const beats: Beat[] = [
    idleBeat(text, LINE_HOLD_MS),
    { text, holdMs: SELECTED_MS, isSelected: true, isIdle: false },
    keyBeat('', CLEARED_MS),
  ];
  if (!slip) {
    beats.push(...typedBeats('', text, 1));
    return beats;
  }
  const characters = charactersOf(text);
  const before = characters.slice(0, slip.at).join('');
  const wrongLine = before + slip.typed;
  const typedWrong = charactersOf(slip.typed);
  const slipEnd = slip.at + typedWrong.length;
  const rightPart = characters.slice(slip.at, slipEnd);
  const keep = commonLengthOf(typedWrong, rightPart);
  const backTo = before + typedWrong.slice(0, keep).join('');
  const slipping = withLastHold(typedBeats('', wrongLine, 1), NOTICE_MS);
  const takingBack = withLastHold(
    deletedBeats(wrongLine, backTo),
    BEFORE_RETYPE_MS
  );
  const fixing = typedBeats(backTo, text, 2);
  beats.push(...slipping, ...takingBack, ...fixing);
  return beats;
}

function wordsOf(characters: readonly string[]) {
  const words: Word[] = [];
  let start = -1;
  for (let index = 0; index <= characters.length; index += 1) {
    const character = characters[index];
    const isEnd = character === undefined;
    const isGap = isEnd || character === ' ';
    const isInWord = start >= 0;
    if (isGap && isInWord) {
      words.push({ start, length: index - start });
      start = -1;
    }
    const startsWord = !isGap && !isInWord;
    if (startsWord) {
      start = index;
    }
  }
  return words;
}

/** Two letters of a word swapped, as a fast hand does. */
function swapSlipOf(characters: readonly string[], word: Word) {
  const letters = characters.slice(word.start, word.start + word.length);
  const swapped = [letters[2], letters[1], ...letters.slice(3)];
  const typed = swapped.join('');
  const right = letters.slice(1).join('');
  if (typed === right) {
    return null;
  }
  return { at: word.start + 1, typed };
}

/** The slip a line makes when none is given: two letters swapped in the word of four letters or more nearest its middle. */
function defaultSlipOf(text: string): TypewriterSlip | null {
  const characters = charactersOf(text);
  const middle = characters.length / 2;
  let best: TypewriterSlip | null = null;
  let bestGap = Number.POSITIVE_INFINITY;
  for (const word of wordsOf(characters)) {
    const isLongEnough = word.length >= SLIP_WORD_LENGTH;
    const gap = Math.abs(word.start - middle);
    const isNearer = gap < bestGap;
    if (!isLongEnough || !isNearer) {
      continue;
    }
    const slip = swapSlipOf(characters, word);
    if (slip) {
      best = slip;
      bestGap = gap;
    }
  }
  return best;
}

function isUsableSlip(slip: TypewriterSlip, text: string) {
  const length = charactersOf(text).length;
  const isInside = slip.at >= 0 && slip.at <= length;
  const hasLetters = slip.typed.length > 0;
  return isInside && hasLetters;
}

function slipFor(text: string, slipAt: number, slipTyped: string) {
  const isGiven = slipAt >= 0;
  if (!isGiven) {
    return defaultSlipOf(text);
  }
  const slip = { at: slipAt, typed: slipTyped };
  if (isUsableSlip(slip, text)) {
    return slip;
  }
  return null;
}

function nextTrackOf(
  current: Track,
  beats: readonly Beat[],
  goesRound: boolean
): Track {
  if (current.beats !== beats) {
    return current;
  }
  const nextIndex = current.index + 1;
  if (nextIndex < beats.length) {
    return { beats, index: nextIndex, isDone: false };
  }
  if (goesRound) {
    return { beats, index: 0, isDone: false };
  }
  return { beats, index: current.index, isDone: true };
}

/**
 * Plays the beats one after another while `isPlaying`, and holds the beat it is on otherwise, with
 * the time it had left. The first beat is the resting line: it shows before playing and under
 * reduced motion.
 */
function useBeats(
  beats: readonly Beat[],
  isPlaying: boolean,
  goesRound: boolean
) {
  const [track, setTrack] = useState<Track>({
    beats,
    index: 0,
    isDone: false,
  });
  const pending = useRef<Pending | null>(null);
  const isCurrent = track.beats === beats;
  if (!isCurrent) {
    setTrack({ beats, index: 0, isDone: false });
  }
  let index = 0;
  let isDone = false;
  if (isCurrent) {
    index = track.index;
    isDone = track.isDone;
  }
  const beat = beats[index];
  const holdMs = beat.holdMs;
  const hasNext = beats.length > 1;
  const canAdvance = isPlaying && hasNext && !isDone;

  useEffect(() => {
    if (!canAdvance) {
      return;
    }
    const saved = pending.current;
    const isSameBeats = saved?.beats === beats;
    const isSameIndex = saved?.index === index;
    let remaining = holdMs;
    if (saved && isSameBeats && isSameIndex) {
      remaining = saved.remaining;
    }
    pending.current = {
      beats,
      index,
      remaining,
      startedAt: performance.now(),
    };
    const timer = window.setTimeout(() => {
      pending.current = null;
      setTrack((current) => nextTrackOf(current, beats, goesRound));
    }, remaining);
    return () => {
      window.clearTimeout(timer);
      const left = pending.current;
      if (!left) {
        return;
      }
      const spent = performance.now() - left.startedAt;
      const stillLeft = Math.max(0, left.remaining - spent);
      pending.current = { ...left, remaining: stillLeft };
    };
  }, [canAdvance, beats, index, holdMs, goesRound]);

  return { beat, isDone };
}

function beatsOf(
  mode: TypewriterMode,
  phrases: readonly string[],
  slip: TypewriterSlip | null,
  isLooping: boolean
) {
  if (mode === 'cycle') {
    return cycleBeatsOf(phrases);
  }
  const text = phrases[0];
  const beats = retypeBeatsOf(text, slip);
  if (isLooping) {
    return beats;
  }
  beats.push(idleBeat(text, LAST_HOLD_MS));
  return beats;
}

/** Every line the effect can show is laid out unseen in the same place, so the box keeps the size of the longest and nothing around it moves. */
function reservedLinesOf(
  mode: TypewriterMode,
  phrases: readonly string[],
  slip: TypewriterSlip | null
) {
  if (mode === 'cycle') {
    return phrases;
  }
  const text = phrases[0];
  if (!slip) {
    return [text];
  }
  const before = charactersOf(text).slice(0, slip.at).join('');
  return [text, before + slip.typed];
}

function spokenTextOf(mode: TypewriterMode, phrases: readonly string[]) {
  if (mode === 'cycle') {
    return phrases.join(', ');
  }
  return phrases[0];
}

const CARET =
  'bg-primary ms-[0.04em] inline-block h-[1.05em] w-[max(2px,0.07em)] rounded-full align-[-0.16em]';

export type TypewriterProps = {
  /** What the line types. `cycle` types each phrase in turn and goes round; `retype` takes the first phrase only. */
  phrases: readonly string[];
  mode?: TypewriterMode;
  /** In `retype`, the slip it makes before it notices and fixes it. Left out, it swaps two letters of a word near the middle. */
  slip?: TypewriterSlip;
  /** Whether `retype` plays again after it rests. `cycle` always goes round. */
  isLooping?: boolean;
  /** What a screen reader reads in place of the phrases. */
  label?: string;
  className?: string;
};

/**
 * A line that types itself with human timing: it cycles through phrases, taking each back only as
 * far as it differs from the next, or it clears its line and types it again with a slip it fixes.
 * The caret blinks only while the hand rests. Screen readers read the text once, as plain text;
 * under reduced motion the line rests on its first phrase with no caret.
 */
export function Typewriter({
  phrases,
  mode = 'cycle',
  slip,
  isLooping = false,
  label,
  className,
}: TypewriterProps) {
  const { ref, isPlaying, isStill } = usePlayWhileSeen<HTMLSpanElement>();
  const caretRef = useRef<HTMLSpanElement>(null);
  const phrasesKey = phrases.join(PHRASE_SEPARATOR);
  const slipAt = slip?.at ?? -1;
  const slipTyped = slip?.typed ?? '';
  const isCycling = mode === 'cycle';
  const goesRound = isCycling || isLooping;
  const lines = useMemo(() => phrasesKey.split(PHRASE_SEPARATOR), [phrasesKey]);
  const chosenSlip = useMemo(
    () => slipFor(lines[0], slipAt, slipTyped),
    [lines, slipAt, slipTyped]
  );
  const beats = useMemo(
    () => beatsOf(mode, lines, chosenSlip, isLooping),
    [mode, lines, chosenSlip, isLooping]
  );
  const { beat, isDone } = useBeats(beats, isPlaying, goesRound);
  const hasTyping = beats.length > 1;
  const showsCaret = hasTyping && !isStill && !isDone;
  const isBlinking = showsCaret && isPlaying && beat.isIdle;
  const reserved = reservedLinesOf(mode, lines, chosenSlip);
  const spoken = label ?? spokenTextOf(mode, lines);

  useEffect(() => {
    const caret = caretRef.current;
    if (!caret || !isBlinking) {
      return;
    }
    const blink = caret.animate(BLINK_KEYFRAMES, {
      duration: BLINK_MS,
      iterations: Number.POSITIVE_INFINITY,
    });
    return () => blink.cancel();
  }, [isBlinking]);

  return (
    <span
      ref={ref}
      className={cn('relative inline-grid text-start', className)}
    >
      <span className='sr-only'>{spoken}</span>
      {reserved.map((line, index) => (
        <span
          key={index}
          aria-hidden='true'
          className='invisible col-start-1 row-start-1 whitespace-pre-wrap'
        >
          {line}
          <span className={CARET} />
        </span>
      ))}
      <span
        aria-hidden='true'
        className='col-start-1 row-start-1 whitespace-pre-wrap'
      >
        <span
          data-selected={beat.isSelected}
          className='data-[selected=true]:bg-primary/20 rounded-[0.12em] transition-colors duration-100'
        >
          {beat.text}
        </span>
        <span
          ref={caretRef}
          data-shown={showsCaret}
          className={cn(
            CARET,
            'transition-opacity duration-200 data-[shown=false]:opacity-0'
          )}
        />
      </span>
    </span>
  );
}

const PHRASES = ['standup', 'design review', 'launch', 'retro'];

const LINE = 'Draft the release notes before Friday';

const MODES: Segment<TypewriterMode>[] = [
  { value: 'cycle', label: 'Phrases' },
  { value: 'retype', label: 'Typo' },
];

/** The demonstration switches when each line has gone round once and rests again. */
const CYCLE_SHOWN_MS = 13600;

const RETYPE_SHOWN_MS = 9000;

export default function TextEffect01() {
  const [mode, setMode] = useState<TypewriterMode>('cycle');
  const steps: AutoplayStep[] = [
    { after: CYCLE_SHOWN_MS, run: () => setMode('retype') },
    { after: RETYPE_SHOWN_MS, run: () => setMode('cycle') },
  ];
  const { ref } = useAutoplay(steps, {
    loopAfter: 0,
    onReset: () => setMode('cycle'),
  });
  const isCycling = mode === 'cycle';

  useKeptHeight(ref);

  return (
    <div
      ref={ref}
      className='@container flex min-h-36 w-full max-w-[34rem] flex-col gap-5'
    >
      <p className='text-2xl leading-tight font-semibold text-balance @md:text-3xl'>
        {isCycling && (
          <>
            Notes for every <Typewriter key='cycle' phrases={PHRASES} />
          </>
        )}
        {!isCycling && (
          <Typewriter key='retype' mode='retype' phrases={[LINE]} isLooping />
        )}
      </p>
      <Segments
        value={mode}
        segments={MODES}
        onValueChange={setMode}
        label='Typewriter'
        className='self-start'
      />
    </div>
  );
}
