import { watchShowing } from './showing';

function hold(animations: Animation[]) {
  for (const animation of animations) {
    animation.pause();
  }
}

function resume(animations: Animation[]) {
  for (const animation of animations) {
    animation.play();
  }
}

function cancel(animations: Animation[]) {
  for (const animation of animations) {
    animation.cancel();
  }
}

/**
 * Lands every transition still running under `host` at its end value. A transition asks for frames
 * until it ends, on screen or not, and a host that stops showing must ask for none.
 */
export function landTransitions(host: Element) {
  const animations = host.getAnimations({ subtree: true });
  for (const animation of animations) {
    const isTransition = animation instanceof CSSTransition;
    if (isTransition) {
      animation.finish();
    }
  }
}

/**
 * Endless animations that run only while their host shows. Off screen and in a hidden tab they are
 * paused: they keep their place and ask for no frame. They start paused, and `onShowing` is told
 * each time the host starts or stops showing. The function returned removes them.
 */
export function runWhileShowing(
  host: Element,
  animations: Animation[],
  onShowing?: (isShowing: boolean) => void
) {
  hold(animations);
  const stopWatching = watchShowing(host, (isShowing) => {
    onShowing?.(isShowing);
    if (isShowing) {
      resume(animations);
      return;
    }
    hold(animations);
  });
  return () => {
    stopWatching();
    cancel(animations);
  };
}
