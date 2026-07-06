import {
  AA_NON_TEXT,
  AA_TEXT,
  checksOf,
  colorOf,
  contrastOf,
  hsl,
  hslOfToken,
  textOf,
  type ContrastCheck,
  type Hsl,
  type ThemeTokens,
} from './theme-colours';
import {
  neutralTokensOf,
  NEUTRAL_FAMILIES,
  resolvedTokensOf,
  type GeneratorFamilyId,
} from './theme-neutrals';

export type Radius = '0rem' | '0.375rem' | '0.625rem' | '1rem';

export const RADII: readonly Radius[] = [
  '0rem',
  '0.375rem',
  '0.625rem',
  '1rem',
];

export type GeneratorChoice = {
  hue: number;
  neutral: GeneratorFamilyId;
  radius: Radius;
};

export const DEFAULT_CHOICE: GeneratorChoice = {
  hue: 262,
  neutral: 'zinc',
  radius: '0.625rem',
};

export type GeneratedTheme = {
  choice: GeneratorChoice;
  light: ThemeTokens;
  dark: ThemeTokens;
  /** One plain line for each lightness the generator had to move to keep a pair readable. */
  notes: string[];
  checks: ContrastCheck[];
  passes: boolean;
};

/** A little over the line, so a browser that rounds a channel the other way still passes. */
const MARGIN = 0.05;
const TEXT_TARGET = AA_TEXT + MARGIN;
const NON_TEXT_TARGET = AA_NON_TEXT + MARGIN;

/** The switch thumb is white on the fill in every theme, and has to stay visible on it. */
const THUMB_TARGET = 3.2;

const FILL_SATURATION = 82;
const FILL_FIRST_LIGHTNESS = 54;
/** Below this lightness a fill under white text reads as mud, so the fill keeps its light and takes dark text. */
const WHITE_TEXT_MIN_LIGHTNESS = 40;
const DARK_TEXT_SATURATION = 40;
const DARK_TEXT_LIGHTNESS = 9;
const INK_LIGHT_SATURATION = 80;
const INK_LIGHT_FIRST_LIGHTNESS = 48;
const INK_DARK_SATURATION = 90;
const INK_DARK_FIRST_LIGHTNESS = 70;
const RING_DARK_SATURATION = 6;
const RING_DARK_FIRST_LIGHTNESS = 42;
const LIGHTNESS_FLOOR = 8;
const LIGHTNESS_CEILING = 94;
const DARK_CHART_FLOOR = 60;
const CHART_STEPS = [0, 0.2, 0.42, 0.65];
const CHART_CEILING = 95;
const CHART_NEUTRAL_SATURATION = 5;
const CHART_NEUTRAL_LIGHTNESS = 65;
const SIDEBAR_FOREGROUND = hsl(0, 0, 98);

const WHITE = colorOf(0, 0, 100);

type Fill = {
  color: Hsl;
  foreground: Hsl;
  notes: string[];
};

function whiteTextLightness(hue: number) {
  let lightness = FILL_FIRST_LIGHTNESS;
  while (lightness > LIGHTNESS_FLOOR) {
    const fill = colorOf(hue, FILL_SATURATION, lightness);
    const ratio = contrastOf(WHITE, fill);
    if (ratio >= TEXT_TARGET) {
      return lightness;
    }
    lightness -= 1;
  }
  return LIGHTNESS_FLOOR;
}

function thumbLightness(hue: number) {
  let lightness = FILL_FIRST_LIGHTNESS;
  while (lightness > LIGHTNESS_FLOOR) {
    const fill = colorOf(hue, FILL_SATURATION, lightness);
    const ratio = contrastOf(WHITE, fill);
    if (ratio >= THUMB_TARGET) {
      return lightness;
    }
    lightness -= 1;
  }
  return LIGHTNESS_FLOOR;
}

