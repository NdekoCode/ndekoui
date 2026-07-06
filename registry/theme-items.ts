import { itemUrlOf } from '../lib/site';
import { cssVarsOf, type CssVars } from '../lib/theme-css';
import {
  THEMES,
  themeChecksOf,
  themeItemNameOf,
  type ThemeDefinition,
} from '../lib/themes';

export type ThemeRegistryItem = {
  name: string;
  type: 'registry:theme';
  title: string;
  description: string;
  registryDependencies: string[];
  cssVars: CssVars;
  categories: string[];
};

const BASE_THEME_ITEM = 'theme';

function passesEveryPair(theme: ThemeDefinition) {
  const checks = themeChecksOf(theme);
  return checks.every((check) => check.passes);
}

function descriptionOf(theme: ThemeDefinition) {
  const scope =
    'Sets the primary fill, brand text, the focus ring, the sidebar primary and the chart colours for light and dark.';
  if (passesEveryPair(theme)) {
    return `${theme.description} ${scope} Every pair passes WCAG AA.`;
  }
  return `${theme.description} ${scope}`;
}

function themeItemOf(theme: ThemeDefinition): ThemeRegistryItem {
  return {
    name: themeItemNameOf(theme.name),
    type: 'registry:theme',
    title: `${theme.title} theme`,
    description: descriptionOf(theme),
    registryDependencies: [itemUrlOf(BASE_THEME_ITEM)],
    cssVars: cssVarsOf(theme.light, theme.dark),
    categories: ['foundations'],
  };
}

/** One `registry:theme` item per theme, built from the same data as the /themes page. They sit beside the `theme` item. */
export const themeItems: ThemeRegistryItem[] = THEMES.map(themeItemOf);
