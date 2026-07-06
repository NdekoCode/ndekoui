'use client';

import {
  useEffect,
  useImperativeHandle,
  useRef,
  type CSSProperties,
  type Ref,
} from 'react';

import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  PRESS_LEAD_MS,
  pressedQuietOf,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';

import { DemoBand } from './_parts/demo-band';
import { DEFAULT_HUE } from './_parts/hue';
import { runWhileShowing } from './_parts/loops';
import { clamp } from './_parts/math';
import { softFieldOf } from './_parts/soft-field';

/** A dome of light that stands on the bottom edge of its box and fades out before the other three. */
const DOME = 'ellipse 50% 100% at 50% 100%';

type Loop = {
  from: string;
  to: string;
  /** Milliseconds one way. The four differ, so the two layers never move in step. */
  periodMs: number;
};

type Layer = {
  id: string;
  box: CSSProperties;
  light: CSSProperties;
  drift: Loop;
  breath: Loop;
};

function lightOf(strength: number): CSSProperties {
  return { backgroundImage: softFieldOf(DOME, strength) };
}

const LAYERS: Layer[] = [
  {
    id: 'wide',
    box: { left: '-10%', width: '120%', height: '72%' },
    light: lightOf(26),
    drift: {
      from: 'translateX(-3%)',
      to: 'translateX(3%)',
      periodMs: 23000,
    },
    breath: { from: 'scaleY(1)', to: 'scaleY(1.14)', periodMs: 9000 },
  },
  {
    id: 'tall',
    box: { left: '22%', width: '56%', height: '92%' },
    light: lightOf(18),
    drift: {
      from: 'translateX(8%)',
      to: 'translateX(-8%)',
      periodMs: 31000,
    },
    breath: { from: 'scaleY(0.94)', to: 'scaleY(1.08)', periodMs: 13000 },
  },
];

/** A ring of light near the rim of the same dome: scaled up from a point, it crosses the floor. */
const WAVE_IMAGE =
  'radial-gradient(ellipse 50% 100% at 50% 100%, transparent 58%, color-mix(in oklab, currentColor 30%, transparent) 80%, transparent)';

/** The wave stands on the bottom edge, centred on the point it starts from, and is not seen until it runs. */
const WAVE_CLASS =
  'absolute bottom-0 -ml-[70%] h-full w-[140%] origin-bottom opacity-0';

const WAVE_FRAMES: Keyframe[] = [
  { transform: 'scale(0.06)', opacity: 0 },
  { opacity: 1, offset: 0.18 },
  { transform: 'scale(1)', opacity: 0 },
];

const WAVE_MS = 1600;

const WAVE_EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';

/** Under reduced motion a pulse keeps its size and only fades in and out. */
const STILL_WAVE_FRAMES: Keyframe[] = [
  { transform: 'scale(0.7)', opacity: 0 },
  { transform: 'scale(0.7)', opacity: 1, offset: 0.3 },
  { transform: 'scale(0.7)', opacity: 0 },
];

const STILL_WAVE_MS = 900;

/** Pulses sent faster than they fade do not pile up: past this many, the oldest goes. */
const MAX_WAVES = 4;

type Waves = Map<Animation, HTMLElement>;

function loopOf(element: Element, loop: Loop) {
  const frames = [{ transform: loop.from }, { transform: loop.to }];
  return element.animate(frames, {
    duration: loop.periodMs,
    direction: 'alternate',
    easing: 'ease-in-out',
    iterations: Infinity,
  });
}

function loopsOf(host: HTMLElement) {
  const loops: Animation[] = [];
  LAYERS.forEach((layer, index) => {
    const box = host.children.item(index);
    const light = box?.firstElementChild;
    if (!box || !light) {
      return;
    }
    const drift = loopOf(box, layer.drift);
    const breath = loopOf(light, layer.breath);
    loops.push(drift, breath);
  });
  return loops;
}

function dropWave(waves: Waves, run: Animation) {
  const wave = waves.get(run);
  wave?.remove();
  waves.delete(run);
}

function dropOldest(waves: Waves) {
  const oldest = waves.keys().next().value;
  if (!oldest) {
    return;
  }
  oldest.cancel();
  dropWave(waves, oldest);
}

function dropAll(waves: Waves) {
  const runs = Array.from(waves.keys());
  for (const run of runs) {
    run.cancel();
    dropWave(waves, run);
  }
}

function waveFramesOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return STILL_WAVE_FRAMES;
  }
  return WAVE_FRAMES;
}

function waveMsOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return STILL_WAVE_MS;
  }
  return WAVE_MS;
}

