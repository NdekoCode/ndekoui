/**
 * The four corners of a bar as numbers in a style object, where a layout animation can read them:
 * a bar that changes size keeps true corners instead of corners stretched with it.
 */
export type Corners = {
  borderTopLeftRadius: number;
  borderTopRightRadius: number;
  borderBottomRightRadius: number;
  borderBottomLeftRadius: number;
};

/** The end of a bar that carries its value is rounded by this much; its baseline end stays square. */
const END_RADIUS = 4;

function cornersOf(
  topLeft: number,
  topRight: number,
  bottomRight: number,
  bottomLeft: number
): Corners {
  return {
    borderTopLeftRadius: topLeft,
    borderTopRightRadius: topRight,
    borderBottomRightRadius: bottomRight,
    borderBottomLeftRadius: bottomLeft,
  };
}

export const SQUARE = cornersOf(0, 0, 0, 0);

export const ROUNDED_TOP = cornersOf(END_RADIUS, END_RADIUS, 0, 0);

export const ROUNDED_BOTTOM = cornersOf(0, 0, END_RADIUS, END_RADIUS);

export const ROUNDED_RIGHT = cornersOf(0, END_RADIUS, END_RADIUS, 0);

export const ROUNDED_LEFT = cornersOf(END_RADIUS, 0, 0, END_RADIUS);

/** A thin meter is rounded at both ends. */
export const ROUNDED_ENDS = cornersOf(2, 2, 2, 2);
