/**
 * A drawn object a demonstration presses, a folder or a pass, has no fill to darken: the press
 * shows as scale alone, and deeper than under a finger, so it reads from across the page.
 */
const PRESSED_SHAPE = 'scale-[0.95]';

export function pressedShapeOf(isPressed: boolean) {
  if (isPressed) {
    return PRESSED_SHAPE;
  }
  return undefined;
}
