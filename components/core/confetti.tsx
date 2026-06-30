'use client';

import { Button, type ButtonProps } from '@/registry/ndeko/ui/button';

export type ConfettiShape = 'square' | 'circle' | 'ribbon';

export type ConfettiOrigin = { x: number; y: number };

export type ConfettiOptions = {
  particleCount?: number;
  origin?: ConfettiOrigin | Element;
  angle?: number;
  spread?: number;
  velocity?: number;
  decay?: number;
  gravity?: number;
  drift?: number;
  duration?: number;
  colors?: string[];
  shapes?: ConfettiShape[];
  scalar?: number;
};

type Burst = {
  remaining: number;
  resolve: () => void;
};

type Particle = {
  burst: Burst;
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  fall: number;
  drift: number;
  decay: number;
  rotation: number;
  spin: number;
  flip: number;
  flipSpeed: number;
  wobble: number;
  wobbleSpeed: number;
  size: number;
  color: string;
  shape: ConfettiShape;
  opacity: number;
  age: number;
  lifetime: number;
  isStill: boolean;
};

type Stage = {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  particles: Particle[];
  frame: number;
  lastTime: number;
  pixelRatio: number;
  resize: () => void;
};

const FRAME_MS = 1000 / 60;

const MAX_STEP_MS = 50;

const FADE_SHARE = 0.35;

const STILL_LIFETIME_MS = 900;

const STILL_SCATTER = 80;

const MAX_PIXEL_RATIO = 2;

const DEFAULT_COLORS = [
  'var(--primary)',
  'var(--primary-ink)',
  'var(--muted-foreground)',
];

const DEFAULT_SHAPES: ConfettiShape[] = ['ribbon', 'square', 'circle'];

const DEFAULTS = {
  particleCount: 60,
  angle: 90,
  spread: 60,
  velocity: 32,
  decay: 0.9,
  gravity: 1,
  drift: 0,
  duration: 3000,
  scalar: 1,
};

let stage: Stage | null = null;

function randomBetween(min: number, max: number) {
  const span = max - min;
  return min + Math.random() * span;
}

function pickFrom<Item>(items: Item[]) {
  const index = Math.floor(Math.random() * items.length);
  return items[index];
}

function prefersReducedMotion() {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)');
  return query.matches;
}

const TOKEN_PATTERN = /^var\((--[\w-]+)\)$/;

/** Canvas cannot read CSS variables, so `var(--token)` colours are resolved against the document first. */
function resolveColor(color: string) {
  const match = TOKEN_PATTERN.exec(color.trim());
  if (!match) {
    return color;
  }
  const styles = getComputedStyle(document.documentElement);
  const value = styles.getPropertyValue(match[1]).trim();
  if (!value) {
    return 'currentColor';
  }
  return value;
}

function originPointOf(origin: ConfettiOrigin | Element | undefined) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  if (!origin) {
    return { x: width / 2, y: height / 2 };
  }
  if (origin instanceof Element) {
    const box = origin.getBoundingClientRect();
    const centreX = box.left + box.width / 2;
    const centreY = box.top + box.height / 2;
    return { x: centreX, y: centreY };
  }
  return { x: origin.x * width, y: origin.y * height };
}

function createStage(): Stage | null {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    return null;
  }
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText =
    'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:100';
  document.body.append(canvas);
  const created: Stage = {
    canvas,
    context,
    particles: [],
    frame: 0,
    lastTime: 0,
    pixelRatio: 1,
    resize: () => {
      const viewport = document.documentElement;
      const screenRatio = window.devicePixelRatio || 1;
      created.pixelRatio = Math.min(screenRatio, MAX_PIXEL_RATIO);
      canvas.width = viewport.clientWidth * created.pixelRatio;
      canvas.height = viewport.clientHeight * created.pixelRatio;
    },
  };
  created.resize();
  window.addEventListener('resize', created.resize);
  return created;
}

function removeStage(current: Stage) {
  window.removeEventListener('resize', current.resize);
  cancelAnimationFrame(current.frame);
  current.canvas.remove();
  stage = null;
}

function retire(particle: Particle) {
  particle.burst.remaining -= 1;
  if (particle.burst.remaining === 0) {
    particle.burst.resolve();
  }
}

