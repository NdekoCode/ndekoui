'use client';

import { useInView, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { WordRoll } from '@/components/core/word-roll';
import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import {
  CircleAlertIcon,
  LoaderIcon,
  MicIcon,
  MicOffIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

import { speechLevelAt } from '@/registry/ndeko/lib/speech-envelope';

import { spokenUnless } from './_parts/demonstration';

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

const STATES: VoiceState[] = ['idle', 'listening', 'thinking', 'speaking'];

const STATE_WORD: Record<VoiceState, string> = {
  idle: 'Idle',
  listening: 'Listening',
  thinking: 'Thinking',
  speaking: 'Speaking',
};

const STATE_LABELS = STATES.map((state) => STATE_WORD[state]);

const TAU = Math.PI * 2;

const BAR_COUNT = 72;

const TICK_COUNT = 120;

/** One tick in ten is longer, so the slow turn of the fine ring can be read. */
const LONG_TICK_EVERY = 10;

const DISC_SHARE = 0.235;

const RING_GAP_SHARE = 0.055;

const REST_LENGTH_SHARE = 0.022;

const MAX_LENGTH_SHARE = 0.125;

const TICK_RING_SHARE = 0.455;

const TICK_LENGTH_SHARE = 0.012;

const LONG_TICK_LENGTH_SHARE = 0.028;

const BAR_WIDTH = 1.6;

const TICK_WIDTH = 1;

const ARC_WIDTH = 2.5;

const BASE_BAR_ALPHA = 0.24;

const TICK_ALPHA = 0.16;

const SPOKEN_ALPHA = 0.85;

/** How far the bars reach while the agent speaks, as a share of their reach while it listens. */
const SPOKEN_REACH = 0.7;

const SWEEP_LIFT = 0.45;

const BREATH_HERTZ = 0.22;

const BREATH_DEPTH = 0.02;

/** The disc grows by this share at the loudest level: it follows the voice without swelling. */
const LEVEL_DEPTH = 0.03;

/** Radians per second: the bars drift one way and the fine ring the other, twice as fast, about a turn a minute. */
const BAR_DRIFT = 0.05;

const TICK_DRIFT = -0.1;

/** Radians per second: a full turn of the thinking arc takes about four seconds. */
const SWEEP_SPEED = 1.6;

const SWEEP_WIDTH = 0.62;

/** Radians: the length of the arc that travels the ring while the agent thinks. */
const ARC_SPAN = 0.7;

/** Seconds for the orb to ease most of the way into a new state. */
const STATE_EASE_S = 0.22;

const ATTACK = 0.45;

const RELEASE = 0.12;

const COLOR_REFRESH_MS = 500;

const INPUT_SEED = 0.4;

const OUTPUT_SEED = 2.2;

type Weights = Record<VoiceState, number>;

type Palette = {
  primary: string;
  foreground: string;
};

type OrbFrame = {
  weights: Weights;
  input: number;
  output: number;
  seconds: number;
};

type Geometry = {
  size: number;
  centre: number;
  disc: number;
  ringStart: number;
  restLength: number;
  maxLength: number;
  tickRing: number;
  tickLength: number;
  longTickLength: number;
};

function oneHotOf(state: VoiceState): Weights {
  return {
    idle: Number(state === 'idle'),
    listening: Number(state === 'listening'),
    thinking: Number(state === 'thinking'),
    speaking: Number(state === 'speaking'),
  };
}

function paletteOf(element: HTMLElement): Palette {
  const styles = getComputedStyle(element);
  const primary = styles.getPropertyValue('--primary').trim();
  const foreground = styles.getPropertyValue('--foreground').trim();
  const fallback = styles.color;
  return {
    primary: primary || fallback,
    foreground: foreground || fallback,
  };
}

function geometryOf(size: number): Geometry {
  const disc = size * DISC_SHARE;
  return {
    size,
    centre: size / 2,
    disc,
    ringStart: disc + size * RING_GAP_SHARE,
    restLength: size * REST_LENGTH_SHARE,
    maxLength: size * MAX_LENGTH_SHARE,
    tickRing: size * TICK_RING_SHARE,
    tickLength: size * TICK_LENGTH_SHARE,
    longTickLength: size * LONG_TICK_LENGTH_SHARE,
  };
}

function angleOfBar(index: number, seconds: number) {
  const share = index / BAR_COUNT;
  const angle = share * TAU;
  const drift = seconds * BAR_DRIFT;
  return angle + drift - Math.PI / 2;
}

function angleOfTick(index: number, seconds: number) {
  const share = index / TICK_COUNT;
  const angle = share * TAU;
  const drift = seconds * TICK_DRIFT;
  return angle + drift - Math.PI / 2;
}

function sweepAngleOf(seconds: number) {
  return seconds * SWEEP_SPEED - Math.PI / 2;
}

/** A slow organic variation around the ring, so the bars never move as one block. */
function shapeOf(index: number, seconds: number) {
  const wobblePhase = index * 0.55 + seconds * 2.1;
  const ripplePhase = index * 1.7 - seconds * 3.3;
  const wobble = Math.sin(wobblePhase);
  const ripple = Math.sin(ripplePhase);
  const mixed = wobble * 0.6 + ripple * 0.4;
  const lifted = (mixed + 1) / 2;
  return 0.35 + lifted * 0.65;
}

function angularDistance(first: number, second: number) {
  const gap = Math.abs(first - second);
  const wrapped = gap % TAU;
  const other = TAU - wrapped;
  return Math.min(wrapped, other);
}

/** How much a bar is lit by the thinking arc as it passes: 1 under it, 0 away from it. */
function sweepOf(barAngle: number, seconds: number) {
  const distance = angularDistance(barAngle, sweepAngleOf(seconds));
  const closeness = 1 - distance / SWEEP_WIDTH;
  const bounded = Math.max(0, closeness);
  return bounded * bounded;
}

function discScaleOf(frame: OrbFrame) {
  const breathAngle = frame.seconds * TAU * BREATH_HERTZ;
  const breath = Math.sin(breathAngle) * BREATH_DEPTH;
  const calm = frame.weights.idle + frame.weights.thinking;
  const heard = frame.weights.listening * frame.input;
  const spoken = frame.weights.speaking * frame.output;
  const level = heard + spoken;
  return 1 + calm * breath + level * LEVEL_DEPTH;
}

function tickLengthOf(index: number, geometry: Geometry) {
  const isLong = index % LONG_TICK_EVERY === 0;
  if (isLong) {
    return geometry.longTickLength;
  }
  return geometry.tickLength;
}

/** Where a bar ends: its rest length, plus what the voice and the passing arc add to it. */
function barEndOf(
  index: number,
  angle: number,
  frame: OrbFrame,
  geometry: Geometry
) {
  const shape = shapeOf(index, frame.seconds);
  const sweep = sweepOf(angle, frame.seconds) * frame.weights.thinking;
  const heard = frame.weights.listening * frame.input * shape;
  const spoken = frame.weights.speaking * frame.output * SPOKEN_REACH * shape;
  const lit = sweep * SWEEP_LIFT;
  const reach = heard + spoken + lit;
  const length = geometry.restLength + reach * geometry.maxLength;
  return geometry.ringStart + length;
}

function addSpoke(
  context: CanvasRenderingContext2D,
  centre: number,
  angle: number,
  from: number,
  to: number
) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  context.moveTo(centre + cos * from, centre + sin * from);
  context.lineTo(centre + cos * to, centre + sin * to);
}

/** The fine ring: every tick in one path, turning against the bars. */
function drawTicks(
  context: CanvasRenderingContext2D,
  geometry: Geometry,
  seconds: number,
  palette: Palette
) {
  context.globalAlpha = TICK_ALPHA;
  context.strokeStyle = palette.foreground;
  context.lineWidth = TICK_WIDTH;
  context.beginPath();
  for (let index = 0; index < TICK_COUNT; index += 1) {
    const angle = angleOfTick(index, seconds);
    const end = geometry.tickRing + tickLengthOf(index, geometry);
    addSpoke(context, geometry.centre, angle, geometry.tickRing, end);
  }
  context.stroke();
}

/** The ring that follows the voice: neutral while it hears, in the brand colour while the agent speaks. */
function drawBars(
  context: CanvasRenderingContext2D,
  geometry: Geometry,
  frame: OrbFrame,
  palette: Palette
) {
  context.lineWidth = BAR_WIDTH;
  context.beginPath();
  for (let index = 0; index < BAR_COUNT; index += 1) {
    const angle = angleOfBar(index, frame.seconds);
    const end = barEndOf(index, angle, frame, geometry);
    addSpoke(context, geometry.centre, angle, geometry.ringStart, end);
  }
  context.globalAlpha = BASE_BAR_ALPHA;
  context.strokeStyle = palette.foreground;
  context.stroke();
  const spokenAlpha = frame.weights.speaking * SPOKEN_ALPHA;
  if (spokenAlpha < 0.01) {
    return;
  }
  context.globalAlpha = spokenAlpha;
  context.strokeStyle = palette.primary;
  context.stroke();
}

/** The bars the thinking arc passes over take its colour, the nearest the most. */
function drawLitBars(
  context: CanvasRenderingContext2D,
  geometry: Geometry,
  frame: OrbFrame,
  palette: Palette
) {
  const strength = frame.weights.thinking;
  if (strength < 0.01) {
    return;
  }
  context.lineWidth = BAR_WIDTH;
  context.strokeStyle = palette.primary;
  for (let index = 0; index < BAR_COUNT; index += 1) {
    const angle = angleOfBar(index, frame.seconds);
    const sweep = sweepOf(angle, frame.seconds) * strength;
    if (sweep < 0.01) {
      continue;
    }
    const end = barEndOf(index, angle, frame, geometry);
    context.globalAlpha = sweep;
    context.beginPath();
    addSpoke(context, geometry.centre, angle, geometry.ringStart, end);
    context.stroke();
  }
}

/** While the agent thinks, a short arc travels the fine ring. */
function drawThinkingArc(
  context: CanvasRenderingContext2D,
  geometry: Geometry,
  frame: OrbFrame,
  palette: Palette
) {
  const strength = frame.weights.thinking;
  if (strength < 0.01) {
    return;
  }
  const head = sweepAngleOf(frame.seconds);
  const radius = geometry.tickRing + geometry.longTickLength / 2;
  context.globalAlpha = strength;
  context.strokeStyle = palette.primary;
  context.lineWidth = ARC_WIDTH;
  context.beginPath();
  context.arc(geometry.centre, geometry.centre, radius, head - ARC_SPAN, head);
  context.stroke();
}

function drawDisc(
  context: CanvasRenderingContext2D,
  geometry: Geometry,
  frame: OrbFrame,
  palette: Palette
) {
  const radius = geometry.disc * discScaleOf(frame);
  context.globalAlpha = 1;
  context.fillStyle = palette.primary;
  context.beginPath();
  context.arc(geometry.centre, geometry.centre, radius, 0, TAU);
  context.fill();
}

function drawOrb(
  context: CanvasRenderingContext2D,
  geometry: Geometry,
  frame: OrbFrame,
  palette: Palette
) {
  context.clearRect(0, 0, geometry.size, geometry.size);
  context.lineCap = 'round';
  drawTicks(context, geometry, frame.seconds, palette);
  drawBars(context, geometry, frame, palette);
  drawLitBars(context, geometry, frame, palette);
  drawThinkingArc(context, geometry, frame, palette);
  drawDisc(context, geometry, frame, palette);
}

function followOf(current: number, target: number) {
  const gap = target - current;
  const isRising = gap > 0;
  if (isRising) {
    return current + gap * ATTACK;
  }
  return current + gap * RELEASE;
}

function levelFrom(
  provider: (() => number) | undefined,
  elapsed: number,
  seed: number
) {
  if (provider) {
    return provider();
  }
  return speechLevelAt(elapsed, seed);
}

function easeWeights(weights: Weights, target: Weights, amount: number) {
  for (const state of STATES) {
    const gap = target[state] - weights[state];
    weights[state] += gap * amount;
  }
}

function stillFrameOf(state: VoiceState): OrbFrame {
  return { weights: oneHotOf(state), input: 0.55, output: 0.5, seconds: 0.4 };
}

function sizeCanvas(canvas: HTMLCanvasElement, size: number) {
  const ratio = window.devicePixelRatio || 1;
  const pixels = Math.round(size * ratio);
  if (canvas.width !== pixels) {
    canvas.width = pixels;
    canvas.height = pixels;
  }
  const context = canvas.getContext('2d');
  context?.setTransform(ratio, 0, 0, ratio, 0, 0);
  return context;
}

export type VoiceOrbProps = {
  state: VoiceState;
  /** The live level of what is heard, between 0 and 1. Left out, a simulated voice drives it. */
  inputLevel?: () => number;
  /** The live level of what the agent says, between 0 and 1. Left out, a simulated voice drives it. */
  outputLevel?: () => number;
  size?: number;
  className?: string;
};

export function VoiceOrb({
  state,
  inputLevel,
  outputLevel,
  size = 176,
  className,
}: VoiceOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);
  const inputRef = useRef(inputLevel);
  const outputRef = useRef(outputLevel);
  const isInView = useInView(canvasRef, { amount: 0.2 });
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    stateRef.current = state;
    inputRef.current = inputLevel;
    outputRef.current = outputLevel;
  }, [state, inputLevel, outputLevel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const isStill = shouldReduceMotion || !isInView;
    if (!isStill) {
      return;
    }
    const context = sizeCanvas(canvas, size);
    if (!context) {
      return;
    }
    drawOrb(context, geometryOf(size), stillFrameOf(state), paletteOf(canvas));
  }, [shouldReduceMotion, isInView, state, size]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const isLive = isInView && !shouldReduceMotion;
    if (!isLive) {
      return;
    }
    const context = sizeCanvas(canvas, size);
    if (!context) {
      return;
    }
    const surface: HTMLCanvasElement = canvas;
    const pen: CanvasRenderingContext2D = context;
    const geometry = geometryOf(size);
    const weights = oneHotOf(stateRef.current);
    const shown: OrbFrame = { weights, input: 0, output: 0, seconds: 0 };
    let palette = paletteOf(surface);
    let paletteAt = performance.now();
    let last = performance.now();
    const startedAt = last;
    let frame = 0;

    function draw(now: number) {
      const sinceLast = (now - last) / 1000;
      const step = Math.min(0.05, sinceLast);
      last = now;
      const elapsed = now - startedAt;
      const amount = 1 - Math.exp(-step / STATE_EASE_S);
      easeWeights(weights, oneHotOf(stateRef.current), amount);
      const heard = levelFrom(inputRef.current, elapsed, INPUT_SEED);
      const spoken = levelFrom(outputRef.current, elapsed, OUTPUT_SEED);
      shown.input = followOf(shown.input, heard);
      shown.output = followOf(shown.output, spoken);
      shown.seconds = elapsed / 1000;
      const isPaletteStale = now - paletteAt > COLOR_REFRESH_MS;
      if (isPaletteStale) {
        palette = paletteOf(surface);
        paletteAt = now;
      }
      drawOrb(pen, geometry, shown, palette);
      frame = requestAnimationFrame(draw);
    }

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [isInView, shouldReduceMotion, size]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden='true'
      style={{ width: size, height: size }}
      className={cn('block', className)}
    />
  );
}

