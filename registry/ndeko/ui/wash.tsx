import type { CSSProperties } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

export type WashShape = 'top' | 'cover' | 'bar';

/** Where the ink sits and which way it fades, for each place a wash can take. */
const SHAPE_CLASS: Record<WashShape, string> = {
  top: 'inset-x-0 top-0 h-44 max-h-full',
  cover: 'inset-0',
  bar: 'inset-0 [--wash-a:0%_50%] [--wash-b:24%_100%] [--wash-fade:to_right]',
};

type WashStyle = CSSProperties & { '--wash': string };

type WashProps = {
  /** The hue of the ink: a token or any CSS colour. The primary colour when left out. */
  color?: string;
  /** `top` pours from the top edge of a card, `cover` fills a surface, `bar` runs from the start of a bar. */
  shape?: WashShape;
  /** A wash that says "live right now" follows a state: it fades out when this is false. */
  isShown?: boolean;
  className?: string;
};

function styleOf(color: string | undefined) {
  if (color === undefined) {
    return undefined;
  }
  const style: WashStyle = { '--wash': color };
  return style;
}

/** The attribute is present only while the wash is hidden; the material fades on it. */
function hiddenOf(isShown: boolean) {
  if (isShown) {
    return undefined;
  }
  return '';
}

/**
 * Ink with grain behind the content of a surface. The surface is `relative isolate` and the wash
 * is its first child: the ink stays under the text and takes the corners of the surface, so
 * nothing has to be clipped.
 * One per view: the featured surface, or what is live right now in the hue of its state.
 */
export function Wash({
  color,
  shape = 'top',
  isShown = true,
  className,
}: WashProps) {
  return (
    <span
      aria-hidden='true'
      data-hidden={hiddenOf(isShown)}
      style={styleOf(color)}
      className={cn(
        'grain-wash pointer-events-none absolute -z-10 rounded-[inherit]',
        SHAPE_CLASS[shape],
        className
      )}
    />
  );
}
