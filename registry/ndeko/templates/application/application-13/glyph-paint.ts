const CELL_PX = 22;

const HALF_CELL_PX = CELL_PX / 2;

const GLYPH_PX = 12;

const SPRITE_PX = 16;

const HALF_SPRITE_PX = SPRITE_PX / 2;

const GLYPHS = ['·', '+', '/'];

/** Out of a hundred cells, how many are dots and how many are dots or plus signs. The rest are slashes. */
const DOT_SHARE = 62;

const DOT_OR_PLUS_SHARE = 86;

const LENS_RADIUS_PX = 150;

/** The glyphs stay faint at the heart of the lens: text sits above the field and must stay easy to read. */
const LENS_INK = 0.6;

export const RIPPLE_MS = 1500;

const RIPPLE_SPEED_PX = 560;

const RIPPLE_HALF_BAND_PX = 27;

const RIPPLE_PUSH_PX = 5;

const RIPPLE_INK = 0.55;

/** A backing store above two device pixels a point costs four times the fill for glyphs nobody sees sharper. */
const MAX_PIXEL_RATIO = 2;

/** Under this much ink a lens counts as away: it is neither drawn nor waited for. */
export const REST_ALPHA = 0.01;

export type Lens = {
  x: number;
  y: number;
  alpha: number;
};

export type Ripple = {
  x: number;
  y: number;
  startedAt: number;
};

type Cells = {
  first: number;
  last: number;
};

type Patch = {
  x: number;
  y: number;
  side: number;
};

export type Surface = {
  canvas: HTMLCanvasElement;
  pen: CanvasRenderingContext2D;
  width: number;
  height: number;
  pixelRatio: number;
  sprites: HTMLCanvasElement[];
  inked: Patch[];
};

/** The same cell always shows the same glyph, so the field does not shuffle between two frames. */
function glyphIndexOf(column: number, row: number) {
  const columnHash = Math.imul(column, 73856093);
  const rowHash = Math.imul(row, 19349663);
  const mixed = Math.imul(columnHash ^ rowHash, 2654435761);
  const positive = mixed >>> 0;
  const share = positive % 100;
  if (share < DOT_SHARE) {
    return 0;
  }
  if (share < DOT_OR_PLUS_SHARE) {
    return 1;
  }
  return 2;
}

/** Each glyph is drawn as text once, in the colour and the mono face of the canvas, then stamped. */
function spriteOf(
  glyph: string,
  ink: string,
  face: string,
  pixelRatio: number
) {
  const sprite = document.createElement('canvas');
  const side = Math.round(SPRITE_PX * pixelRatio);
  sprite.width = side;
  sprite.height = side;
  const pen = sprite.getContext('2d');
  if (!pen) {
    return sprite;
  }
  const fontSize = GLYPH_PX * pixelRatio;
  const middle = side / 2;
  pen.font = `${fontSize}px ${face}`;
  pen.textAlign = 'center';
  pen.textBaseline = 'middle';
  pen.fillStyle = ink;
  pen.fillText(glyph, middle, middle);
  return sprite;
}

export function inkGlyphs(surface: Surface) {
  const style = getComputedStyle(surface.canvas);
  surface.sprites = GLYPHS.map((glyph) =>
    spriteOf(glyph, style.color, style.fontFamily, surface.pixelRatio)
  );
}

export function measure(surface: Surface) {
  const box = surface.canvas.getBoundingClientRect();
  const devicePixelRatio = window.devicePixelRatio || 1;
  const pixelRatio = Math.min(devicePixelRatio, MAX_PIXEL_RATIO);
  const deviceWidth = box.width * pixelRatio;
  const deviceHeight = box.height * pixelRatio;
  surface.width = box.width;
  surface.height = box.height;
  surface.pixelRatio = pixelRatio;
  surface.canvas.width = Math.round(deviceWidth);
  surface.canvas.height = Math.round(deviceHeight);
  surface.pen.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  surface.inked = [];
  inkGlyphs(surface);
}

function cellAt(position: number) {
  return Math.floor(position / CELL_PX);
}

function cellsAround(centre: number, reach: number, extent: number): Cells {
  const lowest = cellAt(centre - reach);
  const highest = cellAt(centre + reach);
  const lastCell = cellAt(extent);
  const first = Math.max(0, lowest);
  const last = Math.min(lastCell, highest);
  return { first, last };
}

function centreOf(cell: number) {
  const start = cell * CELL_PX;
  return start + HALF_CELL_PX;
}