function moveParticle(particle: Particle, steps: number) {
  const decayOverSteps = particle.decay ** steps;
  particle.speedX *= decayOverSteps;
  particle.speedY *= decayOverSteps;
  particle.wobble += particle.wobbleSpeed * steps;
  particle.flip += particle.flipSpeed * steps;
  particle.rotation += particle.spin * steps;
  const sway = Math.sin(particle.wobble) * 0.6;
  particle.x += (particle.speedX + particle.drift + sway) * steps;
  particle.y += (particle.speedY + particle.fall) * steps;
}

function fadeOf(particle: Particle) {
  const progress = particle.age / particle.lifetime;
  if (particle.isStill) {
    const arc = progress * Math.PI;
    return Math.sin(arc);
  }
  const fadeStart = 1 - FADE_SHARE;
  if (progress < fadeStart) {
    return 1;
  }
  const fadeProgress = (progress - fadeStart) / FADE_SHARE;
  return 1 - fadeProgress;
}

function drawShape(context: CanvasRenderingContext2D, particle: Particle) {
  const size = particle.size;
  const half = size / 2;
  if (particle.shape === 'circle') {
    context.beginPath();
    context.arc(0, 0, half, 0, Math.PI * 2);
    context.fill();
    return;
  }
  if (particle.shape === 'ribbon') {
    context.fillRect(-size, -half / 2, size * 2, half);
    return;
  }
  context.fillRect(-half, -half, size, size);
}

function drawParticle(context: CanvasRenderingContext2D, particle: Particle) {
  const fade = fadeOf(particle);
  const turn = Math.cos(particle.flip);
  context.save();
  context.globalAlpha = particle.opacity * fade;
  context.fillStyle = particle.color;
  context.translate(particle.x, particle.y);
  context.rotate(particle.rotation);
  context.scale(1, turn);
  drawShape(context, particle);
  context.restore();
}

function tick(time: number) {
  const current = stage;
  if (!current) {
    return;
  }
  const sinceLastFrame = time - current.lastTime;
  const positiveGap = Math.max(sinceLastFrame, 0);
  const elapsed = Math.min(positiveGap, MAX_STEP_MS);
  const steps = elapsed / FRAME_MS;
  current.lastTime = time;
  const { context, canvas, pixelRatio } = current;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  const alive: Particle[] = [];
  for (const particle of current.particles) {
    particle.age += elapsed;
    const isDone = particle.age >= particle.lifetime;
    if (isDone) {
      retire(particle);
      continue;
    }
    if (!particle.isStill) {
      moveParticle(particle, steps);
    }
    drawParticle(context, particle);
    alive.push(particle);
  }
  current.particles = alive;
  if (alive.length === 0) {
    removeStage(current);
    return;
  }
  current.frame = requestAnimationFrame(tick);
}

function ensureRunning(current: Stage) {
  if (current.frame) {
    return;
  }
  current.lastTime = performance.now();
  current.frame = requestAnimationFrame(tick);
}

type Settings = typeof DEFAULTS & {
  colors: string[];
  shapes: ConfettiShape[];
};

type Point = { x: number; y: number };

function settingsOf(options: ConfettiOptions): Settings {
  return {
    particleCount: options.particleCount ?? DEFAULTS.particleCount,
    angle: options.angle ?? DEFAULTS.angle,
    spread: options.spread ?? DEFAULTS.spread,
    velocity: options.velocity ?? DEFAULTS.velocity,
    decay: options.decay ?? DEFAULTS.decay,
    gravity: options.gravity ?? DEFAULTS.gravity,
    drift: options.drift ?? DEFAULTS.drift,
    duration: options.duration ?? DEFAULTS.duration,
    scalar: options.scalar ?? DEFAULTS.scalar,
    colors: options.colors ?? DEFAULT_COLORS,
    shapes: options.shapes ?? DEFAULT_SHAPES,
  };
}

