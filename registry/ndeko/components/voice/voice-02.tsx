'use client';

import { useReducedMotion } from 'motion/react';
import { useEffect, useEffectEvent, useRef, useState } from 'react';

import { WordRoll } from '@/components/core/word-roll';
import { PauseIcon, PlayIcon, RotateCcwIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { formatClock, spokenClockOf } from '@/registry/ndeko/lib/media-clock';
import { noiseAt } from '@/registry/ndeko/lib/speech-envelope';

export type TimedWord = {
  text: string;
  /** Milliseconds from the start of the recording. */
  start: number;
  end: number;
};

const RATES = [1, 1.5, 2] as const;

type Rate = (typeof RATES)[number];

const RATE_LABELS = RATES.map((rate) => `${rate}x`);

const SEEK_STEP_MS = 5000;

const MAX_DOTS = 5;

type PlayKey = 'play' | 'pause' | 'replay';

const PLAY_LABEL: Record<PlayKey, string> = {
  play: 'Play the voice note',
  pause: 'Pause',
  replay: 'Play it again',
};

function nextRateOf(rate: Rate): Rate {
  const index = RATES.indexOf(rate);
  const nextIndex = (index + 1) % RATES.length;
  return RATES[nextIndex];
}

function dotsOf(level: number) {
  const scaled = level * (MAX_DOTS - 1);
  const rounded = Math.round(scaled);
  return 1 + rounded;
}

/** The last word that has started: it stays lit through the breath that follows it. */
function wordIndexAt(transcript: TimedWord[], position: number) {
  let current = -1;
  for (const [index, word] of transcript.entries()) {
    if (word.start > position) {
      break;
    }
    current = index;
  }
  return current;
}

function playKeyOf(isPlaying: boolean, isEnded: boolean): PlayKey {
  if (isPlaying) {
    return 'pause';
  }
  if (isEnded) {
    return 'replay';
  }
  return 'play';
}

function PlayGlyph({ playKey }: { playKey: PlayKey }) {
  if (playKey === 'pause') {
    return <PauseIcon />;
  }
  if (playKey === 'replay') {
    return <RotateCcwIcon />;
  }
  return <PlayIcon />;
}

function wordToneOf(index: number, current: number) {
  if (index === current) {
    return 'bg-primary/15 text-foreground dark:bg-primary/25';
  }
  if (index < current) {
    return 'text-foreground';
  }
  return 'text-muted-foreground';
}

function clamped(position: number, duration: number) {
  return Math.min(duration, Math.max(0, position));
}

function columnsOf(element: HTMLElement | null) {
  if (!element) {
    return [];
  }
  const children = Array.from(element.children);
  return children.filter((child) => child instanceof HTMLElement);
}

export type VoiceNoteProps = {
  label: string;
  /** Milliseconds. */
  duration: number;
  /** One level between 0 and 1 per column of dots. */
  levels: number[];
  transcript: TimedWord[];
  className?: string;
};

export function VoiceNote({
  label,
  duration,
  levels,
  transcript,
  className,
}: VoiceNoteProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [rate, setRate] = useState<Rate>(1);
  const [second, setSecond] = useState(0);
  const [wordIndex, setWordIndex] = useState(-1);
  const [announcement, setAnnouncement] = useState('');
  const anchor = useRef({ position: 0, time: 0 });
  const isPlayingRef = useRef(false);
  const rateRef = useRef<Rate>(1);
  const inkedRef = useRef(-1);
  const isScrubbing = useRef(false);
  const waveRef = useRef<HTMLDivElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const playKey = playKeyOf(isPlaying, isEnded);
  const positionMs = second * 1000;
  const positionText = formatClock(positionMs);
  const durationText = formatClock(duration);
  const spokenPosition = spokenClockOf(positionMs);
  const spokenDuration = spokenClockOf(duration);
  const valueText = `${spokenPosition} of ${spokenDuration}`;
  const durationSeconds = Math.floor(duration / 1000);

  function positionAt(now: number) {
    const saved = anchor.current;
    if (!isPlayingRef.current) {
      return saved.position;
    }
    const elapsed = now - saved.time;
    const travelled = elapsed * rateRef.current;
    const position = saved.position + travelled;
    return clamped(position, duration);
  }

  function paint(position: number) {
    const progress = position / duration;
    const inked = Math.round(progress * levels.length);
    if (inked !== inkedRef.current) {
      inkedRef.current = inked;
      const columns = columnsOf(waveRef.current);
      columns.forEach((column, index) => {
        column.dataset.inked = String(index < inked);
      });
    }
    const wholeSecond = Math.floor(position / 1000);
    setSecond(wholeSecond);
    setWordIndex(wordIndexAt(transcript, position));
  }

  function anchorAt(position: number) {
    anchor.current = { position, time: performance.now() };
  }

  function finish() {
    isPlayingRef.current = false;
    anchorAt(duration);
    paint(duration);
    setIsPlaying(false);
    setIsEnded(true);
    setAnnouncement('The voice note ended');
  }

  const onFrame = useEffectEvent((now: number) => {
    const position = positionAt(now);
    paint(position);
    const isAtEnd = position >= duration;
    if (isAtEnd) {
      finish();
    }
    return isAtEnd;
  });

  useEffect(() => {
    if (!isPlaying) {
      return;
    }
    let frame = 0;
    function tick(now: number) {
      const isAtEnd = onFrame(now);
      if (!isAtEnd) {
        frame = requestAnimationFrame(tick);
      }
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying]);

  useEffect(() => {
    const container = transcriptRef.current;
    if (!container) {
      return;
    }
    const word = container.querySelector<HTMLElement>(
      `[data-word="${wordIndex}"]`
    );
    if (!word) {
      return;
    }
    const top = word.offsetTop;
    const bottom = top + word.offsetHeight;
    const viewBottom = container.scrollTop + container.clientHeight;
    const isAbove = top < container.scrollTop;
    const isBelow = bottom > viewBottom;
    const isHidden = isAbove || isBelow;
    if (!isHidden) {
      return;
    }
    const behavior = scrollBehaviorOf(shouldReduceMotion);
    const target = top - container.clientHeight / 3;
    container.scrollTo({ top: target, behavior });
  }, [wordIndex, shouldReduceMotion]);

  function play() {
    const startsOver = isEnded;
    const from = positionAt(performance.now());
    let position = from;
    if (startsOver) {
      position = 0;
    }
    anchorAt(position);
    isPlayingRef.current = true;
    setIsEnded(false);
    setIsPlaying(true);
    setAnnouncement('Playing');
  }

  function pause() {
    const position = positionAt(performance.now());
    anchorAt(position);
    isPlayingRef.current = false;
    paint(position);
    setIsPlaying(false);
    const spokenPosition = spokenClockOf(position);
    setAnnouncement(`Paused at ${spokenPosition}`);
  }

  function togglePlay() {
    if (isPlaying) {
      pause();
      return;
    }
    play();
  }

  function seekTo(position: number) {
    const bounded = clamped(position, duration);
    anchorAt(bounded);
    paint(bounded);
    const isBeforeEnd = bounded < duration;
    if (isBeforeEnd) {
      setIsEnded(false);
    }
  }

  function seekBy(step: number) {
    const current = positionAt(performance.now());
    seekTo(current + step);
  }

  function changeRate() {
    const position = positionAt(performance.now());
    const next = nextRateOf(rate);
    anchorAt(position);
    rateRef.current = next;
    setRate(next);
    setAnnouncement(`Speed ${next}x`);
  }

  function positionFromPointer(event: React.PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const offset = event.clientX - rect.left;
    const progress = offset / rect.width;
    return progress * duration;
  }

  function startScrub(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    isScrubbing.current = true;
    seekTo(positionFromPointer(event));
  }

  function moveScrub(event: React.PointerEvent<HTMLDivElement>) {
    if (!isScrubbing.current) {
      return;
    }
    seekTo(positionFromPointer(event));
  }

  function endScrub() {
    isScrubbing.current = false;
  }

  function seekFromKeys(event: React.KeyboardEvent<HTMLDivElement>) {
    const isForward = event.key === 'ArrowRight' || event.key === 'ArrowUp';
    const isBack = event.key === 'ArrowLeft' || event.key === 'ArrowDown';
    if (isForward) {
      event.preventDefault();
      seekBy(SEEK_STEP_MS);
      return;
    }
    if (isBack) {
      event.preventDefault();
      seekBy(-SEEK_STEP_MS);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      seekTo(0);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      seekTo(duration);
      return;
    }
    if (event.key === ' ') {
      event.preventDefault();
      togglePlay();
    }
  }

  return (
    <section
      aria-label={label}
      className={cn('flex flex-col gap-3', className)}
    >
      <div className='flex items-center gap-3'>
        <Button
          type='button'
          size='icon-lg'
          aria-label={PLAY_LABEL[playKey]}
          onClick={togglePlay}
        >
          <Swap swapKey={playKey}>
            <PlayGlyph playKey={playKey} />
          </Swap>
        </Button>
        <div className='flex min-w-0 flex-1 flex-col gap-1'>
          <div
            role='slider'
            tabIndex={0}
            aria-label='Position'
            aria-valuemin={0}
            aria-valuemax={durationSeconds}
            aria-valuenow={second}
            aria-valuetext={valueText}
            onKeyDown={seekFromKeys}
            onPointerDown={startScrub}
            onPointerMove={moveScrub}
            onPointerUp={endScrub}
            onPointerCancel={endScrub}
            className='focus-visible:ring-ring/25 -mx-1 cursor-pointer touch-none rounded-md px-1 outline-none select-none focus-visible:ring-[3px]'
          >
            <div
              ref={waveRef}
              aria-hidden='true'
              className='flex h-9 items-center justify-between'
            >
              {levels.map((level, index) => (
                <span
                  key={index}
                  className='group/column flex w-[3px] flex-col items-center justify-center gap-[3px]'
                >
                  {Array.from({ length: dotsOf(level) }, (_, dot) => (
                    <span
                      key={dot}
                      className='bg-foreground/20 group-data-[inked=true]/column:bg-primary size-[3px] rounded-full transition-colors duration-150'
                    />
                  ))}
                </span>
              ))}
            </div>
          </div>
          <p className='text-muted-foreground text-xs tabular-nums'>
            <span aria-hidden='true'>
              {positionText} / {durationText}
            </span>
          </p>
        </div>
        <Button
          type='button'
          variant='outline'
          size='sm'
          aria-label={`Playback speed ${rate}x, change it`}
          onClick={changeRate}
          className='w-14 tabular-nums'
        >
          <WordRoll text={`${rate}x`} labels={RATE_LABELS} value={rate} />
        </Button>
      </div>
      <div
        ref={transcriptRef}
        className='bg-foreground/[0.03] dark:bg-foreground/[0.05] relative max-h-24 overflow-y-auto rounded-lg px-3 py-2 text-[13px] leading-6'
      >
        {transcript.map((word, index) => (
          <span key={index}>
            <span
              data-word={index}
              onClick={() => seekTo(word.start)}
              className={cn(
                '-mx-0.5 cursor-pointer rounded-[3px] px-0.5 transition-colors duration-150',
                wordToneOf(index, wordIndex)
              )}
            >
              {word.text}
            </span>{' '}
          </span>
        ))}
      </div>
      <LiveRegion message={announcement} />
    </section>
  );
}

function scrollBehaviorOf(shouldReduceMotion: boolean | null): ScrollBehavior {
  if (shouldReduceMotion) {
    return 'auto';
  }
  return 'smooth';
}

const NOTE_TEXT =
  'Hi Jonas, the revised quote from Brightmoor came in this morning. The new rates are about eight percent lower, and they can ship the October order by Friday. I would say we accept, but let us ask for the credit first.';

const NOTE_DURATION = 21_000;

const LEAD_IN_MS = 400;

const TAIL_MS = 600;

const COLUMN_COUNT = 42;

function pauseAfter(word: string) {
  if (/[.!?]$/.test(word)) {
    return 0.55;
  }
  if (/[,;:]$/.test(word)) {
    return 0.3;
  }
  return 0.06;
}

function spokenLengthOf(word: string) {
  return 0.16 + word.length * 0.045;
}

/** Word timings spread over the recording by word length, with breaths after commas and full stops. */
function timedWordsOf(text: string, duration: number): TimedWord[] {
  const words = text.split(' ');
  const lengths = words.map(spokenLengthOf);
  const pauses = words.map(pauseAfter);
  let total = 0;
  words.forEach((_, index) => {
    total += lengths[index] + pauses[index];
  });
  const room = duration - LEAD_IN_MS - TAIL_MS;
  const scale = room / total;
  const timed: TimedWord[] = [];
  let cursor = LEAD_IN_MS;
  words.forEach((word, index) => {
    const spoken = lengths[index] * scale;
    const breath = pauses[index] * scale;
    timed.push({ text: word, start: cursor, end: cursor + spoken });
    cursor += spoken + breath;
  });
  return timed;
}

function isSpeakingAt(words: TimedWord[], time: number) {
  return words.some((word) => {
    const hasStarted = word.start <= time;
    const hasEnded = time > word.end;
    return hasStarted && !hasEnded;
  });
}

function levelsOf(words: TimedWord[], duration: number, columns: number) {
  const levels: number[] = [];
  for (let column = 0; column < columns; column += 1) {
    const middle = (column + 0.5) / columns;
    const time = middle * duration;
    if (!isSpeakingAt(words, time)) {
      levels.push(0);
      continue;
    }
    const grain = noiseAt(column, 3.7);
    levels.push(0.3 + grain * 0.7);
  }
  return levels;
}

const NOTE_WORDS = timedWordsOf(NOTE_TEXT, NOTE_DURATION);

const NOTE_LEVELS = levelsOf(NOTE_WORDS, NOTE_DURATION, COLUMN_COUNT);

export default function Voice02() {
  return (
    <div className='flex w-full max-w-[26rem] flex-col gap-2'>
      <div className='bg-card hairline-ring ring-border rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
        <p className='text-muted-foreground mb-3 text-xs'>
          Voice reply from Lumen
        </p>
        <VoiceNote
          label='Voice reply from Lumen'
          duration={NOTE_DURATION}
          levels={NOTE_LEVELS}
          transcript={NOTE_WORDS}
        />
      </div>
      <p className='text-muted-foreground px-1 text-[11px]'>
        Illustrative recording: the playback is simulated by a clock
      </p>
    </div>
  );
}
