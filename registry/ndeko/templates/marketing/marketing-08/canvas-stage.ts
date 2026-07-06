/** A backing store above two device pixels costs four times the fill for a picture nobody sees sharper. */
const MAX_PIXEL_RATIO = 2;

const FRAMES_PER_SECOND = 24;

const FRAME_MS = 1000 / FRAMES_PER_SECOND;

/** The timer between two frames ends this long before the next one is due, so the frame lands on the refresh that is due. */
const REFRESH_LEAD_MS = 5;

const TIMER_MS = FRAME_MS - REFRESH_LEAD_MS;

/** A frame that comes late, after a long task, moves the picture no further than this long would. */
const MAX_STEP_S = 0.05;

const THEME_WATCH = {
  attributes: true,
  attributeFilter: ['class', 'data-theme'],
};

const DARK_SCHEME = '(prefers-color-scheme: dark)';

export const NEXT_FRAME = 0;

export const AT_REST = Number.POSITIVE_INFINITY;

export type Surface = {
  canvas: HTMLCanvasElement;
  pen: CanvasRenderingContext2D;
  width: number;
  height: number;
  pixelRatio: number;
};

export type Inks = {
  hue: string;
  neutral: string;
};

export type Scene = {
  ink: (inks: Inks) => void;
  fit: (surface: Surface, isStill: boolean) => void;
  draw: (surface: Surface) => void;
  step: (surface: Surface, seconds: number) => number;
};

export type Stage = {
  dispose: () => void;
};

export type StageOptions = {
  isStill: boolean;
};

function pixelRatioOf() {
  const screenRatio = window.devicePixelRatio || 1;
  return Math.min(screenRatio, MAX_PIXEL_RATIO);
}

function createSurface(canvas: HTMLCanvasElement): Surface | null {
  const pen = canvas.getContext('2d');
  if (!pen) {
    return null;
  }
  return { canvas, pen, width: 0, height: 0, pixelRatio: 1 };
}