function flyingParticle(
  burst: Burst,
  start: Point,
  settings: Settings,
  colors: string[]
): Particle {
  const halfSpread = settings.spread / 2;
  const deviation = randomBetween(-halfSpread, halfSpread);
  const launchDegrees = settings.angle + deviation;
  const launch = (launchDegrees * Math.PI) / 180;
  const speedShare = randomBetween(0.45, 1);
  const speed = settings.velocity * speedShare;
  const lifetimeJitter = randomBetween(0.8, 1.1);
  const speedX = Math.cos(launch) * speed;
  const speedY = -Math.sin(launch) * speed;
  const baseSize = randomBetween(5, 9);
  return {
    burst,
    x: start.x,
    y: start.y,
    speedX,
    speedY,
    fall: settings.gravity * 2.4,
    drift: settings.drift,
    decay: settings.decay,
    rotation: randomBetween(0, Math.PI * 2),
    spin: randomBetween(-0.12, 0.12),
    flip: randomBetween(0, Math.PI * 2),
    flipSpeed: randomBetween(0.08, 0.2),
    wobble: randomBetween(0, Math.PI * 2),
    wobbleSpeed: randomBetween(0.05, 0.12),
    size: baseSize * settings.scalar,
    color: pickFrom(colors),
    shape: pickFrom(settings.shapes),
    opacity: randomBetween(0.75, 1),
    age: 0,
    lifetime: settings.duration * lifetimeJitter,
    isStill: false,
  };
}

function stillParticle(
  burst: Burst,
  start: Point,
  settings: Settings,
  colors: string[]
): Particle {
  const direction = randomBetween(0, Math.PI * 2);
  const distance = randomBetween(8, STILL_SCATTER);
  const offsetX = Math.cos(direction) * distance;
  const offsetY = Math.sin(direction) * distance;
  const baseSize = randomBetween(5, 8);
  return {
    burst,
    x: start.x + offsetX,
    y: start.y + offsetY,
    speedX: 0,
    speedY: 0,
    fall: 0,
    drift: 0,
    decay: 1,
    rotation: randomBetween(0, Math.PI * 2),
    spin: 0,
    flip: 0,
    flipSpeed: 0,
    wobble: 0,
    wobbleSpeed: 0,
    size: baseSize * settings.scalar,
    color: pickFrom(colors),
    shape: pickFrom(settings.shapes),
    opacity: randomBetween(0.6, 0.9),
    age: 0,
    lifetime: STILL_LIFETIME_MS,
    isStill: true,
  };
}

const STILL_SHARE = 0.4;

function createParticle(
  isStill: boolean,
  burst: Burst,
  start: Point,
  settings: Settings,
  colors: string[]
) {
  if (isStill) {
    return stillParticle(burst, start, settings, colors);
  }
  return flyingParticle(burst, start, settings, colors);
}

function particleCountOf(settings: Settings, isStill: boolean) {
  if (isStill) {
    const fewer = settings.particleCount * STILL_SHARE;
    return Math.round(fewer);
  }
  return settings.particleCount;
}

/**
 * Throws one burst of confetti from a point of the viewport or from the centre of an element, and
 * resolves once its last piece has gone. With reduced motion, a few pieces fade in place instead.
 */
export function confetti(options: ConfettiOptions = {}) {
  return new Promise<void>((resolve) => {
    const isServer = typeof window === 'undefined';
    if (isServer) {
      resolve();
      return;
    }
    const settings = settingsOf(options);
    const isStill = prefersReducedMotion();
    const count = particleCountOf(settings, isStill);
    if (count <= 0) {
      resolve();
      return;
    }
    const current = stage ?? createStage();
    if (!current) {
      resolve();
      return;
    }
    stage = current;
    const colors = settings.colors.map(resolveColor);
    const start = originPointOf(options.origin);
    const burst: Burst = { remaining: count, resolve };
    for (let index = 0; index < count; index += 1) {
      const particle = createParticle(isStill, burst, start, settings, colors);
      current.particles.push(particle);
    }
    ensureRunning(current);
  });
}

type ButtonClickEvent = Parameters<NonNullable<ButtonProps['onClick']>>[0];

export type ConfettiButtonProps = ButtonProps & {
  options?: ConfettiOptions;
};

export function ConfettiButton({
  options,
  onClick,
  ...props
}: ConfettiButtonProps) {
  function celebrate(event: ButtonClickEvent) {
    onClick?.(event);
    void confetti({ origin: event.currentTarget, ...options });
  }

  return <Button onClick={celebrate} {...props} />;
}
