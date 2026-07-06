/**
 * A background sits behind content for as long as the page is open, so everything it runs hangs on
 * this answer: its box touches the screen and the tab is the one looked at. `onChange` is called
 * each time the answer changes, starting from "not showing". The function returned ends the watch.
 */
export function watchShowing(
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
