'use client';

import { useEffect, useRef, useState } from 'react';

import { WordRoll } from '@/components/core/word-roll';
import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { speechLevelAt } from '@/registry/ndeko/lib/speech-envelope';
import { cn } from '@/registry/ndeko/lib/utils';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

import { penOf, tokenOf, watchTheme } from './_parts/canvas';
import { radiansOf } from './_parts/geometry';
import { useScenePlay } from './_parts/use-scene-play';

export type FaceState = 'idle' | 'listening' | 'thinking' | 'speaking';

type Weights = Record<FaceState, number>;

/** Where the eyes look, from -1 to 1 on both axes: left to right, up to down. */
type Look = {
  x: number;
  y: number;
};

type Palette = {
  skin: string;
  feature: string;
  ink: string;
};

type FaceFrame = {
  weights: Weights;
  look: Look;
  /** How open the eyes are: 1 open, 0 shut. */
  lid: number;
  level: number;
  seconds: number;
};

type TrailDot = {
  x: number;
  y: number;
  radius: number;
};

const STATES: FaceState[] = ['idle', 'listening', 'thinking', 'speaking'];

const STATE_WORD: Record<FaceState, string> = {
  idle: 'Idle',
  listening: 'Listening',
  thinking: 'Thinking',
  speaking: 'Speaking',
};

const TAU = Math.PI * 2;

/** Every measure of the face is a share of the side of its canvas. */
const HEAD_WIDTH = 0.62;

const HEAD_HEIGHT = 0.58;

const HEAD_RADIUS = 0.2;

const EYE_WIDTH = 0.085;

const EYE_HEIGHT = 0.17;

const EYE_SPREAD = 0.115;

const EYE_LIFT = 0.03;

const LOOK_REACH_X = 0.045;

const LOOK_REACH_Y = 0.035;

/** The eyes never shut to nothing: a blink leaves a line. */
const SHUT_EYE = 0.1;

const WIDER_WHEN_HEARD = 0.22;

const TALLER_WHEN_HEARD = 0.16;

const MOUTH_DROP = 0.145;

const MOUTH_WIDTH = 0.11;

const MOUTH_SHUT = 0.022;

const MOUTH_OPEN = 0.075;

const LISTENING_TILT_DEG = -7;

const THINKING_TILT_DEG = 3;

const BREATH_HERTZ = 0.25;

const BREATH_RISE = 0.008;

/** The thought that leaves the head while it thinks: three dots, each a little further and a little larger. */
const TRAIL: TrailDot[] = [
  { x: 0.3, y: -0.3, radius: 0.022 },
  { x: 0.365, y: -0.37, radius: 0.028 },
  { x: 0.43, y: -0.425, radius: 0.034 },
];

const TRAIL_HERTZ = 0.9;

const TRAIL_LAG = 0.22;

const THINKING_LOOK: Look = { x: 0.8, y: -0.85 };

const CENTRED_LOOK: Look = { x: 0, y: 0 };

/** A pointer this far from the face turns the eyes all the way. */
const POINTER_REACH_PX = 240;

const STATE_EASE_S = 0.22;

const LOOK_EASE_S = 0.12;

/** A frame that comes late, after a hidden tab, moves the face no further than this long would. */
const MAX_STEP_S = 0.05;

const ATTACK = 0.45;

const RELEASE = 0.12;

const BLINK_MS = 150;

const BLINK_MIN_GAP_MS = 2200;

const BLINK_MAX_GAP_MS = 5200;

const VOICE_SEED = 1.6;

function oneHotOf(state: FaceState): Weights {
  return {
    idle: Number(state === 'idle'),
    listening: Number(state === 'listening'),
    thinking: Number(state === 'thinking'),
    speaking: Number(state === 'speaking'),
  };
}

function paletteOf(canvas: HTMLCanvasElement): Palette {
  return {
    skin: tokenOf(canvas, '--primary'),
    feature: tokenOf(canvas, '--primary-foreground'),
    ink: tokenOf(canvas, '--foreground'),
  };
}

