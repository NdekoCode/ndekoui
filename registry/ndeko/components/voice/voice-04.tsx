'use client';

import { useEffect, useRef, useState } from 'react';

import { WordRoll } from '@/components/core/word-roll';
import { useDocumentVisible } from '@/registry/ndeko/hooks/use-agent-run';
import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import {
  hold,
  PRESS_LEAD_MS,
  pressedQuietOf,
  pressedSolidOf,
  spokenUnless,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import { MicIcon, PhoneOffIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { penOf, tokenOf, watchTheme } from './_parts/canvas';
import { followLevel } from './_parts/level';
import {
  createField,
  drawField,
  geometryOf,
  levelOf,
  settleField,
  stepField,
  stillFrameOf,
  type FieldFrame,
  type FieldPalette,
  type ParticleField,
} from './_parts/particle-field';
import { usePlayWhileSeen } from './_parts/use-play-while-seen';
import {
  easeWeights,
  oneHotOf,
  VOICE_STATE_LABELS,
  VOICE_STATE_WORD,
  type StateTable,
  type VoiceState,
} from './_parts/voice-state';

export type { VoiceState } from './_parts/voice-state';

const STATE_EASE_S = 0.25;

/** A frame is skipped when the last one is younger than this: the sphere never draws above about 66 frames a second. */
const MIN_FRAME_MS = 15;

/** A long stall (a tab that was hidden) moves the springs by this much at most. */
const MAX_STEP_S = 0.05;

function paletteOf(canvas: HTMLCanvasElement): FieldPalette {
  return {
    primary: tokenOf(canvas, '--primary'),
    foreground: tokenOf(canvas, '--foreground'),
  };
}

function fieldOf(holder: { current: ParticleField | null }) {
  if (holder.current === null) {
    holder.current = createField();
  }
  return holder.current;
}

export type ParticleOrbProps = {
  state: VoiceState;
  /** The live level of the voice, between 0 and 1. Left out, a simulated voice drives the sphere. */
  level?: () => number;
  size?: number;
  className?: string;
};

export function ParticleOrb({
  state,
  level,
  size = 200,
  className,
}: ParticleOrbProps) {
  const { ref: canvasRef, isPlaying } = usePlayWhileSeen<HTMLCanvasElement>();
  const stateRef = useRef(state);
  const levelRef = useRef(level);
  const fieldRef = useRef<ParticleField | null>(null);

  useEffect(() => {
    stateRef.current = state;
    levelRef.current = level;
  }, [state, level]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isPlaying) {
      return;
    }
    const pen = penOf(canvas, size);
    if (!pen) {
      return;
    }
    const surface: HTMLCanvasElement = canvas;
    const context: CanvasRenderingContext2D = pen;
    const field = fieldOf(fieldRef);
    const geometry = geometryOf(size);
    const frame = stillFrameOf(state);

    function drawStill() {
      const palette = paletteOf(surface);
      drawField(context, geometry, field, frame, palette);
    }

    settleField(field, frame);
    drawStill();
    return watchTheme(drawStill);
  }, [canvasRef, isPlaying, state, size]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isPlaying) {
      return;
    }
    const pen = penOf(canvas, size);
    if (!pen) {
      return;
    }
    const surface: HTMLCanvasElement = canvas;
    const context: CanvasRenderingContext2D = pen;
    const field = fieldOf(fieldRef);
    const geometry = geometryOf(size);
    const weights: StateTable = oneHotOf(stateRef.current);
    const frame: FieldFrame = { weights, level: 0, seconds: 0 };
    let palette = paletteOf(surface);
    const stopWatching = watchTheme(() => {
      palette = paletteOf(surface);
    });
    const startedAt = performance.now();
    let last = startedAt;
    let handle = 0;

    function draw(now: number) {
      handle = requestAnimationFrame(draw);
      const sinceLast = now - last;
      if (sinceLast < MIN_FRAME_MS) {
        return;
      }
      last = now;
      const step = Math.min(MAX_STEP_S, sinceLast / 1000);
      const elapsed = now - startedAt;
      const stateEase = 1 - Math.exp(-step / STATE_EASE_S);
      easeWeights(weights, oneHotOf(stateRef.current), stateEase);
      const target = levelOf(levelRef.current, weights, elapsed);
      frame.level = followLevel(frame.level, target, step);
      frame.seconds = elapsed / 1000;
      stepField(field, frame, step);
      drawField(context, geometry, field, frame, palette);
    }

    handle = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(handle);
      stopWatching();
    };
  }, [canvasRef, isPlaying, size]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden='true'
      style={{ width: size, height: size }}
      className={cn('block', className)}
    />
  );
}