type MicStatus =
  'off' | 'starting' | 'on' | 'refused' | 'missing' | 'failed' | 'unsupported';

type MicSession = {
  stream: MediaStream;
  context: AudioContext;
  analyser: AnalyserNode;
  samples: Uint8Array<ArrayBuffer>;
};

const MIC_GAIN = 3.4;

function statusOfError(error: unknown): MicStatus {
  if (!(error instanceof DOMException)) {
    return 'failed';
  }
  const isRefused = error.name === 'NotAllowedError';
  const isSecurity = error.name === 'SecurityError';
  if (isRefused || isSecurity) {
    return 'refused';
  }
  const isMissing = error.name === 'NotFoundError';
  const isOverconstrained = error.name === 'OverconstrainedError';
  if (isMissing || isOverconstrained) {
    return 'missing';
  }
  return 'failed';
}

function canAskForMicrophone() {
  const devices = navigator.mediaDevices;
  if (!devices) {
    return false;
  }
  return typeof devices.getUserMedia === 'function';
}

function rmsOf(samples: Uint8Array<ArrayBuffer>) {
  let sum = 0;
  for (const sample of samples) {
    const centred = (sample - 128) / 128;
    sum += centred * centred;
  }
  const mean = sum / samples.length;
  return Math.sqrt(mean);
}