function traceBox(
  pen: CanvasRenderingContext2D,
  left: number,
  top: number,
  width: number,
  height: number,
  radius: number
) {
  const right = left + width;
  const bottom = top + height;
  pen.beginPath();
  pen.moveTo(left + radius, top);
  pen.arcTo(right, top, right, bottom, radius);
  pen.arcTo(right, bottom, left, bottom, radius);
  pen.arcTo(left, bottom, left, top, radius);
  pen.arcTo(left, top, right, top, radius);
  pen.closePath();
}

/** A pill centred on a point: its ends are as round as its short side allows. */
function fillPill(
  pen: CanvasRenderingContext2D,
  centreX: number,
  centreY: number,
  width: number,
  height: number
) {
  const shortSide = Math.min(width, height);
  const left = centreX - width / 2;
  const top = centreY - height / 2;
  traceBox(pen, left, top, width, height, shortSide / 2);
  pen.fill();
}

function drawHead(pen: CanvasRenderingContext2D, size: number, skin: string) {
  const width = size * HEAD_WIDTH;
  const height = size * HEAD_HEIGHT;
  pen.fillStyle = skin;
  traceBox(pen, -width / 2, -height / 2, width, height, size * HEAD_RADIUS);
  pen.fill();
}

function drawEyes(
  pen: CanvasRenderingContext2D,
  size: number,
  frame: FaceFrame,
  feature: string
) {
  const heard = frame.weights.listening * frame.level;
  const lid = Math.max(SHUT_EYE, frame.lid);
  const width = size * EYE_WIDTH * (1 + WIDER_WHEN_HEARD * heard);
  const openHeight = size * EYE_HEIGHT * (1 + TALLER_WHEN_HEARD * heard);
  const height = openHeight * lid;
  const lookX = frame.look.x * size * LOOK_REACH_X;
  const lookY = frame.look.y * size * LOOK_REACH_Y;
  const spread = size * EYE_SPREAD;
  const eyeY = lookY - size * EYE_LIFT;
  pen.fillStyle = feature;
  fillPill(pen, lookX - spread, eyeY, width, height);
  fillPill(pen, lookX + spread, eyeY, width, height);
}

function drawMouth(
  pen: CanvasRenderingContext2D,
  size: number,
  frame: FaceFrame,
  feature: string
) {
  const shown = frame.weights.speaking;
  if (shown < 0.01) {
    return;
  }
  const opening = MOUTH_SHUT + MOUTH_OPEN * frame.level;
  pen.globalAlpha = shown;
  pen.fillStyle = feature;
  fillPill(pen, 0, size * MOUTH_DROP, size * MOUTH_WIDTH, size * opening);
  pen.globalAlpha = 1;
}

/** The dots light one after the other, from the head outwards. */
function drawTrail(
  pen: CanvasRenderingContext2D,
  size: number,
  frame: FaceFrame,
  ink: string
) {
  const shown = frame.weights.thinking;
  if (shown < 0.01) {
    return;
  }
  const centre = size / 2;
  pen.fillStyle = ink;
  TRAIL.forEach((dot, index) => {
    const turns = frame.seconds * TRAIL_HERTZ - index * TRAIL_LAG;
    const wave = (Math.sin(turns * TAU) + 1) / 2;
    const light = 0.18 + wave * 0.42;
    const dotX = centre + dot.x * size;
    const dotY = centre + dot.y * size;
    pen.globalAlpha = shown * light;
    pen.beginPath();
    pen.arc(dotX, dotY, dot.radius * size, 0, TAU);
    pen.fill();
  });
  pen.globalAlpha = 1;
}

