import {
  checksOf,
  colorOf,
  hsl,
  type ContrastCheck,
  type ThemeTokens,
} from './theme-colours';
import { chartTokensOf } from './theme-generator';
import { neutralTokensOf, resolvedTokensOf } from './theme-neutrals';

export type ThemeName =
  | 'indigo'
  | 'ocean'
  | 'lagoon'
  | 'forest'
  | 'ember'
  | 'rose'
  | 'plum'
  | 'graphite'
  | 'sand';

export type ThemeDefinition = {
  name: ThemeName;
  title: string;
  description: string;
  light: ThemeTokens;
  dark: ThemeTokens;
};

type Shade = {
  saturation: number;
  lightness: number;
};

type AccentSpec = {
  name: ThemeName;
  title: string;
  description: string;
  hue: number;
  fill: Shade;
  inkLight: Shade;
  inkDark: Shade;
};

const ZINC_HUE = 240;

const WHITE = hsl(0, 0, 100);

const SIDEBAR_FOREGROUND = hsl(0, 0, 98);

const RING_DARK_SATURATION = 6;

const RING_DARK_LIGHTNESS = 42;

const DARK_CHART_FLOOR = 60;

type IdentityParts = {
  fill: string;
  foreground: string;
  ink: string;
  ring: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  charts: ThemeTokens;
};

function identityTokensOf(parts: IdentityParts): ThemeTokens {
  return {
    primary: parts.fill,
    'primary-foreground': parts.foreground,
    'primary-ink': parts.ink,
    ring: parts.ring,
    'sidebar-primary': parts.sidebarPrimary,
    'sidebar-primary-foreground': parts.sidebarPrimaryForeground,
    'sidebar-ring': parts.ring,
    ...parts.charts,
  };
}

function lightAccentOf(spec: AccentSpec): ThemeTokens {
  const fill = hsl(spec.hue, spec.fill.saturation, spec.fill.lightness);
  const ink = hsl(spec.hue, spec.inkLight.saturation, spec.inkLight.lightness);
  const neutrals = neutralTokensOf('zinc', 'light');
  const base = colorOf(spec.hue, spec.fill.saturation, spec.fill.lightness);
  return identityTokensOf({
    fill,
    foreground: WHITE,
    ink,
    ring: fill,
    sidebarPrimary: neutrals.foreground,
    sidebarPrimaryForeground: SIDEBAR_FOREGROUND,
    charts: chartTokensOf(base, ZINC_HUE),
  });
}

function darkAccentOf(spec: AccentSpec): ThemeTokens {
  const fill = hsl(spec.hue, spec.fill.saturation, spec.fill.lightness);
  const ink = hsl(spec.hue, spec.inkDark.saturation, spec.inkDark.lightness);
  const ring = hsl(spec.hue, RING_DARK_SATURATION, RING_DARK_LIGHTNESS);
  const chartLightness = Math.max(spec.fill.lightness, DARK_CHART_FLOOR);
  const chartBase = colorOf(spec.hue, spec.fill.saturation, chartLightness);
  return identityTokensOf({
    fill,
    foreground: WHITE,
    ink,
    ring,
    sidebarPrimary: fill,
    sidebarPrimaryForeground: WHITE,
    charts: chartTokensOf(chartBase, ZINC_HUE),
  });
}

function accentThemeOf(spec: AccentSpec): ThemeDefinition {
  return {
    name: spec.name,
    title: spec.title,
    description: spec.description,
    light: lightAccentOf(spec),
    dark: darkAccentOf(spec),
  };
}

const INDIGO: ThemeDefinition = {
  name: 'indigo',
  title: 'Indigo',
  description: 'The default theme: indigo on cool grey surfaces.',
  light: identityTokensOf({
    fill: hsl(239, 84, 67),
    foreground: WHITE,
    ink: hsl(243, 75, 59),
    ring: hsl(239, 84, 67),
    sidebarPrimary: hsl(240, 6, 10),
    sidebarPrimaryForeground: SIDEBAR_FOREGROUND,
    charts: {
      'chart-1': hsl(239, 84, 67),
      'chart-2': hsl(234, 89, 74),
      'chart-3': hsl(230, 94, 82),
      'chart-4': hsl(228, 96, 89),
      'chart-5': hsl(240, 5, 65),
    },
  }),
  dark: identityTokensOf({
    fill: hsl(239, 84, 67),
    foreground: WHITE,
    ink: hsl(234, 89, 74),
    ring: hsl(0, 0, 40),
    sidebarPrimary: hsl(239, 84, 67),
    sidebarPrimaryForeground: WHITE,
    charts: {
      'chart-1': hsl(239, 84, 67),
      'chart-2': hsl(234, 89, 74),
      'chart-3': hsl(230, 94, 82),
      'chart-4': hsl(228, 96, 89),
      'chart-5': hsl(240, 5, 65),
    },
  }),
};

const OCEAN = accentThemeOf({
  name: 'ocean',
  title: 'Ocean',
  description: 'Azure blue on the default surfaces.',
  hue: 211,
  fill: { saturation: 92, lightness: 45 },
  inkLight: { saturation: 90, lightness: 38 },
  inkDark: { saturation: 95, lightness: 68 },
});

const LAGOON = accentThemeOf({
  name: 'lagoon',
  title: 'Lagoon',
  description: 'Deep teal on the default surfaces.',
  hue: 178,
  fill: { saturation: 84, lightness: 27 },
  inkLight: { saturation: 85, lightness: 23 },
  inkDark: { saturation: 70, lightness: 55 },
});

