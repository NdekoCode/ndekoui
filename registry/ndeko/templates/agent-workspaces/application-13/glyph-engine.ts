import {
  inkGlyphs,
  measure,
  paint,
  REST_ALPHA,
  RIPPLE_MS,
  type Lens,
  type Ripple,
  type Surface,
} from './glyph-paint';
import type { Point } from './session';

const POINTER_EASE_S = 0.12;

const DEMO_EASE_S = 0.38;

const FADE_EASE_S = 0.25;

/** A frame that comes late, after a hidden tab, moves the lens no further than this long would. */
const MAX_STEP_S = 0.05;

const REST_PX = 0.4;

/** A press on one of these is a press on the interface, not on the empty field behind it. */
const SOLID = '[data-solid], button, a, input, textarea, select, label';

type FieldState = Surface & {
  lens: Lens;
  target: Lens;
  easeSeconds: number;
  demo: Point | null;
  hasPointer: boolean;
  isLive: boolean;
  ripples: Ripple[];
  frame: number;
  lastTick: number;
};

export type GlyphFieldEngine = {
  aimDemo: (point: Point | null) => void;
  rippleDemo: () => void;
  setLive: (isLive: boolean) => void;
  dispose: () => void;
};

function draw(state: FieldState) {
  const now = performance.now();
  paint(state, state.lens, state.ripples, now);
}

/** The still frame: the lens where it is aimed, no ripple. It is what shows at rest and under reduced motion. */
function settle(state: FieldState) {
  state.lens.x = state.target.x;
  state.lens.y = state.target.y;
  state.lens.alpha = state.target.alpha;
  state.ripples = [];
  draw(state);
}

function isAtRest(state: FieldState) {
  const { lens, target } = state;
  const offsetX = target.x - lens.x;
  const offsetY = target.y - lens.y;
  const distance = Math.hypot(offsetX, offsetY);
  const alphaGap = Math.abs(target.alpha - lens.alpha);
  const isStill = distance < REST_PX;
  const isFaded = alphaGap < REST_ALPHA;
  const isSettled = isStill && isFaded;
  return isSettled && state.ripples.length === 0;
}

/** How much of the way left is covered in `seconds`: the same glide whatever the frame rate. */
function shareOf(seconds: number, easeSeconds: number) {
  const ratio = seconds / easeSeconds;
  const decay = Math.exp(-ratio);
  return 1 - decay;
}

function towards(from: number, to: number, share: number) {
  const gap = to - from;
  const step = gap * share;
  return from + step;
}

function glide(state: FieldState, seconds: number) {
  const { lens, target } = state;
  const move = shareOf(seconds, state.easeSeconds);
  const fade = shareOf(seconds, FADE_EASE_S);
  lens.x = towards(lens.x, target.x, move);
  lens.y = towards(lens.y, target.y, move);
  lens.alpha = towards(lens.alpha, target.alpha, fade);
}

function isAlive(ripple: Ripple, now: number) {
  const age = now - ripple.startedAt;
  return age < RIPPLE_MS;
}

/** Frames are asked for only while something moves. Once the lens has arrived and no ripple is left, the loop ends. */
function tick(state: FieldState, now: number) {
  const sinceLast = now - state.lastTick;
  const elapsed = sinceLast / 1000;
  const seconds = Math.min(MAX_STEP_S, elapsed);
  state.lastTick = now;
  glide(state, seconds);
  state.ripples = state.ripples.filter((ripple) => isAlive(ripple, now));
  if (isAtRest(state)) {
    state.frame = 0;
    settle(state);
    return;
  }
  paint(state, state.lens, state.ripples, now);
  state.frame = requestAnimationFrame((next) => tick(state, next));
}

function wake(state: FieldState) {
  const isAsleep = state.frame === 0;
  if (!state.isLive || !isAsleep) {
    return;
  }
  state.lastTick = performance.now();
  state.frame = requestAnimationFrame((now) => tick(state, now));
}

/** A lens that was away fades in where it is aimed: it does not glide in from where it left. */
function aimAt(state: FieldState, x: number, y: number, easeSeconds: number) {
  const wasAway = state.lens.alpha <= REST_ALPHA;
  state.target.x = x;
  state.target.y = y;
  state.target.alpha = 1;
  state.easeSeconds = easeSeconds;
  if (wasAway) {
    state.lens.x = x;
    state.lens.y = y;
  }
}

