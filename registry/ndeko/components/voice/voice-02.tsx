'use client';

import {
  useContext,
  useEffect,
  useEffectEvent,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import { WordRoll } from '@/components/core/word-roll';
import { ClockGateContext } from '@/registry/ndeko/hooks/use-agent-run';
import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  hold,
  PRESS_LEAD_MS,
  pressedQuietOf,
  pressedSolidOf,
  spokenUnless,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import { PauseIcon, PlayIcon, RotateCcwIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
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
    return 'text-foreground hover:bg-foreground/[0.06]';
  }
  return 'text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground';
}

function inkedOf(position: number, duration: number, columnCount: number) {
  const progress = position / duration;
  return Math.round(progress * columnCount);
}

function valueTextOf(position: number, duration: number) {
  const spokenPosition = spokenClockOf(position);
  const spokenDuration = spokenClockOf(duration);
  return `${spokenPosition} of ${spokenDuration}`;
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

/** The position of the simulated playback: where it stood when it last started or stopped, and since when it runs. */
type PlaybackClock = {
  position: number;
  startedAt: number | null;
};

type PositionClockHandle = {
  show: (second: number) => void;
};

type PositionClockProps = {
  handleRef: React.Ref<PositionClockHandle>;
  startSecond: number;
  durationText: string;
};

/** The seconds tick in here, so playback re-renders this text and nothing around it. */
function PositionClock({
  handleRef,
  startSecond,
  durationText,
}: PositionClockProps) {
  const [second, setSecond] = useState(startSecond);
  const positionText = formatClock(second * 1000);

  useImperativeHandle(handleRef, () => ({ show: setSecond }));

  return (
    <p className='text-muted-foreground text-xs tabular-nums'>
      <span aria-hidden='true'>
        {positionText} / {durationText}
      </span>
    </p>
  );
}

type TranscriptHandle = {
  show: (wordIndex: number) => void;
};

type TranscriptProps = {
  handleRef: React.Ref<TranscriptHandle>;
  words: TimedWord[];
  startIndex: number;
  onSeek: (position: number) => void;
};

/** The word being said changes in here, and the lines scroll inside their own region to keep it in sight. */
function Transcript({ handleRef, words, startIndex, onSeek }: TranscriptProps) {
  const [wordIndex, setWordIndex] = useState(startIndex);
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();

  useImperativeHandle(handleRef, () => ({ show: setWordIndex }));

  useEffect(() => {
    const container = containerRef.current;
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

  return (
    <div
      ref={containerRef}
      className='bg-foreground/[0.03] dark:bg-foreground/[0.05] relative max-h-24 overflow-y-auto rounded-lg px-3 py-2 text-[13px] leading-6'
    >
      {words.map((word, index) => (
        <span key={index}>
          <span
            data-word={index}
            onClick={() => onSeek(word.start)}
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
  );
}

export type VoiceNotePressKey = 'play' | 'rate';

export type VoiceNoteHandle = {
  /** Shows a key held down. */
  press: (key: VoiceNotePressKey) => void;
  /** Plays or pauses, as the round key does. */
  togglePlay: () => void;
  /** Steps to the next speed, as the speed key does. */
  changeRate: () => void;
  /** Back to a position in milliseconds, paused, at normal speed. */
  reset: (position: number) => void;
};

export type VoiceNoteProps = {
  label: string;
  /** Milliseconds. */
  duration: number;
  /** One level between 0 and 1 per column of dots. */
  levels: number[];
  transcript: TimedWord[];
  /** Where the note stands before it is played, in milliseconds: a note resumed part of the way. */
  defaultPosition?: number;
  /** Runs what the keys do, for a demonstration or a control beside the note. */
  handleRef?: React.Ref<VoiceNoteHandle>;
  /** A demonstration drives the note: nothing is read aloud. */
  isDemonstrated?: boolean;
  className?: string;
};

export function VoiceNote({
  label,
  duration,
  levels,
  transcript,
  defaultPosition = 0,
  handleRef,
  isDemonstrated = false,
  className,
}: VoiceNoteProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [rate, setRate] = useState<Rate>(1);
  const [announcement, setAnnouncement] = useState('');
  const { pressed, press } = usePress<VoiceNotePressKey>();
  const isOnScreen = useContext(ClockGateContext);
  const startPosition = clamped(defaultPosition, duration);
  const startSecond = Math.floor(startPosition / 1000);
  const startInked = inkedOf(startPosition, duration, levels.length);
  const startWord = wordIndexAt(transcript, startPosition);
  const clock = useRef<PlaybackClock | null>(null);
  const rateRef = useRef<Rate>(1);
  const inkedRef = useRef<number | null>(null);
  const secondRef = useRef<number | null>(null);
  const wordRef = useRef<number | null>(null);
  const isScrubbing = useRef(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const waveRef = useRef<HTMLDivElement>(null);
  const positionClock = useRef<PositionClockHandle>(null);
  const transcriptView = useRef<TranscriptHandle>(null);
  const playKey = playKeyOf(isPlaying, isEnded);
  const durationText = formatClock(duration);
  const durationSeconds = Math.floor(duration / 1000);
  // Off screen the playback holds its place: it is a clock like any other of the piece.
  const isRunning = isPlaying && isOnScreen;

  /** Until the note is played or moved, it stands where it was given to start. */
  function savedClock(): PlaybackClock {
    return clock.current ?? { position: startPosition, startedAt: null };
  }

  function positionAt(now: number) {
    const saved = savedClock();
    if (saved.startedAt === null) {
      return saved.position;
    }
    const elapsed = now - saved.startedAt;
    const travelled = elapsed * rateRef.current;
    const position = saved.position + travelled;
    return clamped(position, duration);
  }

  function holdAt(position: number) {
    clock.current = { position, startedAt: null };
  }

  function runFrom(position: number) {
    clock.current = { position, startedAt: performance.now() };
  }

  /** Moves the playback without starting or stopping it. */
  function moveTo(position: number) {
    const isMoving = savedClock().startedAt !== null;
    if (isMoving) {
      runFrom(position);
      return;
    }
    holdAt(position);
  }

  function paintWave(position: number) {
    const inked = inkedOf(position, duration, levels.length);
    if (inked === inkedRef.current) {
      return;
    }
    inkedRef.current = inked;
    const columns = columnsOf(waveRef.current);
    columns.forEach((column, index) => {
      column.dataset.inked = String(index < inked);
    });
  }

  function paintSecond(position: number) {
    const second = Math.floor(position / 1000);
    if (second === secondRef.current) {
      return;
    }
    secondRef.current = second;
    positionClock.current?.show(second);
    const slider = sliderRef.current;
    slider?.setAttribute('aria-valuenow', String(second));
    slider?.setAttribute('aria-valuetext', valueTextOf(position, duration));
  }

  function paintWord(position: number) {
    const wordIndex = wordIndexAt(transcript, position);
    if (wordIndex === wordRef.current) {
      return;
    }
    wordRef.current = wordIndex;
    transcriptView.current?.show(wordIndex);
  }

  /** What a frame changes is written to the elements and to two small leaves, never to this component. */
  function paint(position: number) {
    paintWave(position);
    paintSecond(position);
    paintWord(position);
  }

  function finish() {
    holdAt(duration);
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

  const startClock = useEffectEvent(() => {
    runFrom(savedClock().position);
  });

  const stopClock = useEffectEvent(() => {
    holdAt(positionAt(performance.now()));
  });

  useEffect(() => {
    if (!isRunning) {
      return;
    }
    startClock();
    let frame = 0;
    function tick(now: number) {
      const isAtEnd = onFrame(now);
      if (!isAtEnd) {
        frame = requestAnimationFrame(tick);
      }
    }
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      stopClock();
    };
  }, [isRunning]);

  function play() {
    let position = positionAt(performance.now());
    if (isEnded) {
      position = 0;
    }
    holdAt(position);
    setIsEnded(false);
    setIsPlaying(true);
    setAnnouncement('Playing');
  }

  function pause() {
    const position = positionAt(performance.now());
    holdAt(position);
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
    moveTo(bounded);
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
    moveTo(position);
    rateRef.current = next;
    setRate(next);
    setAnnouncement(`Speed ${next}x`);
  }

  function reset(position: number) {
    const bounded = clamped(position, duration);
    holdAt(bounded);
    rateRef.current = 1;
    paint(bounded);
    setRate(1);
    setIsPlaying(false);
    setIsEnded(false);
    setAnnouncement('');
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

  useImperativeHandle(handleRef, () => ({
    press,
    togglePlay,
    changeRate,
    reset,
  }));

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
          className={pressedSolidOf(pressed === 'play')}
        >
          <Swap swapKey={playKey}>
            <PlayGlyph playKey={playKey} />
          </Swap>
        </Button>
        <div className='flex min-w-0 flex-1 flex-col gap-1'>
          <div
            ref={sliderRef}
            role='slider'
            tabIndex={0}
            aria-label='Position'
            aria-valuemin={0}
            aria-valuemax={durationSeconds}
            aria-valuenow={startSecond}
            aria-valuetext={valueTextOf(startPosition, duration)}
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
                  data-inked={String(index < startInked)}
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
          <PositionClock
            handleRef={positionClock}
            startSecond={startSecond}
            durationText={durationText}
          />
        </div>
        <Button
          type='button'
          variant='outline'
          size='sm'
          aria-label={`Playback speed ${rate}x, change it`}
          onClick={changeRate}
          className={cn(
            'w-14 tabular-nums',
            pressedQuietOf(pressed === 'rate')
          )}
        >
          <WordRoll text={`${rate}x`} labels={RATE_LABELS} value={rate} />
        </Button>
      </div>
      <Transcript
        handleRef={transcriptView}
        words={transcript}
        startIndex={startWord}
        onSeek={seekTo}
      />
      <LiveRegion message={spokenUnless(isDemonstrated, announcement)} />
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

/** The last word of the first sentence: the note opens paused there, part of the way through. */
const START_WORD = 10;

const START_POSITION = NOTE_WORDS[START_WORD].end;

/** How long the demonstration listens at normal speed before it steps to 1.5x. */
const NORMAL_SPEED_MS = 4200;

const FAST_RATE = 1.5;

function fastPlayMsOf() {
  const playedMs = NORMAL_SPEED_MS + PRESS_LEAD_MS;
  const leftMs = NOTE_DURATION - START_POSITION - playedMs;
  return leftMs / FAST_RATE;
}

const FAST_PLAY_MS = fastPlayMsOf();

export default function Voice02() {
  const note = useRef<VoiceNoteHandle>(null);

  const steps: AutoplayStep[] = [
    { after: 1400, run: () => note.current?.press('play') },
    { after: PRESS_LEAD_MS, run: () => note.current?.togglePlay() },
    { after: NORMAL_SPEED_MS, run: () => note.current?.press('rate') },
    { after: PRESS_LEAD_MS, run: () => note.current?.changeRate() },
    { after: FAST_PLAY_MS + 700, run: hold },
  ];
  const { ref, isInView, isAutoplaying } = useAutoplay(steps, {
    loopAfter: 2600,
    onReset: () => note.current?.reset(START_POSITION),
  });

  useKeptHeight(ref);

  return (
    <div ref={ref} className='flex w-full max-w-[26rem] flex-col gap-2'>
      <ClockGate isActive={isInView}>
        <div className='bg-card hairline-ring ring-border rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
          <p className='text-muted-foreground mb-3 text-xs'>
            Voice reply from the assistant
          </p>
          <VoiceNote
            label='Voice reply from the assistant'
            duration={NOTE_DURATION}
            levels={NOTE_LEVELS}
            transcript={NOTE_WORDS}
            defaultPosition={START_POSITION}
            handleRef={note}
            isDemonstrated={isAutoplaying}
          />
        </div>
        <p className='text-muted-foreground px-1 text-[11px]'>
          Illustrative recording: the playback is simulated by a clock
        </p>
      </ClockGate>
    </div>
  );
}
