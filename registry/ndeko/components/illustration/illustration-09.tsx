'use client';

import { memo, useEffect, useMemo, useRef, useState } from 'react';

import { prefixesOf } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

import { percentOf } from './_parts/geometry';
import { PromptField } from './_parts/prompt-field';
import { keyHoldOf } from './_parts/typing';
import { useSceneFrames, type SceneFrame } from './_parts/use-scene-frames';
import { useScenePlay } from './_parts/use-scene-play';

export type KeyboardLayout = 'qwerty' | 'azerty';

type LayoutPlan = {
  /** The letters of each row, left to right. */
  rows: string[];
  /** How many grid columns each row starts in from the left. A letter key is two columns wide. */
  indents: number[];
};

type KeyPlace = {
  id: string;
  legend: string;
  style: { gridColumn: string; gridRow: number };
  /** Where a ripple starts under the key, on the floor. */
  floorSpot: { left: string; top: string };
};

type Beat = {
  promptIndex: number;
  typed: string;
  pressed: string | null;
  isSent: boolean;
  /** Counts the key presses of the round, so each one starts its own ripple. */
  strike: number;
};

const ENTER = 'enter';

const SPACE = 'space';

const COLUMN_COUNT = 20;

const LETTER_SPAN = 2;

const SPACE_START = 5;

const SPACE_SPAN = 10;

