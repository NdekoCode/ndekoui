import { hsl, type ThemeMode, type ThemeTokens } from './theme-colours';

export type NeutralFamilyId = 'zinc' | 'slate' | 'stone' | 'graphite' | 'sand';

export type NeutralFamily = {
  id: NeutralFamilyId;
  label: string;
  hue: number;
  /** How much of the hue the light neutrals carry, against the zinc of the default theme. */
  lightTint: number;
  darkTint: number;
  /** The light card and popover are pure white unless the family warms them. */
  lightCard: { saturation: number; lightness: number };
  /** Points added to the lightness of a light token, so a warm card still lifts from its page and warm greys stay readable. */
  lightShifts: Readonly<Record<string, number>>;
};

export const NEUTRAL_FAMILIES: Record<NeutralFamilyId, NeutralFamily> = {
  zinc: {
    id: 'zinc',
    label: 'Zinc',
    hue: 240,
    lightTint: 1,
    darkTint: 1,
    lightCard: { saturation: 0, lightness: 100 },
    lightShifts: {},
  },
  slate: {
    id: 'slate',
    label: 'Slate',
    hue: 215,
    lightTint: 2.4,
    darkTint: 2.2,
    lightCard: { saturation: 0, lightness: 100 },
    lightShifts: {},
  },
  stone: {
    id: 'stone',
    label: 'Stone',
    hue: 40,
    lightTint: 2,
    darkTint: 1.6,
    lightCard: { saturation: 0, lightness: 100 },
    lightShifts: {},
  },
  graphite: {
    id: 'graphite',
    label: 'Graphite',
    hue: 0,
    lightTint: 0,
    darkTint: 0,
    lightCard: { saturation: 0, lightness: 100 },
    lightShifts: {},
  },
  sand: {
    id: 'sand',
    label: 'Sand',
    hue: 38,
    lightTint: 3.2,
    darkTint: 2.2,
    lightCard: { saturation: 40, lightness: 99 },
    lightShifts: {
      background: -2,
      secondary: -2,
      muted: -2,
      accent: -2,
      'muted-foreground': -4,
    },
  },
};

export type GeneratorFamilyId = Extract<
  NeutralFamilyId,
  'zinc' | 'slate' | 'stone'
>;

export const GENERATOR_FAMILIES: readonly GeneratorFamilyId[] = [
  'zinc',
  'slate',
  'stone',
];

type NeutralRow = {
  token: string;
  saturation: number;
  lightness: number;
};

const LIGHT_ROWS: readonly NeutralRow[] = [
  { token: 'background', saturation: 11, lightness: 98 },
  { token: 'foreground', saturation: 6, lightness: 10 },
  { token: 'card-foreground', saturation: 6, lightness: 10 },
  { token: 'popover-foreground', saturation: 6, lightness: 10 },
  { token: 'secondary', saturation: 5, lightness: 95 },
  { token: 'secondary-foreground', saturation: 6, lightness: 10 },
  { token: 'muted', saturation: 5, lightness: 95 },
  { token: 'muted-foreground', saturation: 4, lightness: 42 },
  { token: 'accent', saturation: 5, lightness: 95 },
  { token: 'accent-foreground', saturation: 6, lightness: 10 },
  { token: 'border', saturation: 3, lightness: 89 },
  { token: 'input', saturation: 3, lightness: 89 },
  { token: 'sidebar', saturation: 3, lightness: 94 },
  { token: 'sidebar-foreground', saturation: 6, lightness: 10 },
  { token: 'sidebar-accent', saturation: 3, lightness: 88 },
  { token: 'sidebar-accent-foreground', saturation: 6, lightness: 10 },
  { token: 'sidebar-border', saturation: 3, lightness: 89 },
];

