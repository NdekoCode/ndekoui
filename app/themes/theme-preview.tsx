'use client';

import { memo } from 'react';

import { ThemeSwitch } from '@/app/kit/theme-switch';
import { cn } from '@/registry/ndeko/lib/utils';

import {
  PreviewButtons,
  PreviewChart,
  PreviewComposer,
  PreviewSide,
  PreviewSwitch,
} from './preview-parts';

type ThemePreviewProps = {
  /** The `data-theme` scope that recolours the surface. Nothing else on the page changes colour. */
  scope: string;
  name: string;
  className?: string;
};

/** Live components drawn once. A new scope changes the custom properties above them and nothing is mounted again. */
function ThemePreviewSurface({ scope, name, className }: ThemePreviewProps) {
  return (
    <section
      aria-labelledby='themes-preview-title'
      className={cn(
        'bg-foreground/[0.025] flex flex-col rounded-2xl p-1.5',
        className
      )}
    >
      <header className='flex items-center gap-3 py-1.5 ps-3 pe-0.5'>
        <div className='flex min-w-0 flex-1 flex-col'>
          <h2
            id='themes-preview-title'
            className='truncate text-[13px] font-medium'
          >
            Preview
          </h2>
          <p className='text-muted-foreground truncate font-mono text-[11px]'>
            {name}
          </p>
        </div>
        <ThemeSwitch />
      </header>
      <div
        data-theme={scope}
        className='bg-background text-foreground hairline-ring ring-border rounded-[calc(var(--radius-2xl)-0.375rem)] p-4 sm:p-5'
      >
        <div className='@container/scene flex flex-col gap-4'>
          <PreviewComposer />
          <PreviewButtons />
          <PreviewSwitch />
          <div className='grid gap-4 @md/scene:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]'>
            <PreviewChart />
            <PreviewSide />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Its props are plain strings, so a slider step that does not change them leaves the components alone. */
export const ThemePreview = memo(ThemePreviewSurface);