/** One wave is one element that lives as long as its animation, then leaves the page. */
function sendWave(
  host: HTMLElement,
  waves: Waves,
  across: number,
  shouldReduceMotion: boolean
) {
  const isFull = waves.size >= MAX_WAVES;
  if (isFull) {
    dropOldest(waves);
  }
  const wave = document.createElement('div');
  const percent = across * 100;
  wave.className = WAVE_CLASS;
  wave.style.left = `${percent}%`;
  wave.style.backgroundImage = WAVE_IMAGE;
  host.append(wave);
  const run = wave.animate(waveFramesOf(shouldReduceMotion), {
    duration: waveMsOf(shouldReduceMotion),
    easing: WAVE_EASE,
  });
  waves.set(run, wave);
  run.onfinish = () => dropWave(waves, run);
}

export type LightFloorHandle = {
  /** Sends a wave across the floor from a point of its width: 0 is the left edge, 1 the right edge. */
  pulse: (x?: number) => void;
};

export type LightFloorProps = {
  className?: string;
  /** Any colour token, such as `var(--primary)` or `var(--series-2)`. The floor is lit in it. */
  hue?: string;
  handleRef?: Ref<LightFloorHandle>;
};

/**
 * A floor of light that rises from the bottom edge: two soft layers of one hue that drift and
 * breathe, each moved by transforms alone. `pulse(x)`, through `handleRef`, sends a wave across it
 * from a point. A pulse sent while the floor is off screen is dropped, and so is a wave still
 * running when it leaves the screen. It fills its parent, which must be positioned. Under reduced
 * motion the floor stands still and a pulse only fades in and out.
 */
export function LightFloor({
  className,
  hue = DEFAULT_HUE,
  handleRef,
}: LightFloorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const isShowing = useRef(false);
  const waves = useRef<Waves>(new Map());
  const shouldReduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }
    const live = waves.current;
    const loops: Animation[] = [];
    if (!shouldReduceMotion) {
      loops.push(...loopsOf(host));
    }
    const stopLoops = runWhileShowing(host, loops, (isNowShowing) => {
      isShowing.current = isNowShowing;
      if (!isNowShowing) {
        dropAll(live);
      }
    });
    return () => {
      stopLoops();
      isShowing.current = false;
      dropAll(live);
    };
  }, [shouldReduceMotion]);

  useImperativeHandle(
    handleRef,
    () => ({
      pulse(x = 0.5) {
        const host = hostRef.current;
        if (!host || !isShowing.current) {
          return;
        }
        const across = clamp(x, 0, 1);
        sendWave(host, waves.current, across, shouldReduceMotion);
      },
    }),
    [shouldReduceMotion]
  );

  return (
    <div
      ref={hostRef}
      aria-hidden='true'
      style={{ color: hue }}
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden transition-colors duration-500',
        className
      )}
    >
      {LAYERS.map((layer) => (
        <div key={layer.id} style={layer.box} className='absolute bottom-0'>
          <div style={layer.light} className='absolute inset-0 origin-bottom' />
        </div>
      ))}
    </div>
  );
}

type Side = 'left' | 'centre' | 'right';

type Spot = {
  side: Side;
  label: string;
  across: number;
};

const SPOTS: Spot[] = [
  { side: 'left', label: 'Pulse left', across: 0.2 },
  { side: 'centre', label: 'Pulse centre', across: 0.5 },
  { side: 'right', label: 'Pulse right', across: 0.8 },
];

/** Long enough for a wave to cross and fade before the demonstration sends the next one. */
const BETWEEN_PULSES_MS = 1700;

export default function Background06() {
  const floor = useRef<LightFloorHandle>(null);
  const { pressed, press } = usePress<Side>();

  function pulseFrom(spot: Spot) {
    floor.current?.pulse(spot.across);
  }

  function stepsOf(spot: Spot): AutoplayStep[] {
    return [
      { after: BETWEEN_PULSES_MS, run: () => press(spot.side) },
      { after: PRESS_LEAD_MS, run: () => pulseFrom(spot) },
    ];
  }

  const steps = SPOTS.flatMap(stepsOf);
  const { ref } = useAutoplay<HTMLElement>(steps, { loopAfter: 0 });

  return (
    <DemoBand
      ref={ref}
      title='A floor of light that answers a press'
      background={<LightFloor handleRef={floor} />}
    >
      {SPOTS.map((spot) => (
        <Button
          key={spot.side}
          variant='outline'
          onClick={() => pulseFrom(spot)}
          className={pressedQuietOf(pressed === spot.side)}
        >
          {spot.label}
        </Button>
      ))}
    </DemoBand>
  );
}
