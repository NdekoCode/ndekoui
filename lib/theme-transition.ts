import { flushSync } from 'react-dom';

/*
 * The theme change as a circle centred on the control that asked for it. Towards light, the new
 * page opens from that point to the farthest corner; towards dark, the old light page closes back
 * into it. Same gesture as the theme switch of the author's portfolio, after the mechanism of
 * Magic UI's animated theme toggler: the circle is written in percentages because Chrome offsets a
 * pixel circle on screens with a fractional scale, and its starting point is set in CSS so Firefox
 * never paints the new theme before the animation starts.
 */

export type ThemeName = 'light' | 'dark';

export type TransitionOrigin = { x: number; y: number };

const THEME_DURATION_MS = 500;
const THEME_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

let generation = 0;

function canAnimate() {
  const hasViewTransitions = typeof document.startViewTransition === 'function';
  if (!hasViewTransitions) {
    return false;
  }
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  return !reducedMotion.matches;
}

function clearTransitionState(id: number) {
  const isLatest = id === generation;
  if (!isLatest) {
    return;
  }
  const root = document.documentElement;
  delete root.dataset.vt;
  delete root.dataset.vtTheme;
  root.style.removeProperty('--vt-clip-from');
  root.style.removeProperty('--vt-duration');
}

function centerOfViewport(): TransitionOrigin {
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
}

/** The centre of an element, where the circle starts. */
export function originOf(element: Element): TransitionOrigin {
  const box = element.getBoundingClientRect();
  const x = box.left + box.width / 2;
  const y = box.top + box.height / 2;
  return { x, y };
}

function circlesFrom(origin: TransitionOrigin) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const xPercent = (origin.x / width) * 100;
  const yPercent = (origin.y / height) * 100;
  const at = `at ${xPercent}% ${yPercent}%`;
  const farthestX = Math.max(origin.x, width - origin.x);
  const farthestY = Math.max(origin.y, height - origin.y);
  const radius = Math.hypot(farthestX, farthestY);
  // A percentage radius is measured against hypot(width, height) / sqrt(2).
  const reference = Math.hypot(width, height) / Math.SQRT2;
  const radiusPercent = (radius / reference) * 100;
  const point = `circle(0% ${at})`;
  const full = `circle(${radiusPercent}% ${at})`;
  return { point, full };
}

/** Switches to `theme` around `origin`, or at once when the browser cannot animate it. `apply` sets the theme synchronously. */
export function transitionTheme(
  theme: ThemeName,
  apply: () => void,
  origin: TransitionOrigin = centerOfViewport()
) {
  if (!canAnimate()) {
    apply();
    return;
  }
  const { point, full } = circlesFrom(origin);
  const opensTowardsLight = theme === 'light';
  const root = document.documentElement;
  generation += 1;
  const id = generation;

  const transition = document.startViewTransition(() => {
    root.dataset.vt = 'theme';
    root.dataset.vtTheme = theme;
    root.style.setProperty('--vt-clip-from', point);
    root.style.setProperty('--vt-duration', `${THEME_DURATION_MS}ms`);
    flushSync(apply);
  });

  let animation: Animation | null = null;

  function animateCircle() {
    let keyframes = [full, point];
    let pseudoElement = '::view-transition-old(root)';
    if (opensTowardsLight) {
      keyframes = [point, full];
      pseudoElement = '::view-transition-new(root)';
    }
    // `fill: forwards` holds the last circle until the snapshots go away. The animation is then
    // cancelled, or it would apply to the snapshots of the next switch.
    animation = root.animate(
      { clipPath: keyframes },
      {
        duration: THEME_DURATION_MS,
        easing: THEME_EASING,
        fill: 'forwards',
        pseudoElement,
      }
    );
  }

  function finish() {
    animation?.cancel();
    clearTransitionState(id);
  }

  transition.ready.then(animateCircle, () => {});
  transition.finished.then(finish, finish);
}

/** Sets the class on <html> at once, so the transition captures the new theme, then lets next-themes store the choice. */
export function applyThemeClass(
  theme: ThemeName,
  setTheme: (theme: string) => void
) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  setTheme(theme);
}
