import { landTransitions } from './loops';
import { watchPointer } from './pointer';
import { watchShowing } from './showing';

/** A place in a box: from 0 at its left or top edge to 1 at its right or bottom edge. */
export type Aim = {
  x: number;
  y: number;
};

export type AimOptions = {
  /** The round the aim walks while no pointer leads it. The first one is where it rests. */
  waypoints: readonly Aim[];
  /** Milliseconds between two waypoints. */
  stepMs: number;
  /** Milliseconds of the glide to a waypoint: `stepMs` for a walk without a rest, less for one with rests. */
  glideMs: number;
  /** Milliseconds for the aim to reach a pointer. */
  followMs: number;
  isInteractive: boolean;
  /**
   * Sends the picture to `aim` over `durationMs`. A CSS transition carries it there, so nothing is
   * computed on the way and no frame is asked for.
   */
  onAim: (aim: Aim, durationMs: number, isFollowing: boolean) => void;
};

function idle() {}

/**
 * An aim that walks from waypoint to waypoint while the host shows, and goes to the pointer while
 * one is over the host. One timer steps the walk. Hidden, the timer is gone and the glide in flight
 * lands at once where it was going. The function returned ends the watch.
 */
export function watchAim(host: HTMLElement, options: AimOptions) {
  const { waypoints, stepMs, glideMs, followMs, isInteractive, onAim } =
    options;
  const first = waypoints[0];
  if (!first) {
    return idle;
  }
  let index = 0;
  let latest = first;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let isShowing = false;
  let stopPointer = idle;

  function clearStep() {
    clearTimeout(timer);
    timer = undefined;
  }

  function stepOn() {
    const next = index + 1;
    index = next % waypoints.length;
    latest = waypoints[index] ?? first;
    onAim(latest, glideMs, false);
    timer = setTimeout(stepOn, stepMs);
  }

  function follow(x: number, y: number) {
    clearStep();
    const across = x / host.offsetWidth;
    const down = y / host.offsetHeight;
    latest = { x: across, y: down };
    onAim(latest, followMs, true);
  }

  function release() {
    if (isShowing) {
      stepOn();
    }
  }

  function show() {
    isShowing = true;
    if (isInteractive) {
      stopPointer = watchPointer(host, follow, release);
    }
    stepOn();
  }

  function hide() {
    isShowing = false;
    clearStep();
    stopPointer();
    stopPointer = idle;
    onAim(latest, 0, false);
    landTransitions(host);
  }

  const stopShowing = watchShowing(host, (isNowShowing) => {
    if (isNowShowing) {
      show();
      return;
    }
    hide();
  });

  return () => {
    stopShowing();
    hide();
  };
}