function drawFace(
  pen: CanvasRenderingContext2D,
  size: number,
  frame: FaceFrame,
  palette: Palette
) {
  const centre = size / 2;
  const calm = frame.weights.idle + frame.weights.thinking;
  const breath = Math.sin(frame.seconds * TAU * BREATH_HERTZ);
  const rise = breath * size * BREATH_RISE * calm;
  const listeningTilt = radiansOf(LISTENING_TILT_DEG) * frame.weights.listening;
  const thinkingTilt = radiansOf(THINKING_TILT_DEG) * frame.weights.thinking;
  pen.clearRect(0, 0, size, size);
  pen.save();
  pen.translate(centre, centre + rise);
  pen.rotate(listeningTilt + thinkingTilt);
  drawHead(pen, size, palette.skin);
  drawEyes(pen, size, frame, palette.feature);
  drawMouth(pen, size, frame, palette.feature);
  pen.restore();
  drawTrail(pen, size, frame, palette.ink);
}

function stillLookOf(state: FaceState) {
  if (state === 'thinking') {
    return THINKING_LOOK;
  }
  return CENTRED_LOOK;
}

/** The frame a face rests on while it does not play: its state at full strength, eyes open, a voice half way. */
function stillFrameOf(state: FaceState): FaceFrame {
  return {
    weights: oneHotOf(state),
    look: stillLookOf(state),
    lid: 1,
    level: 0.55,
    seconds: 0,
  };
}

/** How much of the way left is covered in `seconds`: the same glide whatever the frame rate. */
function shareOf(seconds: number, easeSeconds: number) {
  const decay = Math.exp(-seconds / easeSeconds);
  return 1 - decay;
}

function towards(from: number, to: number, share: number) {
  const gap = to - from;
  return from + gap * share;
}

function easeWeights(weights: Weights, target: Weights, share: number) {
  for (const state of STATES) {
    weights[state] = towards(weights[state], target[state], share);
  }
}

/** A level rises fast and falls slowly, the way a voice is heard. */
function followOf(current: number, target: number) {
  const gap = target - current;
  if (gap > 0) {
    return current + gap * ATTACK;
  }
  return current + gap * RELEASE;
}

function levelFrom(provider: (() => number) | undefined, elapsed: number) {
  if (provider) {
    return provider();
  }
  return speechLevelAt(elapsed, VOICE_SEED);
}

/** A blink shuts the eyes and opens them again in a straight line each way. */
function lidAt(sinceBlinkMs: number) {
  const isBefore = sinceBlinkMs < 0;
  const isAfter = sinceBlinkMs >= BLINK_MS;
  if (isBefore || isAfter) {
    return 1;
  }
  const half = BLINK_MS / 2;
  const fromShut = Math.abs(sinceBlinkMs - half);
  return fromShut / half;
}

function blinkGapOf() {
  const spread = BLINK_MAX_GAP_MS - BLINK_MIN_GAP_MS;
  return BLINK_MIN_GAP_MS + Math.random() * spread;
}

function boundedOf(value: number) {
  const atLeast = Math.max(-1, value);
  return Math.min(1, atLeast);
}

export type AgentFaceProps = {
  state: FaceState;
  /** A live level between 0 and 1, such as a microphone or the voice of the agent. Left out, a simulated voice moves the face. */
  level?: () => number;
  /** The side of the canvas, in pixels. */
  size?: number;
  className?: string;
};