function stopTracks(stream: MediaStream) {
  const tracks = stream.getTracks();
  for (const track of tracks) {
    track.stop();
  }
}

function stopSession(session: MicSession) {
  stopTracks(session.stream);
  void session.context.close();
}

/**
 * The microphone level through an analyser. It starts only on an explicit press and every track
 * stops on Stop, on a refusal and on unmount.
 */
function useMicrophoneLevel() {
  const [status, setStatus] = useState<MicStatus>('off');
  const session = useRef<MicSession | null>(null);
  const attempt = useRef(0);

  const release = useCallback(() => {
    attempt.current += 1;
    const current = session.current;
    session.current = null;
    if (current) {
      stopSession(current);
    }
  }, []);

  useEffect(() => release, [release]);

  async function start() {
    if (!canAskForMicrophone()) {
      setStatus('unsupported');
      return;
    }
    release();
    const token = attempt.current;
    setStatus('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const context = new AudioContext();
      const isStale = token !== attempt.current;
      if (isStale) {
        stopTracks(stream);
        void context.close();
        return;
      }
      await context.resume();
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const samples = new Uint8Array(analyser.fftSize);
      session.current = { stream, context, analyser, samples };
      setStatus('on');
    } catch (error) {
      const isStale = token !== attempt.current;
      if (isStale) {
        return;
      }
      setStatus(statusOfError(error));
    }
  }

  function stop() {
    release();
    setStatus('off');
  }

  const readLevel = useCallback(() => {
    const current = session.current;
    if (!current) {
      return 0;
    }
    current.analyser.getByteTimeDomainData(current.samples);
    const rms = rmsOf(current.samples);
    const level = rms * MIC_GAIN;
    return Math.min(1, level);
  }, []);

  return { status, start, stop, readLevel };
}