const DARK_ROWS: readonly NeutralRow[] = [
  { token: 'background', saturation: 5, lightness: 7 },
  { token: 'foreground', saturation: 5, lightness: 90 },
  { token: 'card', saturation: 5, lightness: 10 },
  { token: 'card-foreground', saturation: 5, lightness: 90 },
  { token: 'popover', saturation: 5, lightness: 11 },
  { token: 'popover-foreground', saturation: 5, lightness: 90 },
  { token: 'secondary', saturation: 4, lightness: 13 },
  { token: 'secondary-foreground', saturation: 5, lightness: 90 },
  { token: 'muted', saturation: 4, lightness: 13 },
  { token: 'muted-foreground', saturation: 5, lightness: 62 },
  { token: 'accent', saturation: 4, lightness: 13 },
  { token: 'border', saturation: 4, lightness: 16 },
  { token: 'input', saturation: 4, lightness: 18 },
  { token: 'sidebar', saturation: 6, lightness: 4 },
  { token: 'sidebar-foreground', saturation: 5, lightness: 90 },
  { token: 'sidebar-accent', saturation: 4, lightness: 14 },
  { token: 'sidebar-border', saturation: 4, lightness: 16 },
];

const WHITE = hsl(0, 0, 100);

function tintOf(family: NeutralFamily, mode: ThemeMode) {
  if (mode === 'dark') {
    return family.darkTint;
  }
  return family.lightTint;
}

function rowsOf(mode: ThemeMode) {
  if (mode === 'dark') {
    return DARK_ROWS;
  }
  return LIGHT_ROWS;
}

function cardHueOf(family: NeutralFamily) {
  const isWhite = family.lightCard.saturation === 0;
  if (isWhite) {
    return 0;
  }
  return family.hue;
}

function lightSurfaceTokensOf(family: NeutralFamily): ThemeTokens {
  const { saturation, lightness } = family.lightCard;
  const card = hsl(cardHueOf(family), saturation, lightness);
  return { card, popover: card };
}

function lightnessOf(row: NeutralRow, family: NeutralFamily, mode: ThemeMode) {
  if (mode === 'dark') {
    return row.lightness;
  }
  const shift = family.lightShifts[row.token] ?? 0;
  return row.lightness + shift;
}

function darkWhiteTokens(): ThemeTokens {
  return {
    'accent-foreground': WHITE,
    'sidebar-accent-foreground': WHITE,
  };
}

/** Every neutral surface and text colour of a theme. The zinc family is the default of ndekoui, value for value. */
export function neutralTokensOf(
  familyId: NeutralFamilyId,
  mode: ThemeMode
): ThemeTokens {
  const family = NEUTRAL_FAMILIES[familyId];
  const tint = tintOf(family, mode);
  const tokens: ThemeTokens = {};
  for (const row of rowsOf(mode)) {
    const saturation = row.saturation * tint;
    const lightness = lightnessOf(row, family, mode);
    tokens[row.token] = hsl(family.hue, saturation, lightness);
  }
  if (mode === 'light') {
    return { ...tokens, ...lightSurfaceTokensOf(family) };
  }
  return { ...tokens, ...darkWhiteTokens() };
}

/** Status text colours, copied from the default theme. They never change with a theme; they are only measured on its surfaces. */
const STATUS_TEXT: Record<ThemeMode, ThemeTokens> = {
  light: {
    'success-foreground': hsl(163, 100, 24),
    'warning-foreground': hsl(26, 100, 36),
    'info-foreground': hsl(201, 96, 32),
    'destructive-ink': hsl(0, 74, 42),
  },
  dark: {
    'success-foreground': hsl(158, 76, 64),
    'warning-foreground': hsl(47, 100, 61),
    'info-foreground': hsl(199, 95, 74),
    'destructive-ink': hsl(0, 91, 71),
  },
};

/** The switch thumb and the radio dot of the primitives are white whatever the theme, so the fill has to hold them. */
const FIXED_TOKENS: ThemeTokens = { white: WHITE };

/** What a theme that changes only its identity colours measures against: the default neutrals and the status colours. */
export function baseTokensOf(mode: ThemeMode): ThemeTokens {
  return {
    ...neutralTokensOf('zinc', mode),
    ...STATUS_TEXT[mode],
    ...FIXED_TOKENS,
  };
}

export function resolvedTokensOf(
  tokens: ThemeTokens,
  mode: ThemeMode
): ThemeTokens {
  return { ...baseTokensOf(mode), ...tokens };
}