export function AgentFace({
  state,
  level,
  size = 176,
  className,
}: AgentFaceProps) {
  const { ref, isPlaying } = useScenePlay<HTMLCanvasElement>();
  const stateRef = useRef(state);
  const levelRef = useRef(level);

  useEffect(() => {
    stateRef.current = state;
    levelRef.current = level;
  }, [state, level]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || isPlaying) {
      return;
    }
    const surface: HTMLCanvasElement = canvas;

    function drawStill() {
      const pen = penOf(surface, size, size);
      if (!pen) {
        return;
      }
      drawFace(pen, size, stillFrameOf(state), paletteOf(surface));
    }

    drawStill();
    return watchTheme(drawStill);
  }, [ref, isPlaying, state, size]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !isPlaying) {
      return;
    }
    const context = penOf(canvas, size, size);
    if (!context) {
      return;
    }
    const surface: HTMLCanvasElement = canvas;
    const pen: CanvasRenderingContext2D = context;
    const weights = oneHotOf(stateRef.current);
    const look: Look = { x: 0, y: 0 };
    const pointer: Look = { x: 0, y: 0 };
    const shown: FaceFrame = { weights, look, lid: 1, level: 0, seconds: 0 };
    const startedAt = performance.now();
    let palette = paletteOf(surface);
    let last = startedAt;
    let blinkAt = startedAt + blinkGapOf();
    let frame = 0;

    function follow(event: PointerEvent) {
      const box = surface.getBoundingClientRect();
      const centreX = box.left + box.width / 2;
      const centreY = box.top + box.height / 2;
      const across = (event.clientX - centreX) / POINTER_REACH_PX;
      const down = (event.clientY - centreY) / POINTER_REACH_PX;
      pointer.x = boundedOf(across);
      pointer.y = boundedOf(down);
    }

    function draw(now: number) {
      const sinceLast = (now - last) / 1000;
      const step = Math.min(MAX_STEP_S, sinceLast);
      const elapsed = now - startedAt;
      last = now;
      const targetWeights = oneHotOf(stateRef.current);
      const stateShare = shareOf(step, STATE_EASE_S);
      easeWeights(weights, targetWeights, stateShare);
      const thinking = weights.thinking;
      const lookShare = shareOf(step, LOOK_EASE_S);
      const targetX = towards(pointer.x, THINKING_LOOK.x, thinking);
      const targetY = towards(pointer.y, THINKING_LOOK.y, thinking);
      look.x = towards(look.x, targetX, lookShare);
      look.y = towards(look.y, targetY, lookShare);
      const hasBlinked = now - blinkAt >= BLINK_MS;
      if (hasBlinked) {
        blinkAt = now + blinkGapOf();
      }
      const heard = levelFrom(levelRef.current, elapsed);
      shown.lid = lidAt(now - blinkAt);
      shown.level = followOf(shown.level, heard);
      shown.seconds = elapsed / 1000;
      drawFace(pen, size, shown, palette);
      frame = requestAnimationFrame(draw);
    }

    const stopWatching = watchTheme(() => {
      palette = paletteOf(surface);
    });
    window.addEventListener('pointermove', follow, { passive: true });
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', follow);
      stopWatching();
    };
  }, [ref, isPlaying, size]);

  return (
    <canvas
      ref={ref}
      aria-hidden='true'
      style={{ width: size, height: size }}
      className={cn('block', className)}
    />
  );
}

const STATE_LABELS = STATES.map((state) => STATE_WORD[state]);

const SEGMENTS: Segment<FaceState>[] = STATES.map((state) => ({
  value: state,
  label: STATE_WORD[state],
}));

const STATE_HOLD_MS = 2600;

const START_STATE: FaceState = 'listening';

export default function Illustration10() {
  const [state, setState] = useState<FaceState>(START_STATE);
  const steps: AutoplayStep[] = [
    { after: STATE_HOLD_MS, run: () => setState('thinking') },
    { after: STATE_HOLD_MS, run: () => setState('speaking') },
    { after: STATE_HOLD_MS, run: () => setState('idle') },
  ];
  const { ref, isAutoplaying } = useAutoplay(steps, {
    loopAfter: STATE_HOLD_MS,
    onReset: () => setState(START_STATE),
  });

  return (
    <div
      ref={ref}
      className='flex w-full max-w-[20rem] flex-col items-center gap-3'
    >
      <AgentFace state={state} />
      <p className='text-sm font-medium'>
        <WordRoll text={STATE_WORD[state]} labels={STATE_LABELS} />
      </p>
      <Segments
        value={state}
        segments={SEGMENTS}
        onValueChange={setState}
        label='Agent state'
        className='w-full max-w-[19rem]'
      />
      <LiveRegion message={spokenUnless(isAutoplaying, STATE_WORD[state])} />
    </div>
  );
}