function stamp(
  surface: Surface,
  column: number,
  row: number,
  x: number,
  y: number,
  ink: number
) {
  const glyphIndex = glyphIndexOf(column, row);
  const sprite = surface.sprites[glyphIndex];
  if (!sprite) {
    return;
  }
  surface.pen.globalAlpha = ink;
  surface.pen.drawImage(
    sprite,
    x - HALF_SPRITE_PX,
    y - HALF_SPRITE_PX,
    SPRITE_PX,
    SPRITE_PX
  );
}

/** The square a lens or a ring was drawn into, with room for the glyphs that straddle its edge. */
function patchAround(x: number, y: number, reach: number): Patch {
  const margin = reach + SPRITE_PX;
  const left = x - margin;
  const top = y - margin;
  const side = margin * 2;
  return { x: left, y: top, side };
}

/** Only what the last frame inked is wiped, never the whole canvas: a still lens leaves most of it untouched. */
function wipe(surface: Surface) {
  surface.pen.globalAlpha = 1;
  for (const patch of surface.inked) {
    surface.pen.clearRect(patch.x, patch.y, patch.side, patch.side);
  }
  surface.inked = [];
}

/** Only the cells under the lens are drawn: the rest of the field costs nothing. */
function paintLens(surface: Surface, lens: Lens) {
  if (lens.alpha <= REST_ALPHA) {
    return;
  }
  const patch = patchAround(lens.x, lens.y, LENS_RADIUS_PX);
  surface.inked.push(patch);
  const columns = cellsAround(lens.x, LENS_RADIUS_PX, surface.width);
  const rows = cellsAround(lens.y, LENS_RADIUS_PX, surface.height);
  for (let row = rows.first; row <= rows.last; row += 1) {
    for (let column = columns.first; column <= columns.last; column += 1) {
      const x = centreOf(column);
      const y = centreOf(row);
      const offsetX = x - lens.x;
      const offsetY = y - lens.y;
      const distance = Math.hypot(offsetX, offsetY);
      if (distance >= LENS_RADIUS_PX) {
        continue;
      }
      const farness = distance / LENS_RADIUS_PX;
      const closeness = 1 - farness;
      const softness = closeness * closeness;
      const shown = softness * lens.alpha;
      const ink = shown * LENS_INK;
      stamp(surface, column, row, x, y, ink);
    }
  }
}

/** A ring that widens and fades: the glyphs on its crest show and are pushed outwards a little. */
function paintRipple(surface: Surface, ripple: Ripple, now: number) {
  const age = now - ripple.startedAt;
  const spent = age / RIPPLE_MS;
  const life = 1 - spent;
  const seconds = age / 1000;
  const radius = seconds * RIPPLE_SPEED_PX;
  const reach = radius + RIPPLE_HALF_BAND_PX;
  const inkedReach = reach + RIPPLE_PUSH_PX;
  const patch = patchAround(ripple.x, ripple.y, inkedReach);
  surface.inked.push(patch);
  const columns = cellsAround(ripple.x, reach, surface.width);
  const rows = cellsAround(ripple.y, reach, surface.height);
  for (let row = rows.first; row <= rows.last; row += 1) {
    for (let column = columns.first; column <= columns.last; column += 1) {
      const x = centreOf(column);
      const y = centreOf(row);
      const offsetX = x - ripple.x;
      const offsetY = y - ripple.y;
      const distance = Math.hypot(offsetX, offsetY);
      const gap = Math.abs(distance - radius);
      if (gap >= RIPPLE_HALF_BAND_PX) {
        continue;
      }
      const offCrest = gap / RIPPLE_HALF_BAND_PX;
      const crest = 1 - offCrest;
      const strength = crest * life;
      const pushPx = strength * RIPPLE_PUSH_PX;
      const pushShare = pushPx / Math.max(distance, 1);
      const pushX = offsetX * pushShare;
      const pushY = offsetY * pushShare;
      const pushedX = x + pushX;
      const pushedY = y + pushY;
      const ink = strength * RIPPLE_INK;
      stamp(surface, column, row, pushedX, pushedY, ink);
    }
  }
}

export function paint(
  surface: Surface,
  lens: Lens,
  ripples: Ripple[],
  now: number
) {
  wipe(surface);
  paintLens(surface, lens);
  for (const ripple of ripples) {
    paintRipple(surface, ripple, now);
  }
}
