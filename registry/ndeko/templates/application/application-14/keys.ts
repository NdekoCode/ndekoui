/**
 * True for Escape pressed inside the element that listens. A list opened from a field is drawn
 * outside its panel, yet its keys still reach the panel: Escape there closes the list and nothing else.
 */
export function isEscapeInside(event: React.KeyboardEvent<HTMLElement>) {
  const target = event.target;
  const isInside =
    target instanceof Node && event.currentTarget.contains(target);
  return event.key === 'Escape' && isInside;
}
