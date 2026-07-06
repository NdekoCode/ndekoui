import type { ThemeTokens } from './theme-colours';

/** The order of ndeko.css, so a theme reads like the stylesheet it overrides. */
const TOKEN_ORDER = [
  'radius',
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'primary-ink',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'border',
  'input',
  'ring',
  'sidebar',
  'sidebar-foreground',
  'sidebar-primary',
  'sidebar-primary-foreground',
  'sidebar-accent',
  'sidebar-accent-foreground',
  'sidebar-border',
  'sidebar-ring',
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
];

const CHART_PREFIX = 'chart-';

export function orderedTokensOf(tokens: ThemeTokens): ThemeTokens {
  const ordered: ThemeTokens = {};
  for (const name of TOKEN_ORDER) {
    const value = tokens[name];
    if (value !== undefined) {
      ordered[name] = value;
    }
  }
  for (const [name, value] of Object.entries(tokens)) {
    const isPlaced = name in ordered;
    if (!isPlaced) {
      ordered[name] = value;
    }
  }
  return ordered;
}

/** The default stylesheet gives `.dark` no chart colours, so a dark chart colour equal to the light one is left to inherit. */
function inheritedChartsRemoved(dark: ThemeTokens, light: ThemeTokens) {
  const kept: ThemeTokens = {};
  for (const [name, value] of Object.entries(dark)) {
    const isChart = name.startsWith(CHART_PREFIX);
    const isSameAsLight = light[name] === value;
    const isInherited = isChart && isSameAsLight;
    if (!isInherited) {
      kept[name] = value;
    }
  }
  return kept;
}

export type CssVars = {
  light: ThemeTokens;
  dark: ThemeTokens;
};

export function cssVarsOf(light: ThemeTokens, dark: ThemeTokens): CssVars {
  const darkOwn = inheritedChartsRemoved(dark, light);
  return {
    light: orderedTokensOf(light),
    dark: orderedTokensOf(darkOwn),
  };
}

export function blockTextOf(selector: string, tokens: ThemeTokens) {
  const lines = Object.entries(tokens).map(
    ([name, value]) => `  --${name}: ${value};`
  );
  return [`${selector} {`, ...lines, '}'].join('\n');
}

export function cssTextOf(
  light: ThemeTokens,
  dark: ThemeTokens,
  radius?: string
) {
  const vars = cssVarsOf(light, dark);
  const lightTokens: ThemeTokens = { ...vars.light };
  if (radius !== undefined) {
    lightTokens.radius = radius;
  }
  const lightBlock = blockTextOf(':root', orderedTokensOf(lightTokens));
  const darkBlock = blockTextOf('.dark', vars.dark);
  return `${lightBlock}\n\n${darkBlock}\n`;
}