const PLANS: Record<KeyboardLayout, LayoutPlan> = {
  qwerty: { rows: ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'], indents: [0, 1, 2] },
  azerty: { rows: ['azertyuiop', 'qsdfghjklm', 'wxcvbn'], indents: [0, 0, 2] },
};

/** The floor reaches past the keyboard on every side, by these shares of its width and of its height. */
const FLOOR_PAST_X = 0.06;

const FLOOR_PAST_Y = 0.12;

/** The gap between two keys. The height of a row follows from it: a letter key is as tall as it is wide. */
const KEY_GAP_PX = 3;

const KEY_GRID = {
  gridTemplateColumns: `repeat(${COLUMN_COUNT}, minmax(0, 1fr))`,
  gridAutoRows: `calc(10cqw - ${KEY_GAP_PX * 0.9}px)`,
  gap: KEY_GAP_PX,
  transformStyle: 'preserve-3d',
} as const;

const FLOOR_INSET = {
  insetInline: percentOf(-FLOOR_PAST_X),
  insetBlock: percentOf(-FLOOR_PAST_Y),
};

const TILT = {
  transform: 'rotateX(36deg)',
  transformStyle: 'preserve-3d',
} as const;

const REST_MS = 1800;

const ENTER_MS = 150;

const SENT_MS = 420;

const KEY_DOWN_MS = 90;

const KEY_UP_MS = 95;

const TYPING_SEED = 5;

/** Enough rings for a new one at every key while the earlier ones are still spreading. */
const RIPPLE_COUNT = 6;

const RIPPLE_KEYFRAMES: Keyframe[] = [
  { transform: 'scale(0.08)', opacity: 0.8 },
  { transform: 'scale(1)', opacity: 0 },
];

const RIPPLE_TIMING = {
  duration: 950,
  easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
};

const RIPPLES = Array.from({ length: RIPPLE_COUNT }, (_, index) => index);

function floorSpotOf(
  start: number,
  span: number,
  row: number,
  rowCount: number
) {
  const across = (start + span / 2) / COLUMN_COUNT;
  const down = (row + 0.5) / rowCount;
  const floorWidth = 1 + FLOOR_PAST_X * 2;
  const floorHeight = 1 + FLOOR_PAST_Y * 2;
  const left = (FLOOR_PAST_X + across) / floorWidth;
  const top = (FLOOR_PAST_Y + down) / floorHeight;
  return { left: percentOf(left), top: percentOf(top) };
}

function keyPlaceOf(
  id: string,
  legend: string,
  start: number,
  span: number,
  row: number,
  rowCount: number
): KeyPlace {
  const firstColumn = start + 1;
  return {
    id,
    legend,
    style: { gridColumn: `${firstColumn} / span ${span}`, gridRow: row + 1 },
    floorSpot: floorSpotOf(start, span, row, rowCount),
  };
}

/** The letter rows, an Enter key that fills the end of the last one, and a space bar under them. */
function keysOf(plan: LayoutPlan) {
  const rowCount = plan.rows.length + 1;
  const lastRow = plan.rows.length - 1;
  const keys: KeyPlace[] = [];
  plan.rows.forEach((letters, row) => {
    const indent = plan.indents[row];
    Array.from(letters).forEach((letter, index) => {
      const start = indent + index * LETTER_SPAN;
      const legend = letter.toUpperCase();
      keys.push(keyPlaceOf(letter, legend, start, LETTER_SPAN, row, rowCount));
    });
  });
  const lastLetters = plan.rows[lastRow].length;
  const enterStart = plan.indents[lastRow] + lastLetters * LETTER_SPAN;
  const enterSpan = COLUMN_COUNT - enterStart;
  keys.push(
    keyPlaceOf(ENTER, 'Enter', enterStart, enterSpan, lastRow, rowCount)
  );
  keys.push(
    keyPlaceOf(SPACE, '', SPACE_START, SPACE_SPAN, plan.rows.length, rowCount)
  );
  return keys;
}

const KEYS: Record<KeyboardLayout, KeyPlace[]> = {
  qwerty: keysOf(PLANS.qwerty),
  azerty: keysOf(PLANS.azerty),
};

/** The key a character is typed with. A character the keyboard does not draw is typed without a key going down. */
function keyOf(character: string) {
  if (character === ' ') {
    return SPACE;
  }
  const lowered = character.toLowerCase();
  const isLetter = /^[a-z]$/.test(lowered);
  if (isLetter) {
    return lowered;
  }
  return null;
}

/**
 * The book opens on the first prompt, typed. Each next prompt starts with Enter going down and the
 * line leaving, then its keys go down and up one by one. The round ends just before the first
 * prompt is whole again, so the loop closes on its first frame.
 */
function beatsOf(prompts: string[]) {
  const first = prompts[0] ?? '';
  let strike = 0;
  let leaving: Beat = {
    promptIndex: 0,
    typed: first,
    pressed: null,
    isSent: false,
    strike,
  };
  const beats: SceneFrame<Beat>[] = [{ state: leaving, holdMs: REST_MS }];
  for (let offset = 1; offset <= prompts.length; offset += 1) {
    const promptIndex = offset % prompts.length;
    const prompt = prompts[promptIndex];
    const characters = Array.from(prompt);
    strike += 1;
    beats.push({
      state: { ...leaving, pressed: ENTER, strike },
      holdMs: ENTER_MS,
    });
    beats.push({
      state: { ...leaving, isSent: true, strike },
      holdMs: SENT_MS,
    });
    prefixesOf(prompt).forEach((typed, index) => {
      const pressed = keyOf(characters[index]);
      strike += 1;
      const up: Beat = {
        promptIndex,
        typed,
        pressed: null,
        isSent: false,
        strike,
      };
      const upHoldMs = keyHoldOf(index, KEY_UP_MS, TYPING_SEED);
      beats.push({ state: { ...up, pressed }, holdMs: KEY_DOWN_MS });
      beats.push({ state: up, holdMs: upHoldMs });
    });
    leaving = {
      promptIndex,
      typed: prompt,
      pressed: null,
      isSent: false,
      strike,
    };
    beats.push({ state: leaving, holdMs: REST_MS });
  }
  if (beats.length > 1) {
    beats.pop();
  }
  return beats;
}

function labelOf(prompt: string, layout: KeyboardLayout) {
  const name = layout.toUpperCase();
  return `A prompt types itself on a ${name} keyboard: ${prompt}`;
}

type KeycapProps = {
  place: KeyPlace;
  isPressed: boolean;
};

const Keycap = memo(function Keycap({ place, isPressed }: KeycapProps) {
  return (
    <span
      data-pressed={isPressed}
      style={place.style}
      className='keycap-3d text-muted-foreground data-[pressed=true]:text-primary-foreground relative flex [transform:translateZ(5px)] items-center justify-center rounded-md text-[10px] leading-none font-medium transition-[transform,color] duration-100 ease-(--ease-out-strong) data-[pressed=true]:[transform:translateZ(1px)]'
    >
      <span
        data-pressed={isPressed}
        className='bg-primary absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-150 ease-(--ease-out-strong) data-[pressed=true]:opacity-100'
      />
      <span className='relative'>{place.legend}</span>
    </span>
  );
});

export type PromptKeyboardProps = {
  /** The prompts the scene types in turn. Letters and spaces press their keys. */
  prompts: string[];
  layout?: KeyboardLayout;
  className?: string;
};

export function PromptKeyboard({
  prompts,
  layout = 'qwerty',
  className,
}: PromptKeyboardProps) {
  const { ref, isPlaying, isStill } = useScenePlay();
  const floorRef = useRef<HTMLSpanElement>(null);
  const beats = useMemo(() => beatsOf(prompts), [prompts]);
  const beat = useSceneFrames(beats, { isPlaying, isStill });
  const keys = KEYS[layout];
  const pressedKey = keys.find((key) => key.id === beat.pressed);
  const rippleLeft = pressedKey?.floorSpot.left;
  const rippleTop = pressedKey?.floorSpot.top;
  const isSending = beat.pressed === ENTER;
  const isTyping = !beat.isSent;
  const prompt = prompts[beat.promptIndex] ?? '';

  useEffect(() => {
    const floor = floorRef.current;
    const hasSpot = rippleLeft !== undefined && rippleTop !== undefined;
    if (!floor || !hasSpot) {
      return;
    }
    const rings = floor.querySelectorAll<HTMLElement>('[data-ripple]');
    const ring = rings[beat.strike % RIPPLE_COUNT];
    if (!ring) {
      return;
    }
    ring.style.left = rippleLeft;
    ring.style.top = rippleTop;
    ring.animate(RIPPLE_KEYFRAMES, RIPPLE_TIMING);
  }, [beat.strike, rippleLeft, rippleTop]);

  return (
    <div
      ref={ref}
      role='img'
      aria-label={labelOf(prompt, layout)}
      className={cn('flex w-full max-w-[26rem] flex-col gap-2', className)}
    >
      <PromptField
        typed={beat.typed}
        isTyping={isTyping}
        isSending={isSending}
        isSent={beat.isSent}
        lineKey={beat.promptIndex}
      />
      <div
        style={{ perspective: '900px' }}
        className='@container overflow-hidden px-[10%] py-3'
      >
        <div style={TILT} className='relative'>
          <span
            ref={floorRef}
            style={FLOOR_INSET}
            className='bg-primary/[0.06] absolute overflow-hidden rounded-2xl'
          >
            {RIPPLES.map((ripple) => (
              <span
                key={ripple}
                data-ripple=''
                className='bg-primary/[0.06] ring-primary/40 absolute aspect-square w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 ring-[1.5px]'
              />
            ))}
          </span>
          <div style={KEY_GRID} className='relative grid'>
            {keys.map((key) => (
              <Keycap
                key={key.id}
                place={key}
                isPressed={key.id === beat.pressed}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const PROMPTS = [
  'Draft the launch notes',
  'Plan the data migration',
  'Summarise this thread',
];

const LAYOUTS: Segment<KeyboardLayout>[] = [
  { value: 'qwerty', label: 'QWERTY' },
  { value: 'azerty', label: 'AZERTY' },
];

export default function Illustration09() {
  const [layout, setLayout] = useState<KeyboardLayout>('qwerty');

  return (
    <div className='flex w-full max-w-[26rem] flex-col items-center gap-3'>
      <PromptKeyboard prompts={PROMPTS} layout={layout} />
      <Segments
        value={layout}
        segments={LAYOUTS}
        onValueChange={setLayout}
        label='Keyboard layout'
        className='w-44'
      />
    </div>
  );
}
