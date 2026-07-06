export type ThemeMode = 'light' | 'dark';

/** Token names are written without the leading dashes, as in a registry item. */
export type ThemeTokens = Record<string, string>;

export type Hsl = {
  hue: number;
  saturation: number;
  lightness: number;
};

type Rgb = {
  red: number;
  green: number;
  blue: number;
};

export const AA_TEXT = 4.5;

export const AA_NON_TEXT = 3;

const HSL_PATTERN =
  /^hsl\(\s*(-?\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%\s*\)$/;

const DEGREES_IN_TURN = 360;

const CHANNEL_MAX = 255;

/** A colour rounded the way `hsl()` writes it, so what is measured is what is shipped. */
export function colorOf(
  hue: number,
  saturation: number,
  lightness: number
): Hsl {
  return {
    hue: turnOf(hue),
    saturation: percentOf(saturation),
    lightness: percentOf(lightness),
  };
}

export function textOf(color: Hsl) {
  return hsl(color.hue, color.saturation, color.lightness);
}

export function parseHsl(text: string): Hsl | null {
  const match = HSL_PATTERN.exec(text.trim());
  if (!match) {
    return null;
  }
  const hue = Number(match[1]);
  const saturation = Number(match[2]);
  const lightness = Number(match[3]);
  return { hue, saturation, lightness };
}

function turnOf(hue: number) {
  const rounded = Math.round(hue);
  return ((rounded % DEGREES_IN_TURN) + DEGREES_IN_TURN) % DEGREES_IN_TURN;
}

function percentOf(value: number) {
  const rounded = Math.round(value);
  return Math.min(100, Math.max(0, rounded));
}

/** The value of a token as the ndekoui stylesheet writes it: whole numbers, space separated. */
export function hsl(hue: number, saturation: number, lightness: number) {
  const turn = turnOf(hue);
  const saturationText = percentOf(saturation);
  const lightnessText = percentOf(lightness);
  return `hsl(${turn} ${saturationText}% ${lightnessText}%)`;
}

function channelOf(
  offset: number,
  hue: number,
  saturation: number,
  lightness: number
) {
  const position = (offset + hue / 30) % 12;
  const spread = saturation * Math.min(lightness, 1 - lightness);
  const edge = Math.min(position - 3, 9 - position, 1);
  return lightness - spread * Math.max(-1, edge);
}

function byteOf(channel: number) {
  return Math.round(channel * CHANNEL_MAX);
}

/** The 8-bit colour a browser paints, which is what a contrast checker measures. */
function rgbOf(color: Hsl): Rgb {
  const hue = turnOf(color.hue);
  const saturation = color.saturation / 100;
  const lightness = color.lightness / 100;
  const red = channelOf(0, hue, saturation, lightness);
  const green = channelOf(8, hue, saturation, lightness);
  const blue = channelOf(4, hue, saturation, lightness);
  return { red: byteOf(red), green: byteOf(green), blue: byteOf(blue) };
}

function linearOf(byte: number) {
  const channel = byte / CHANNEL_MAX;
  const isDark = channel <= 0.04045;
  if (isDark) {
    return channel / 12.92;
  }
  return ((channel + 0.055) / 1.055) ** 2.4;
}

export function luminanceOf(color: Hsl) {
  const { red, green, blue } = rgbOf(color);
  const redPart = 0.2126 * linearOf(red);
  const greenPart = 0.7152 * linearOf(green);
  const bluePart = 0.0722 * linearOf(blue);
  return redPart + greenPart + bluePart;
}

export function contrastOf(first: Hsl, second: Hsl) {
  const firstLuminance = luminanceOf(first);
  const secondLuminance = luminanceOf(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

export function hslOfToken(tokens: ThemeTokens, name: string): Hsl {
  const text = tokens[name];
  if (text === undefined) {
    throw new Error(`The token ${name} is missing`);
  }
  const color = parseHsl(text);
  if (color === null) {
    throw new Error(`The token ${name} is not an hsl() value: ${text}`);
  }
  return color;
}

export type ContrastPair = {
  id: string;
  label: string;
  foreground: string;
  background: string;
  required: number;
};

export const CONTRAST_PAIRS: readonly ContrastPair[] = [
  {
    id: 'ink-page',
    label: 'Brand text on the page',
    foreground: 'primary-ink',
    background: 'background',
    required: AA_TEXT,
  },
  {
    id: 'ink-card',
    label: 'Brand text on a card',
    foreground: 'primary-ink',
    background: 'card',
    required: AA_TEXT,
  },
  {
    id: 'fill-text',
    label: 'Text on the primary fill',
    foreground: 'primary-foreground',
    background: 'primary',
    required: AA_TEXT,
  },
  {
    id: 'thumb-fill',
    label: 'White switch thumb on the fill',
    foreground: 'white',
    background: 'primary',
    required: AA_NON_TEXT,
  },
  {
    id: 'ring-page',
    label: 'Focus ring on the page',
    foreground: 'ring',
    background: 'background',
    required: AA_NON_TEXT,
  },
  {
    id: 'text-page',
    label: 'Text on the page',
    foreground: 'foreground',
    background: 'background',
    required: AA_TEXT,
  },
  {
    id: 'muted-page',
    label: 'Muted text on the page',
    foreground: 'muted-foreground',
    background: 'background',
    required: AA_TEXT,
  },
  {
    id: 'muted-card',
    label: 'Muted text on a card',
    foreground: 'muted-foreground',
    background: 'card',
    required: AA_TEXT,
  },
  {
    id: 'muted-tile',
    label: 'Muted text on a muted tile',
    foreground: 'muted-foreground',
    background: 'muted',
    required: AA_TEXT,
  },
  {
    id: 'success-page',
    label: 'Success text on the page',
    foreground: 'success-foreground',
    background: 'background',
    required: AA_TEXT,
  },
  {
    id: 'warning-page',
    label: 'Warning text on the page',
    foreground: 'warning-foreground',
    background: 'background',
    required: AA_TEXT,
  },
  {
    id: 'info-page',
    label: 'Info text on the page',
    foreground: 'info-foreground',
    background: 'background',
    required: AA_TEXT,
  },
  {
    id: 'destructive-page',
    label: 'Destructive text on the page',
    foreground: 'destructive-ink',
    background: 'background',
    required: AA_TEXT,
  },
];

export type ContrastCheck = {
  id: string;
  label: string;
  mode: ThemeMode;
  ratio: number;
  required: number;
  passes: boolean;
};

export function checkOf(
  pair: ContrastPair,
  tokens: ThemeTokens,
  mode: ThemeMode
): ContrastCheck {
  const foreground = hslOfToken(tokens, pair.foreground);
  const background = hslOfToken(tokens, pair.background);
  const ratio = contrastOf(foreground, background);
  const passes = ratio >= pair.required;
  return {
    id: pair.id,
    label: pair.label,
    mode,
    ratio,
    required: pair.required,
    passes,
  };
}

export function checksOf(
  tokens: ThemeTokens,
  mode: ThemeMode,
  pairs: readonly ContrastPair[] = CONTRAST_PAIRS
) {
  return pairs.map((pair) => checkOf(pair, tokens, mode));
}

/** Cut, never rounded up: a ratio of 4.496 must not read as 4.50. */
export function ratioText(ratio: number) {
  const cut = Math.floor(ratio * 100) / 100;
  return `${cut.toFixed(2)}:1`;
}