function fillOf(hue: number): Fill {
  const lightnessUnderWhite = whiteTextLightness(hue);
  const canUseWhite = lightnessUnderWhite >= WHITE_TEXT_MIN_LIGHTNESS;
  if (!canUseWhite) {
    const lightness = thumbLightness(hue);
    const color = colorOf(hue, FILL_SATURATION, lightness);
    const foreground = colorOf(hue, DARK_TEXT_SATURATION, DARK_TEXT_LIGHTNESS);
    const notes = [
      'White text cannot reach 4.5:1 on this hue, so the fill carries dark text.',
    ];
    return { color, foreground, notes };
  }
  const color = colorOf(hue, FILL_SATURATION, lightnessUnderWhite);
  const wasDarkened = lightnessUnderWhite < FILL_FIRST_LIGHTNESS;
  const notes: string[] = [];
  if (wasDarkened) {
    notes.push('Fill darkened to keep 4.5:1 under white text.');
  }
  return { color, foreground: WHITE, notes };
}

function passesOn(ink: Hsl, surfaces: readonly Hsl[], required: number) {
  return surfaces.every((surface) => contrastOf(ink, surface) >= required);
}

function darkenedInk(hue: number, surfaces: readonly Hsl[]) {
  let lightness = INK_LIGHT_FIRST_LIGHTNESS;
  while (lightness > LIGHTNESS_FLOOR) {
    const ink = colorOf(hue, INK_LIGHT_SATURATION, lightness);
    if (passesOn(ink, surfaces, TEXT_TARGET)) {
      return ink;
    }
    lightness -= 1;
  }
  return colorOf(hue, INK_LIGHT_SATURATION, LIGHTNESS_FLOOR);
}

function lightenedInk(hue: number, surfaces: readonly Hsl[]) {
  let lightness = INK_DARK_FIRST_LIGHTNESS;
  while (lightness < LIGHTNESS_CEILING) {
    const ink = colorOf(hue, INK_DARK_SATURATION, lightness);
    if (passesOn(ink, surfaces, TEXT_TARGET)) {
      return ink;
    }
    lightness += 1;
  }
  return colorOf(hue, INK_DARK_SATURATION, LIGHTNESS_CEILING);
}

function ringOnLight(fill: Hsl, ink: Hsl, fillIsTooFaint: boolean) {
  if (fillIsTooFaint) {
    return ink;
  }
  return fill;
}

function ringOnDark(hue: number, page: Hsl) {
  let lightness = RING_DARK_FIRST_LIGHTNESS;
  while (lightness < LIGHTNESS_CEILING) {
    const ring = colorOf(hue, RING_DARK_SATURATION, lightness);
    if (contrastOf(ring, page) >= NON_TEXT_TARGET) {
      return ring;
    }
    lightness += 1;
  }
  return colorOf(hue, RING_DARK_SATURATION, LIGHTNESS_CEILING);
}

export function chartTokensOf(base: Hsl, neutralHue: number): ThemeTokens {
  const gap = CHART_CEILING - base.lightness;
  const tokens: ThemeTokens = {};
  CHART_STEPS.forEach((step, index) => {
    const lightness = base.lightness + gap * step;
    tokens[`chart-${index + 1}`] = hsl(base.hue, base.saturation, lightness);
  });
  tokens['chart-5'] = hsl(
    neutralHue,
    CHART_NEUTRAL_SATURATION,
    CHART_NEUTRAL_LIGHTNESS
  );
  return tokens;
}

function darkChartBaseOf(fill: Hsl) {
  const lightness = Math.max(fill.lightness, DARK_CHART_FLOOR);
  return colorOf(fill.hue, fill.saturation, lightness);
}

function surfaceOf(tokens: ThemeTokens, name: string) {
  return hslOfToken(tokens, name);
}

function lightIdentityOf(
  fill: Fill,
  ink: Hsl,
  ring: Hsl,
  neutrals: ThemeTokens,
  neutralHue: number
): ThemeTokens {
  return {
    primary: textOf(fill.color),
    'primary-foreground': textOf(fill.foreground),
    'primary-ink': textOf(ink),
    ring: textOf(ring),
    'sidebar-primary': neutrals.foreground,
    'sidebar-primary-foreground': SIDEBAR_FOREGROUND,
    'sidebar-ring': textOf(ring),
    ...chartTokensOf(fill.color, neutralHue),
  };
}

