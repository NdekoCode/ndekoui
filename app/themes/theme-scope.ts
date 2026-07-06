import type { ThemeTokens } from '@/lib/theme-colours';
import { blockTextOf, cssVarsOf, orderedTokensOf } from '@/lib/theme-css';

/** The scope of the theme the generator draws. The nine themes are scoped by their own names. */
export const CUSTOM_SCOPE = 'custom';

/**
 * A theme as two rules that only reach what sits under `data-theme="<scope>"`: one for light and one for dark, which the
 * `.dark` class of the page switches with no script. Picking another scope recolours the same elements in place.
 */
export function scopeCssOf(
  scope: string,
  light: ThemeTokens,
  dark: ThemeTokens,
  radius?: string
) {
  const vars = cssVarsOf(light, dark);
  const lightTokens: ThemeTokens = { ...vars.light };
  if (radius !== undefined) {
    lightTokens.radius = radius;
  }
  const lightRule = blockTextOf(
    `[data-theme='${scope}']`,
    orderedTokensOf(lightTokens)
  );
  const darkRule = blockTextOf(`.dark [data-theme='${scope}']`, vars.dark);
  return `${lightRule}\n${darkRule}\n`;
}
