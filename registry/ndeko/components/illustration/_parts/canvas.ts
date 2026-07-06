/** A backing store above two device pixels a point costs four times the fill for a picture nobody sees sharper. */
const MAX_PIXEL_RATIO = 2;

export function pixelRatioOf() {
  const screenRatio = window.devicePixelRatio || 1;
  return Math.min(screenRatio, MAX_PIXEL_RATIO);
}

/** Sizes the backing store of a canvas for the screen and hands back a pen that draws in CSS pixels. */
export function penOf(
  canvas: HTMLCanvasElement,
  width: number,
  height: number
) {
  const ratio = pixelRatioOf();
  const pixelWidth = Math.round(width * ratio);
  const pixelHeight = Math.round(height * ratio);
  if (canvas.width !== pixelWidth) {
    canvas.width = pixelWidth;
  }
  if (canvas.height !== pixelHeight) {
    canvas.height = pixelHeight;
  }
  const pen = canvas.getContext('2d');
  pen?.setTransform(ratio, 0, 0, ratio, 0, 0);
  return pen;
}

/** The value of a theme token where the element stands, or its text colour when the token is not set. */
export function tokenOf(element: Element, token: string) {
  const styles = getComputedStyle(element);
  const value = styles.getPropertyValue(token).trim();
  return value || styles.color;
}

/** A canvas holds the colours it was drawn with: it is told when the theme of the page changes. */
export function watchTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'style', 'data-theme'],
  });
  return () => observer.disconnect();
}
