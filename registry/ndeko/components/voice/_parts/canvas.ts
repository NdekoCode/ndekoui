/** A backing store above two device pixels a point costs four times the fill for a picture nobody sees sharper. */
const MAX_PIXEL_RATIO = 2;

export function pixelRatioOf() {
  const screenRatio = window.devicePixelRatio || 1;
  return Math.min(screenRatio, MAX_PIXEL_RATIO);
}

export function penOf(canvas: HTMLCanvasElement, size: number) {
  const ratio = pixelRatioOf();
  const pixels = Math.round(size * ratio);
  if (canvas.width !== pixels) {
    canvas.width = pixels;
    canvas.height = pixels;
  }
  const pen = canvas.getContext('2d');
  pen?.setTransform(ratio, 0, 0, ratio, 0, 0);
  return pen;
}

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
