/** A control that waits on a person is pressed by the demonstration after this long. */
export const DECIDE_AFTER_MS = 2500;

/** The row a demonstration presses, when the control it holds down is the one named by `key`. */
export function pressedIdOf(pressed: string | null, key: string, id: string) {
  if (pressed === key) {
    return id;
  }
  return null;
}
