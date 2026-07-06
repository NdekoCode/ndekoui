import type { Metadata } from 'next';

import { pageMetadataOf } from '@/app/_site/seo';
import CodeBlock from '@/components/website/code-block';
import { countLabel } from '@/lib/site';
import { cssTextOf } from '@/lib/theme-css';
import { THEMES, type ThemeDefinition } from '@/lib/themes';

import { scopeCssOf } from './theme-scope';
import { ThemesWorkbench, type ThemeCodeBlock } from './themes-workbench';

export const metadata: Metadata = pageMetadataOf({
  title: 'Themes for React and Tailwind CSS - ndekoui',
  description:
    'Nine themes that recolour every ndekoui piece with one command, each measured for contrast in light and dark, and a generator that writes a theme from a hue.',
  keywords: [
    'React themes',
    'shadcn themes',
    'Tailwind CSS theme generator',
    'dark mode theme',
    'WCAG AA colour contrast',
  ],
  path: '/themes',
});

function scopeRulesOf(theme: ThemeDefinition) {
  return scopeCssOf(theme.name, theme.light, theme.dark);
}

function codeBlockOf(theme: ThemeDefinition): ThemeCodeBlock {
  const css = cssTextOf(theme.light, theme.dark);
  return { name: theme.name, block: <CodeBlock code={css} lang='css' /> };
}

export default function ThemesPage() {
  const codeBlocks = THEMES.map(codeBlockOf);
  const scopeRules = THEMES.map(scopeRulesOf).join('\n');
  const count = countLabel(THEMES.length, 'theme', 'themes');

  return (
    <div className='flex flex-col gap-14'>
      <style>{scopeRules}</style>
      <header className='flex flex-col gap-1'>
        <p className='text-primary-ink text-xs font-medium'>{count}</p>
        <h1 className='text-2xl font-semibold text-balance sm:text-3xl'>
          Themes
        </h1>
        <p className='text-muted-foreground max-w-xl text-[13px] text-balance'>
          Recolour every ndekoui piece at once. A theme sets the primary colour,
          brand text, the focus ring and the chart colours for light and dark,
          and this page measures each pair against WCAG AA.
        </p>
      </header>
      <ThemesWorkbench codeBlocks={codeBlocks} />
    </div>
  );
}