const MIC_MESSAGE: Partial<Record<MicStatus, string>> = {
  refused:
    'Microphone access was refused. Allow it for this site in the browser settings, then try again.',
  missing: 'No microphone was found. Connect one and try again.',
  failed: 'The microphone could not start. Try again.',
  unsupported:
    'This page cannot reach a microphone here: it needs a secure connection.',
};

const MIC_ANNOUNCEMENT: Partial<Record<MicStatus, string>> = {
  starting: 'Asking for the microphone',
  on: 'Microphone on, the orb follows your voice',
  off: '',
};

const SEGMENTS: Segment<VoiceState>[] = STATES.map((state) => ({
  value: state,
  label: STATE_WORD[state],
}));

type MicButtonLook = {
  key: string;
  label: string;
  icon: React.ReactNode;
};

function micButtonOf(status: MicStatus): MicButtonLook {
  if (status === 'on') {
    return { key: 'stop', label: 'Stop microphone', icon: <MicOffIcon /> };
  }
  if (status === 'starting') {
    return {
      key: 'starting',
      label: 'Asking for access',
      icon: <LoaderIcon className='animate-spin' />,
    };
  }
  return { key: 'use', label: 'Use microphone', icon: <MicIcon /> };
}

function micAnnouncementOf(status: MicStatus) {
  const announcement = MIC_ANNOUNCEMENT[status];
  if (announcement !== undefined) {
    return announcement;
  }
  return MIC_MESSAGE[status] ?? '';
}

