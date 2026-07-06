/** The step an arrow key asks for along a row: -1 for Left, 1 for Right, 0 for any other key. */
export function sideStepOf(key: string) {
  if (key === 'ArrowLeft') {
    return -1;
  }
  if (key === 'ArrowRight') {
    return 1;
  }
  return 0;
}

/** True when a press landed on a control inside a surface that also answers presses of its own. */
export function isOnControl(target: EventTarget) {
  if (!(target instanceof Element)) {
    return false;
  }
  return target.closest('button, a, input') !== null;
}

/** True when the keyboard brings focus into an element from outside it, not when focus moves within it. */
export function isKeyboardArrival(event: React.FocusEvent<HTMLElement>) {
  const isKeyboardFocus = event.target.matches(':focus-visible');
  const cameFromInside = event.currentTarget.contains(event.relatedTarget);
  return isKeyboardFocus && !cameFromInside;
}

/**
 * A card that goes behind the others turns inert and would drop the focus it holds. Before a deck
 * turns from the keyboard, the group takes the focus, so the next arrow key still reaches it.
 */
export function holdFocusOutsideCards(group: HTMLElement) {
  const focused = document.activeElement;
  if (!(focused instanceof Element)) {
    return;
  }
  const card = focused.closest('li');
  if (!card) {
    return;
  }
  if (group.contains(card)) {
    group.focus();
  }
}