const FOREST = accentThemeOf({
  name: 'forest',
  title: 'Forest',
  description: 'Deep green on the default surfaces.',
  hue: 146,
  fill: { saturation: 64, lightness: 29 },
  inkLight: { saturation: 70, lightness: 24 },
  inkDark: { saturation: 60, lightness: 56 },
});

const EMBER = accentThemeOf({
  name: 'ember',
  title: 'Ember',
  description: 'Burnt orange on the default surfaces.',
  hue: 16,
  fill: { saturation: 88, lightness: 42 },
  inkLight: { saturation: 88, lightness: 36 },
  inkDark: { saturation: 95, lightness: 62 },
});

const ROSE = accentThemeOf({
  name: 'rose',
  title: 'Rose',
  description: 'Crimson rose on the default surfaces.',
  hue: 343,
  fill: { saturation: 78, lightness: 47 },
  inkLight: { saturation: 80, lightness: 41 },
  inkDark: { saturation: 90, lightness: 68 },
});

const PLUM = accentThemeOf({
  name: 'plum',
  title: 'Plum',
  description: 'Orchid purple on the default surfaces.',
  hue: 295,
  fill: { saturation: 52, lightness: 44 },
  inkLight: { saturation: 55, lightness: 35 },
  inkDark: { saturation: 75, lightness: 70 },
});

const GRAPHITE: ThemeDefinition = {
  name: 'graphite',
  title: 'Graphite',
  description: 'Monochrome: black and white on pure grey surfaces.',
  light: {
    ...neutralTokensOf('graphite', 'light'),
    ...identityTokensOf({
      fill: hsl(0, 0, 11),
      foreground: hsl(0, 0, 98),
      ink: hsl(0, 0, 17),
      ring: hsl(0, 0, 11),
      sidebarPrimary: hsl(0, 0, 10),
      sidebarPrimaryForeground: SIDEBAR_FOREGROUND,
      charts: {
        'chart-1': hsl(0, 0, 14),
        'chart-2': hsl(0, 0, 34),
        'chart-3': hsl(0, 0, 54),
        'chart-4': hsl(0, 0, 72),
        'chart-5': hsl(0, 0, 86),
      },
    }),
  },
  dark: {
    ...neutralTokensOf('graphite', 'dark'),
    ...identityTokensOf({
      fill: hsl(0, 0, 56),
      foreground: hsl(0, 0, 9),
      ink: hsl(0, 0, 84),
      ring: hsl(0, 0, 48),
      sidebarPrimary: hsl(0, 0, 56),
      sidebarPrimaryForeground: hsl(0, 0, 9),
      charts: {
        'chart-1': hsl(0, 0, 92),
        'chart-2': hsl(0, 0, 74),
        'chart-3': hsl(0, 0, 56),
        'chart-4': hsl(0, 0, 40),
        'chart-5': hsl(0, 0, 26),
      },
    }),
  },
};

const SAND_HUE = 27;

const SAND_NEUTRAL_HUE = 38;

const SAND_LIGHT_FILL = colorOf(SAND_HUE, 36, 28);

const SAND_DARK_CHART_BASE = colorOf(34, 46, 60);

const SAND: ThemeDefinition = {
  name: 'sand',
  title: 'Sand',
  description: 'Umber on warm cream surfaces.',
  light: {
    ...neutralTokensOf('sand', 'light'),
    ...identityTokensOf({
      fill: hsl(SAND_HUE, 36, 28),
      foreground: WHITE,
      ink: hsl(SAND_HUE, 44, 24),
      ring: hsl(SAND_HUE, 36, 28),
      sidebarPrimary: neutralTokensOf('sand', 'light').foreground,
      sidebarPrimaryForeground: SIDEBAR_FOREGROUND,
      charts: chartTokensOf(SAND_LIGHT_FILL, SAND_NEUTRAL_HUE),
    }),
  },
  dark: {
    ...neutralTokensOf('sand', 'dark'),
    ...identityTokensOf({
      fill: hsl(34, 46, 50),
      foreground: hsl(30, 24, 9),
      ink: hsl(34, 52, 72),
      ring: hsl(SAND_NEUTRAL_HUE, 8, 44),
      sidebarPrimary: hsl(34, 46, 50),
      sidebarPrimaryForeground: hsl(30, 24, 9),
      charts: chartTokensOf(SAND_DARK_CHART_BASE, SAND_NEUTRAL_HUE),
    }),
  },
};

export const THEMES: readonly ThemeDefinition[] = [
  INDIGO,
  OCEAN,
  LAGOON,
  FOREST,
  EMBER,
  ROSE,
  PLUM,
  GRAPHITE,
  SAND,
];

export const DEFAULT_THEME: ThemeName = 'indigo';

const THEME_ITEM_PREFIX = 'theme-';

export function themeItemNameOf(name: ThemeName) {
  return `${THEME_ITEM_PREFIX}${name}`;
}

export function themeOf(name: ThemeName) {
  const theme = THEMES.find((candidate) => candidate.name === name);
  if (!theme) {
    throw new Error(`There is no theme named ${name}`);
  }
  return theme;
}

export function isThemeName(value: string): value is ThemeName {
  return THEMES.some((theme) => theme.name === value);
}

export function themeChecksOf(theme: ThemeDefinition): ContrastCheck[] {
  const light = resolvedTokensOf(theme.light, 'light');
  const dark = resolvedTokensOf(theme.dark, 'dark');
  return [...checksOf(light, 'light'), ...checksOf(dark, 'dark')];
}