function fitSurface(surface: Surface) {
  const { canvas, pen } = surface;
  const pixelRatio = pixelRatioOf();
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  surface.width = width;
  surface.height = height;
  surface.pixelRatio = pixelRatio;
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  pen.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function isFitted(surface: Surface) {
  const { canvas } = surface;
  const hasWidth = surface.width === canvas.clientWidth;
  const hasHeight = surface.height === canvas.clientHeight;
  const hasRatio = surface.pixelRatio === pixelRatioOf();
  const hasSize = hasWidth && hasHeight;
  return hasSize && hasRatio;
}

export function wipeSurface(surface: Surface) {
  surface.pen.globalAlpha = 1;
  surface.pen.clearRect(0, 0, surface.width, surface.height);
}

/**
 * A canvas cannot take a colour from a class, so it reads its colours from its own computed style,
 * where the browser has already resolved the tokens for the current theme: the hue rides on
 * `color`, the neutral on `text-decoration-color`, which paints nothing on a canvas.
 */
function inksOf(canvas: HTMLCanvasElement): Inks {
  const style = getComputedStyle(canvas);
  return { hue: style.color, neutral: style.textDecorationColor };
}

function hasSameInks(first: Inks, second: Inks) {
  const hasSameHue = first.hue === second.hue;
  const hasSameNeutral = first.neutral === second.neutral;
  return hasSameHue && hasSameNeutral;
}

function densityQueryOf() {
  return `(resolution: ${window.devicePixelRatio}dppx)`;
}

function watchSurface(
  canvas: HTMLCanvasElement,
  onResize: () => void,
  onTheme: () => void
) {
  const sizeObserver = new ResizeObserver(() => onResize());
  const themeObserver = new MutationObserver(() => onTheme());
  const scheme = window.matchMedia(DARK_SCHEME);
  let density = window.matchMedia(densityQueryOf());

  function onScheme() {
    onTheme();
  }

  /** The query names one density: once the screen has left it, a new query watches the next one. */
  function onDensity() {
    density.removeEventListener('change', onDensity);
    density = window.matchMedia(densityQueryOf());
    density.addEventListener('change', onDensity);
    onResize();
  }

  sizeObserver.observe(canvas);
  themeObserver.observe(document.documentElement, THEME_WATCH);
  themeObserver.observe(document.body, THEME_WATCH);
  scheme.addEventListener('change', onScheme);
  density.addEventListener('change', onDensity);

  return () => {
    sizeObserver.disconnect();
    themeObserver.disconnect();
    scheme.removeEventListener('change', onScheme);
    density.removeEventListener('change', onDensity);
  };
}

function watchShowing(
  element: Element,
  onChange: (isShowing: boolean) => void
) {
  let isOnScreen = false;
  let wasShowing = false;

  function report() {
    const isTabShown = document.visibilityState === 'visible';
    const isShowing = isOnScreen && isTabShown;
    if (isShowing === wasShowing) {
      return;
    }
    wasShowing = isShowing;
    onChange(isShowing);
  }

  function onCrossing(entries: IntersectionObserverEntry[]) {
    const latest = entries.at(-1);
    if (!latest) {
      return;
    }
    isOnScreen = latest.isIntersecting;
    report();
  }

  const observer = new IntersectionObserver(onCrossing);
  observer.observe(element);
  document.addEventListener('visibilitychange', report);

  return () => {
    observer.disconnect();
    document.removeEventListener('visibilitychange', report);
  };
}

type FrameHandler = (seconds: number) => number;

type FrameLoop = {
  start: () => void;
  stop: () => void;
  wake: () => void;
};

/**
 * Frames at twenty-four a second at most. Between two frames there is one timer and no animation
 * frame, so a fast screen does not run extra rounds of main-thread work. Stopped or at rest, the
 * loop holds no timer and asks for no frame.
 */
function createFrameLoop(onFrame: FrameHandler): FrameLoop {
  let frame = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let isStarted = false;
  let lastFrameAt = 0;

  function clearPending() {
    cancelAnimationFrame(frame);
    clearTimeout(timer);
    frame = 0;
    timer = undefined;
  }

  function askForFrame() {
    timer = undefined;
    frame = requestAnimationFrame(tick);
  }

  function schedule(wait: number) {
    clearPending();
    const now = performance.now();
    const sinceFrame = now - lastFrameAt;
    const untilCap = TIMER_MS - sinceFrame;
    const delay = Math.max(wait, untilCap);
    if (delay <= 0) {
      askForFrame();
      return;
    }
    timer = setTimeout(askForFrame, delay);
  }

  function tick(now: number) {
    frame = 0;
    const elapsedMs = now - lastFrameAt;
    const elapsed = elapsedMs / 1000;
    const forward = Math.max(0, elapsed);
    const seconds = Math.min(forward, MAX_STEP_S);
    lastFrameAt = now;
    const wait = onFrame(seconds);
    const isResting = wait === AT_REST;
    if (isResting || !isStarted) {
      return;
    }
    schedule(wait);
  }

  function start() {
    if (isStarted) {
      return;
    }
    isStarted = true;
    lastFrameAt = performance.now() - FRAME_MS;
    schedule(NEXT_FRAME);
  }

  function stop() {
    isStarted = false;
    clearPending();
  }

  function wake() {
    const isFrameComing = frame !== 0;
    if (!isStarted || isFrameComing) {
      return;
    }
    schedule(NEXT_FRAME);
  }

  return { start, stop, wake };
}

function stageOf(
  surface: Surface,
  scene: Scene,
  { isStill }: StageOptions
): Stage {
  const { canvas } = surface;
  let inks = inksOf(canvas);

  const loop = createFrameLoop((seconds) => scene.step(surface, seconds));

  function lay() {
    fitSurface(surface);
    scene.fit(surface, isStill);
    scene.draw(surface);
  }

  function onResize() {
    if (isFitted(surface)) {
      return;
    }
    lay();
    loop.wake();
  }

  function onTheme() {
    const latest = inksOf(canvas);
    if (hasSameInks(inks, latest)) {
      return;
    }
    inks = latest;
    scene.ink(inks);
    scene.draw(surface);
    loop.wake();
  }

  function onScroll() {
    loop.wake();
  }

  function onShowing(isShowing: boolean) {
    if (isShowing && !isStill) {
      window.addEventListener('scroll', onScroll, { passive: true });
      loop.start();
      return;
    }
    window.removeEventListener('scroll', onScroll);
    loop.stop();
  }

  scene.ink(inks);
  lay();
  const stopSurface = watchSurface(canvas, onResize, onTheme);
  const stopShowing = watchShowing(canvas, onShowing);

  return {
    dispose() {
      stopShowing();
      stopSurface();
      window.removeEventListener('scroll', onScroll);
      loop.stop();
    },
  };
}

export function mountStage(
  canvas: HTMLCanvasElement,
  scene: Scene,
  options: StageOptions
) {
  const surface = createSurface(canvas);
  if (!surface) {
    return null;
  }
  return stageOf(surface, scene, options);
}
