/**
 * A stagger belongs to an entrance. On the way out everything leaves together, so the delay only
 * applies while its element is shown.
 */
export function delayWhile(isShown: boolean, delayMs: number) {
  if (isShown) {
    return { transitionDelay: `${delayMs}ms` };
  }
  return { transitionDelay: '0ms' };
}