type CallKey = {
  key: 'start' | 'end';
  label: string;
  icon: React.ReactNode;
  variant: 'default' | 'outline';
};

function callKeyOf(isCalling: boolean): CallKey {
  if (isCalling) {
    return {
      key: 'end',
      label: 'End call',
      icon: <PhoneOffIcon />,
      variant: 'outline',
    };
  }
  return {
    key: 'start',
    label: 'Start talking',
    icon: <MicIcon />,
    variant: 'default',
  };
}

function pressClassOf(isCalling: boolean, isPressed: boolean) {
  if (isCalling) {
    return pressedQuietOf(isPressed);
  }
  return pressedSolidOf(isPressed);
}

const TURN_MS: StateTable = {
  idle: 0,
  listening: 2800,
  thinking: 1900,
  speaking: 3200,
};

const NEXT_STATE: Record<VoiceState, VoiceState> = {
  idle: 'idle',
  listening: 'thinking',
  thinking: 'speaking',
  speaking: 'listening',
};

/** Listens, thinks and speaks once, then listens again before the demonstration ends the call. */
const CALL_MS = 9300;

export default function Voice04() {
  const [state, setState] = useState<VoiceState>('idle');
  const { pressed, press } = usePress<'call'>();
  const isTabVisible = useDocumentVisible();
  const isCalling = state !== 'idle';
  const key = callKeyOf(isCalling);

  function startCall() {
    setState('listening');
  }

  function endCall() {
    setState('idle');
  }

  function toggleCall() {
    if (isCalling) {
      endCall();
      return;
    }
    startCall();
  }

  const steps: AutoplayStep[] = [
    { after: 1500, run: () => press('call') },
    { after: PRESS_LEAD_MS, run: startCall },
    { after: CALL_MS, run: () => press('call') },
    { after: PRESS_LEAD_MS, run: endCall },
    { after: 2200, run: hold },
  ];
  const { ref, isInView, isAutoplaying } = useAutoplay(steps, {
    loopAfter: 700,
    onReset: endCall,
  });
  const isOnScreen = isInView && isTabVisible;

  useEffect(() => {
    if (!isCalling || !isOnScreen) {
      return;
    }
    function nextTurn() {
      setState(NEXT_STATE[state]);
    }

    const timer = setTimeout(nextTurn, TURN_MS[state]);
    return () => clearTimeout(timer);
  }, [state, isCalling, isOnScreen]);

  useKeptHeight(ref);

  return (
    <div
      ref={ref}
      className='flex w-full max-w-[22rem] flex-col items-center gap-4'
    >
      <div className='bg-card hairline-ring ring-border flex w-full flex-col items-center gap-3 rounded-xl px-4 pt-6 pb-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
        <ParticleOrb state={state} />
        <div className='flex flex-col items-center gap-0.5'>
          <p className='text-sm font-medium'>
            <WordRoll
              text={VOICE_STATE_WORD[state]}
              labels={VOICE_STATE_LABELS}
            />
          </p>
          <p className='text-muted-foreground text-xs'>Simulated voice</p>
        </div>
        <Button
          type='button'
          variant={key.variant}
          onClick={toggleCall}
          className={pressClassOf(isCalling, pressed === 'call')}
        >
          <AnimatedSize
            as='span'
            axis='width'
            contentClassName='flex items-center'
          >
            <Swap swapKey={key.key}>
              <span className='flex items-center gap-1.5'>
                {key.icon}
                {key.label}
              </span>
            </Swap>
          </AnimatedSize>
        </Button>
      </div>
      <LiveRegion
        message={spokenUnless(isAutoplaying, VOICE_STATE_WORD[state])}
      />
    </div>
  );
}