function sourceWordOf(status: MicStatus) {
  if (status === 'on') {
    return 'Your microphone';
  }
  return 'Simulated voice';
}

function inputOf(status: MicStatus, readLevel: () => number) {
  if (status === 'on') {
    return readLevel;
  }
  return undefined;
}

/** How long the demonstration stays in each state. */
const STATE_HOLD_MS = 2400;

const START_STATE: VoiceState = 'listening';

export default function Voice01() {
  const [state, setState] = useState<VoiceState>(START_STATE);
  const microphone = useMicrophoneLevel();
  const button = micButtonOf(microphone.status);
  const isOn = microphone.status === 'on';
  const isStarting = microphone.status === 'starting';
  const problem = MIC_MESSAGE[microphone.status];
  const micAnnouncement = micAnnouncementOf(microphone.status);
  const announcement = `${STATE_WORD[state]}. ${micAnnouncement}`;
  const inputLevel = inputOf(microphone.status, microphone.readLevel);

  async function toggleMicrophone() {
    if (isOn) {
      microphone.stop();
      return;
    }
    setState('listening');
    await microphone.start();
  }

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
      className='flex w-full max-w-[22rem] flex-col items-center gap-4'
    >
      <div className='bg-card hairline-ring ring-border flex w-full flex-col items-center gap-3 rounded-xl px-4 pt-6 pb-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
        <VoiceOrb state={state} inputLevel={inputLevel} />
        <div className='flex flex-col items-center gap-0.5'>
          <p className='text-sm font-medium'>
            <WordRoll text={STATE_WORD[state]} labels={STATE_LABELS} />
          </p>
          <p className='text-muted-foreground text-xs'>
            <Swap swapKey={microphone.status}>
              {sourceWordOf(microphone.status)}
            </Swap>
          </p>
        </div>
        <Segments
          value={state}
          segments={SEGMENTS}
          onValueChange={setState}
          label='Voice state'
          className='w-full max-w-[19rem]'
        />
      </div>
      <div className='flex w-full flex-col items-center gap-2'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={isStarting}
          focusableWhenDisabled
          onClick={toggleMicrophone}
        >
          <AnimatedSize
            as='span'
            axis='width'
            contentClassName='flex items-center'
          >
            <Swap swapKey={button.key}>
              <span className='flex items-center gap-1.5'>
                {button.icon}
                {button.label}
              </span>
            </Swap>
          </AnimatedSize>
        </Button>
        <AnimatedSize className='w-full'>
          {problem && (
            <p className='text-muted-foreground flex items-start justify-center gap-2 px-2 text-center text-xs leading-5 text-balance'>
              <CircleAlertIcon className='text-warning-foreground mt-0.5 size-3.5 shrink-0' />
              {problem}
            </p>
          )}
        </AnimatedSize>
      </div>
      <LiveRegion message={spokenUnless(isAutoplaying, announcement)} />
    </div>
  );
}
