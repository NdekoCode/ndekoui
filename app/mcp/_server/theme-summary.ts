import { urlInstallCommandOf } from '@/lib/site';

import { loadRegistryItem } from './registry-store';

type ThemeToken = { name: string; light: string; dark: string | null };

type ThemeScales = {
  radius: Record<string, string>;
  easing: Record<string, string>;
  animations: Record<string, string>;
  other: Record<string, string>;
};

const THEME_ITEM = 'theme';

const UTILITY_PREFIX = '@utility ';

const KEYFRAMES_PREFIX = '@keyframes ';

/** What each utility of the theme means, from the materials and hairline rules of the design system. */
const UTILITY_MEANINGS: Record<string, string> = {
  'hairline-ring':
    'a one device pixel ring, the outline of cards, fields and menus',
  'hairline-border': 'a one device pixel border on every side',
  'chip-3d': 'an assigned value or a label; set the hue with --chip',
  'keycap-3d': 'a key, or an icon tile in a list row',
  'gem-plate':
    'a kind (issue type, workspace without a logo) holding a white glyph; set the hue with --gem',
  'surface-raised': 'a floating layer: menu, popover, select, dialog',
  'surface-brand':
    'the one lifted object of a block, such as a timer card or a featured plan',
};

const HAIRLINE_SIDE_MEANING =
  'a one device pixel line on one side or between children, for separators';

function emptyScales(): ThemeScales {
  return { radius: {}, easing: {}, animations: {}, other: {} };
}

function scaleOf(name: string, scales: ThemeScales) {
  if (name.startsWith('radius-')) {
    return scales.radius;
  }
  if (name.startsWith('ease-')) {
    return scales.easing;
  }
  if (name.startsWith('animate-')) {
    return scales.animations;
  }
  return scales.other;
}

function splitThemeVariables(themeVariables: Record<string, string>) {
  const colourNames: string[] = [];
  const scales = emptyScales();
  for (const [name, value] of Object.entries(themeVariables)) {
    if (name.startsWith('color-')) {
      const colourName = name.slice('color-'.length);
      colourNames.push(colourName);
      continue;
    }
    const scale = scaleOf(name, scales);
    scale[name] = value;
  }
  return { colourNames, scales };
}

function tokensOf(light: Record<string, string>, dark: Record<string, string>) {
  const tokens: ThemeToken[] = [];
  for (const [name, lightValue] of Object.entries(light)) {
    const darkValue = dark[name] ?? null;
    tokens.push({ name: `--${name}`, light: lightValue, dark: darkValue });
  }
  return tokens;
}

function meaningOf(utility: string) {
  const meaning = UTILITY_MEANINGS[utility];
  if (meaning) {
    return meaning;
  }
  if (utility.startsWith('hairline-')) {
    return HAIRLINE_SIDE_MEANING;
  }
  return '';
}

function utilityOf(name: string) {
  const meaning = meaningOf(name);
  return { name, meaning };
}

function namesWithPrefix(rules: Record<string, unknown>, prefix: string) {
  const names: string[] = [];
  for (const key of Object.keys(rules)) {
    if (key.startsWith(prefix)) {
      names.push(key.slice(prefix.length));
    }
  }
  return names;
}

export async function themeSummary() {
  const theme = await loadRegistryItem(THEME_ITEM);
  const cssVariables = theme.cssVars ?? {};
  const light = cssVariables.light ?? {};
  const dark = cssVariables.dark ?? {};
  const themeVariables = cssVariables.theme ?? {};
  const rules = theme.css ?? {};
  const { colourNames, scales } = splitThemeVariables(themeVariables);
  const utilityNames = namesWithPrefix(rules, UTILITY_PREFIX);
  const utilities = utilityNames.map(utilityOf);
  return {
    name: theme.name,
    description: theme.description ?? '',
    install: urlInstallCommandOf(THEME_ITEM),
    tokens: tokensOf(light, dark),
    tailwindColours: colourNames,
    radius: scales.radius,
    easing: scales.easing,
    animations: scales.animations,
    otherThemeVariables: scales.other,
    utilities,
    keyframes: namesWithPrefix(rules, KEYFRAMES_PREFIX),
    rules: [
      'Colours are full values mapped through @theme inline, so bg-primary, text-primary-ink and color-mix(in oklab, var(--primary) ...) all work.',
      '--primary is a fill (the one primary action, checked controls, indicators); brand text uses text-primary-ink, which passes AA on both themes.',
      'Every primitive, component, block, template and motion piece lists theme as a registry dependency, so the shadcn CLI installs it with the first one.',
    ],
  };
}