function darkIdentityOf(
  fill: Fill,
  ink: Hsl,
  ring: Hsl,
  neutralHue: number
): ThemeTokens {
  const chartBase = darkChartBaseOf(fill.color);
  return {
    primary: textOf(fill.color),
    'primary-foreground': textOf(fill.foreground),
    'primary-ink': textOf(ink),
    ring: textOf(ring),
    'sidebar-primary': textOf(fill.color),
    'sidebar-primary-foreground': textOf(fill.foreground),
    'sidebar-ring': textOf(ring),
    ...chartTokensOf(chartBase, neutralHue),
  };
}

function normalisedHue(hue: number) {
  const rounded = Math.round(hue);
  return ((rounded % 360) + 360) % 360;
}

function inkNotesOf(lightInk: Hsl, darkInk: Hsl, lightRingIsInk: boolean) {
  const notes: string[] = [];
  const darkened = lightInk.lightness < INK_LIGHT_FIRST_LIGHTNESS;
  const lightened = darkInk.lightness > INK_DARK_FIRST_LIGHTNESS;
  if (darkened) {
    notes.push('Ink darkened to keep 4.5:1 on white.');
  }
  if (lightened) {
    notes.push('Ink lightened to keep 4.5:1 on the dark page.');
  }
  if (lightRingIsInk) {
    notes.push('Focus ring follows the ink to keep 3:1 on the page.');
  }
  return notes;
}

/**
 * Turns a hue, a neutral family and a radius into the identity tokens of a theme for light and dark, moving a
 * lightness only as far as a pair needs to pass WCAG AA.
 */
export function generateTheme(choice: GeneratorChoice): GeneratedTheme {
  const hue = normalisedHue(choice.hue);
  const family = NEUTRAL_FAMILIES[choice.neutral];
  const lightNeutrals = neutralTokensOf(choice.neutral, 'light');
  const darkNeutrals = neutralTokensOf(choice.neutral, 'dark');
  const lightSurfaces = [
    surfaceOf(lightNeutrals, 'background'),
    surfaceOf(lightNeutrals, 'card'),
  ];
  const darkSurfaces = [
    surfaceOf(darkNeutrals, 'background'),
    surfaceOf(darkNeutrals, 'card'),
    surfaceOf(darkNeutrals, 'popover'),
  ];
  const fill = fillOf(hue);
  const lightInk = darkenedInk(hue, lightSurfaces);
  const darkInk = lightenedInk(hue, darkSurfaces);
  const fillOnPage = contrastOf(fill.color, lightSurfaces[0]);
  const lightRingIsInk = fillOnPage < NON_TEXT_TARGET;
  const lightRing = ringOnLight(fill.color, lightInk, lightRingIsInk);
  const darkRing = ringOnDark(family.hue, darkSurfaces[0]);
  const light: ThemeTokens = {
    ...lightNeutrals,
    ...lightIdentityOf(fill, lightInk, lightRing, lightNeutrals, family.hue),
  };
  const dark: ThemeTokens = {
    ...darkNeutrals,
    ...darkIdentityOf(fill, darkInk, darkRing, family.hue),
  };
  const notes = [
    ...fill.notes,
    ...inkNotesOf(lightInk, darkInk, lightRingIsInk),
  ];
  const checks = [
    ...checksOf(resolvedTokensOf(light, 'light'), 'light'),
    ...checksOf(resolvedTokensOf(dark, 'dark'), 'dark'),
  ];
  const passes = checks.every((check) => check.passes);
  const radius = choice.radius;
  return {
    choice: { hue, neutral: choice.neutral, radius },
    light,
    dark,
    notes,
    checks,
    passes,
  };
}
