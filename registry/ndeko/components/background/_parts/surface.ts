/** A backing store above two device pixels a point costs four times the fill for a picture nobody sees sharper. */
const MAX_PIXEL_RATIO = 2;

const THEME_WATCH = {
  attributes: true,
  attributeFilter: ['class', 'data-theme'],
};

const DARK_SCHEME = '(prefers-color-scheme: dark)';

export type Surface = {
  canvas: HTMLCanvasElement;
  pen: CanvasRenderingContext2D;
  /** The box of the canvas in CSS pixels: one unit drawn is one of them, whatever the screen. */
  width: number;
  height: number;
  pixelRatio: number;
};

export type Inks = {
  /** The hue of the background, resolved by the browser for the current theme. */
  hue: string;
  /** The neutral of lines: the foreground of the theme. */
  line: string;
};

export function createSurface(canvas: HTMLCanvasElement): Surface | null {
  const pen = canvas.getContext('2d');
  if (!pen) {
    return null;
  }
  return { canvas, pen, width: 0, height: 0, pixelRatio: 1 };
}

function pixelRatioOf() {
  const devicePixelRatio = window.devicePixelRatio || 1;
  return Math.min(devicePixelRatio, MAX_PIXEL_RATIO);
}

/** Sizes the backing store to the box of the canvas and to the screen. It also wipes the canvas. */
export function fitSurface(surface: Surface) {
  const { canvas, pen } = surface;
  const pixelRatio = pixelRatioOf();
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const deviceWidth = width * pixelRatio;
  const deviceHeight = height * pixelRatio;
  surface.width = width;
  surface.height = height;
  surface.pixelRatio = pixelRatio;
  canvas.width = Math.round(deviceWidth);
  canvas.height = Math.round(deviceHeight);
  pen.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

export function isFitted(surface: Surface) {
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
 * where the browser has already resolved the tokens for the current theme. The hue rides on
 * `color` and the neutral of lines on `text-decoration-color`, which paints nothing on a canvas.
 */
export function inksOf(canvas: HTMLCanvasElement): Inks {
  const style = getComputedStyle(canvas);
  return { hue: style.color, line: style.textDecorationColor };
}

export function hasSameInks(first: Inks, second: Inks) {
  const hasSameHue = first.hue === second.hue;
  const hasSameLine = first.line === second.line;
  return hasSameHue && hasSameLine;
}

function densityQueryOf() {
  return `(resolution: ${window.devicePixelRatio}dppx)`;
}

/**
 * Calls `onResize` when the box of the canvas or the density of the screen changes, and `onTheme`
 * when the page may have changed theme: a class or an attribute on the root or the body, or the
 * system setting. The function returned ends the watch.
 */
export function watchSurface(
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