/** Without a pointer on the field the lens goes where the demonstration holds it, or away. */
function aimAtDemo(state: FieldState) {
  const { demo } = state;
  if (!demo) {
    state.target.alpha = 0;
    return;
  }
  const x = demo.x * state.width;
  const y = demo.y * state.height;
  aimAt(state, x, y, DEMO_EASE_S);
}

function placeOf(state: FieldState, event: PointerEvent) {
  const box = state.canvas.getBoundingClientRect();
  const x = event.clientX - box.left;
  const y = event.clientY - box.top;
  return { x, y };
}

function isOnEmptySpace(event: PointerEvent) {
  const target = event.target;
  if (!(target instanceof Element)) {
    return false;
  }
  return target.closest(SOLID) === null;
}

function followPointer(state: FieldState, event: PointerEvent) {
  if (!state.isLive) {
    return;
  }
  const place = placeOf(state, event);
  state.hasPointer = true;
  aimAt(state, place.x, place.y, POINTER_EASE_S);
  wake(state);
}

function releasePointer(state: FieldState) {
  state.hasPointer = false;
  if (!state.isLive) {
    return;
  }
  aimAtDemo(state);
  wake(state);
}

function startRipple(state: FieldState, x: number, y: number) {
  const startedAt = performance.now();
  state.ripples.push({ x, y, startedAt });
  wake(state);
}

function pressField(state: FieldState, event: PointerEvent) {
  if (!state.isLive) {
    return;
  }
  followPointer(state, event);
  if (!isOnEmptySpace(event)) {
    return;
  }
  const place = placeOf(state, event);
  startRipple(state, place.x, place.y);
}

/** A new theme: the glyphs take the new colour and the frame is drawn again as it stands. */
function reink(state: FieldState) {
  inkGlyphs(state);
  draw(state);
}

/** A new size: the field is measured again and drawn where it stands, without a glide. */
function refit(state: FieldState) {
  measure(state);
  if (!state.hasPointer) {
    aimAtDemo(state);
  }
  settle(state);
}

function setLive(state: FieldState, isLive: boolean) {
  state.isLive = isLive;
  if (isLive) {
    wake(state);
    return;
  }
  cancelAnimationFrame(state.frame);
  state.frame = 0;
  settle(state);
}

function aimDemo(state: FieldState, point: Point | null) {
  state.demo = point;
  if (state.hasPointer) {
    return;
  }
  aimAtDemo(state);
  if (!state.isLive) {
    settle(state);
    return;
  }
  wake(state);
}

function rippleDemo(state: FieldState) {
  if (!state.isLive) {
    return;
  }
  startRipple(state, state.target.x, state.target.y);
}

/**
 * One canvas behind the content of `host`. The lens follows the pointer over `host`, a press on empty
 * space sends a ripple, and nothing is drawn while nothing moves.
 */
export function createGlyphField(
  canvas: HTMLCanvasElement,
  host: HTMLElement
): GlyphFieldEngine | null {
  const pen = canvas.getContext('2d');
  if (!pen) {
    return null;
  }
  const state: FieldState = {
    canvas,
    pen,
    width: 0,
    height: 0,
    pixelRatio: 1,
    sprites: [],
    inked: [],
    lens: { x: 0, y: 0, alpha: 0 },
    target: { x: 0, y: 0, alpha: 0 },
    easeSeconds: DEMO_EASE_S,
    demo: null,
    hasPointer: false,
    isLive: false,
    ripples: [],
    frame: 0,
    lastTick: 0,
  };

  function onMove(event: PointerEvent) {
    followPointer(state, event);
  }

  function onLeave() {
    releasePointer(state);
  }

  function onPress(event: PointerEvent) {
    pressField(state, event);
  }

  function onResize() {
    refit(state);
  }

  function onTheme() {
    reink(state);
  }

  // The glyphs are inked before anything can ask for a frame.
  measure(state);
  const sizeObserver = new ResizeObserver(onResize);
  const themeObserver = new MutationObserver(onTheme);
  sizeObserver.observe(canvas);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'data-theme'],
  });
  host.addEventListener('pointermove', onMove, { passive: true });
  host.addEventListener('pointerleave', onLeave, { passive: true });
  host.addEventListener('pointerdown', onPress, { passive: true });

  return {
    aimDemo: (point) => aimDemo(state, point),
    rippleDemo: () => rippleDemo(state),
    setLive: (isLive) => setLive(state, isLive),
    dispose() {
      cancelAnimationFrame(state.frame);
      state.frame = 0;
      sizeObserver.disconnect();
      themeObserver.disconnect();
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
      host.removeEventListener('pointerdown', onPress);
    },
  };
}
