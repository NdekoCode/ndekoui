import type { ReactNode } from 'react';

import { CopyField } from '@/app/mcp/_components/copy-field';
import { installCommandOf } from '@/lib/site';
import {
  themeChecksOf,
  themeItemNameOf,
  type ThemeDefinition,
} from '@/lib/themes';

import { SHORT_CODE } from './code-surface';
import { ContrastTable } from './contrast-table';

type ThemeDetailsProps = {
  theme: ThemeDefinition;
  /** The stylesheet of the theme, highlighted on the server. */
  codeBlock: ReactNode;
};

export function ThemeDetails({ theme, codeBlock }: ThemeDetailsProps) {
  const checks = themeChecksOf(theme);
  const installCommand = installCommandOf(themeItemNameOf(theme.name));

  return (
    <section
      aria-labelledby='themes-details-title'
      className='flex flex-col gap-4'
    >
      <div className='flex flex-col gap-1'>
        <h3 id='themes-details-title' className='text-sm font-medium'>
          {theme.title}
        </h3>
        <p className='text-muted-foreground text-[13px]'>{theme.description}</p>
      </div>
      <CopyField
        value={installCommand}
        label={`Copy the install command of ${theme.title}`}
      />
      <ContrastTable checks={checks} />
      <div className={SHORT_CODE}>{codeBlock}</div>
    </section>
  );
}
