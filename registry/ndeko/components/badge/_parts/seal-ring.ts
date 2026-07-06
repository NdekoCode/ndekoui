/** The radius of the line the letters are centred on, in em of the seal. */
const MIDDLE_EM = 4.4;

/** How far from the centre of the seal the top of a letter stands, in em of the seal. */
export const TOP_EM = 4.9;

const CIRCUMFERENCE_EM = 2 * Math.PI * MIDDLE_EM;

const SEPARATOR = ' · ';

/** One more repeat of the phrase is fitted only when its letters can stay at this share of their size or more. */
const LEAST_SHRINK = 0.85;

const DEFAULT_ADVANCE_EM = 0.56;

/**
 * How wide a letter is, in em, for a typical sans face. The seal spreads its letters by these
 * widths so that an i and an m do not stand the same distance apart; the real face may differ a
 * little, and the ring still closes since the widths are only shares of the circumference.
 */
const ADVANCE_GROUPS: readonly (readonly [chars: string, advance: number])[] = [
  [' ', 0.28],
  ['ijl', 0.23],
  ["'", 0.2],
  [',.:;!|', 0.27],
  ['·', 0.3],
  ['ft', 0.29],
  ['I-', 0.3],
  ['r', 0.34],
  ['ckvxysJz', 0.5],
  ['L', 0.56],
  ['FTZ', 0.61],
  ['ABEKPSVXY', 0.67],
  ['CDHNRU', 0.72],
  ['w', 0.72],
  ['GOQ', 0.78],
  ['mM', 0.83],
  ['W', 0.94],
];

export type RingLetter = {
  char: string;
  /** Degrees clockwise from the top, where the letter stands. */
  angle: number;
};

export type Ring = {
  letters: RingLetter[];
  /** The size of the letters as a share of the text size of the seal: 1, or less when the phrase is longer than the ring. */
  scale: number;
};

type Slot = {
  char: string;
  /** Where the middle of the letter's slot lies along the ring, in em. */
  centre: number;
};

function advancesOf(groups: typeof ADVANCE_GROUPS) {
  const advances = new Map<string, number>();
  for (const [chars, advance] of groups) {
    for (const char of chars) {
      advances.set(char, advance);
    }
  }
  return advances;
}

const ADVANCES = advancesOf(ADVANCE_GROUPS);

function advanceOf(char: string) {
  return ADVANCES.get(char) ?? DEFAULT_ADVANCE_EM;
}

function widthOf(chars: readonly string[]) {
  let total = 0;
  for (const char of chars) {
    total += advanceOf(char);
  }
  return total;
}

/** How many times the phrase goes round: as many as fit, or one more when the letters need not shrink much to make room. */
function repeatsFor(unitWidth: number) {
  const fits = CIRCUMFERENCE_EM / unitWidth;
  const lower = Math.max(1, Math.floor(fits));
  const upper = lower + 1;
  const upperScale = CIRCUMFERENCE_EM / (upper * unitWidth);
  if (upperScale >= LEAST_SHRINK) {
    return upper;
  }
  return lower;
}

/** Every letter gets a slot as wide as itself plus its share of what the ring has left over, so the slots fill the ring exactly. */
function slotsOf(
  unit: readonly string[],
  repeats: number,
  scale: number,
  spacing: number
) {
  const slots: Slot[] = [];
  let cursor = 0;
  for (let repeat = 0; repeat < repeats; repeat += 1) {
    for (const char of unit) {
      const width = advanceOf(char) * scale + spacing;
      slots.push({ char, centre: cursor + width / 2 });
      cursor += width;
    }
  }
  return slots;
}

function angleOf(position: number, offset: number) {
  const degrees = (position / CIRCUMFERENCE_EM) * 360 - offset;
  return Math.round(degrees * 100) / 100;
}

/**
 * The letters of a phrase laid round a ring, the phrase repeated, a dot between two repeats, the
 * first phrase centred at the top. The same text always gives the same ring.
 */
export function ringOf(text: string): Ring {
  const phrase = Array.from(text.trim());
  if (phrase.length === 0) {
    return { letters: [], scale: 1 };
  }
  const unit = [...phrase, ...Array.from(SEPARATOR)];
  const unitWidth = widthOf(unit);
  const repeats = repeatsFor(unitWidth);
  const natural = repeats * unitWidth;
  const scale = Math.min(1, CIRCUMFERENCE_EM / natural);
  const leftOver = CIRCUMFERENCE_EM - natural * scale;
  const spacing = leftOver / (repeats * unit.length);
  const slots = slotsOf(unit, repeats, scale, spacing);
  const lastIndex = phrase.length - 1;
  const lastOfPhrase = slots[lastIndex];
  const lastWidth = advanceOf(lastOfPhrase.char) * scale + spacing;
  const phraseLength = lastOfPhrase.centre + lastWidth / 2;
  const offset = (phraseLength / 2 / CIRCUMFERENCE_EM) * 360;
  const inked = slots.filter((slot) => slot.char !== ' ');
  const letters = inked.map((slot) => ({
    char: slot.char,
    angle: angleOf(slot.centre, offset),
  }));
  return { letters, scale };
}
