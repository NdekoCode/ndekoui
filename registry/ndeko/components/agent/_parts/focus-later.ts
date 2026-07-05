/** Moves focus once React has committed the change that moved, replaced or removed the focused control. */
export function focusLater(
  root: React.RefObject<HTMLElement | null>,
  selector: string
) {
  requestAnimationFrame(() => {
    const target = root.current?.querySelector<HTMLElement>(selector);
    target?.focus();
  });
}
