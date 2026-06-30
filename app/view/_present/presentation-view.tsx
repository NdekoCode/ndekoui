'use client';

import Link from 'next/link';
import { useState } from 'react';

import { OpenInMenu } from '@/app/_site/open-in/open-in-menu';
import type { PresentationLayout } from '@/app/blocks/_shared/presentation-layout';
import { useElementWidth } from '@/app/blocks/_shared/use-element-width';
import {
  PreviewHintTooltip,
  VIEWPORT_WIDTH_CLASS,
  ViewportSwitch,
  type PreviewHint,
  type Viewport,
} from '@/app/blocks/_shared/viewport-switch';
import { ArrowLeftIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { useTooltipHandle } from '@/registry/ndeko/ui/tooltip';

const STAGE_PADDING: Record<PresentationLayout, string> = {
  contained: 'p-4 sm:p-8 lg:p-12',
  wide: 'py-4 sm:py-8 lg:py-12',
  bleed: '',
};

const FRAME = [
  'bg-background hairline-ring ring-border flex flex-col overflow-hidden',
  'transition-[width,border-radius] duration-300 ease-(--ease-out-quint)',
].join(' ');

const RAISED_FRAME = 'rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]';

/**
 * A full-width frame keeps square corners against the window edges; once a marketing section is
 * narrowed to a tablet or a phone it stands on the stage like an application block.
 */
function frameShapeOf(layout: PresentationLayout, viewport: Viewport) {
  if (layout === 'contained') {
    return cn('max-w-[80rem]', RAISED_FRAME);
  }
  const isWide = layout === 'wide';
  const isNarrowed = viewport !== 'desktop';
  if (isWide && isNarrowed) {
    return RAISED_FRAME;
  }
  return 'rounded-none';
}

type PresentationViewProps = {
  title: string;
  itemName: string;
  groupName: string;
  backHref: string;
  frameSrc: string;
  layout: PresentationLayout;
};

/**
 * The entry is drawn in a frame of the bare view, so its breakpoints and its full-height layouts
 * answer to the space it is given rather than to the whole window.
 */
export function PresentationView({
  title,
  itemName,
  groupName,
  backHref,
  frameSrc,
  layout,
}: PresentationViewProps) {
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);
  const frameWidth = useElementWidth(frame);
  const hint = useTooltipHandle<PreviewHint>();
  const frameShape = frameShapeOf(layout, viewport);
  const frameClassName = cn(FRAME, frameShape, VIEWPORT_WIDTH_CLASS[viewport]);

  return (
    <div className='bg-foreground/[0.025] flex h-dvh flex-col'>
      <header className='flex h-12 shrink-0 items-center gap-2 px-2 sm:px-4'>
        <Button
          variant='ghost'
          size='sm'
          nativeButton={false}
          className='text-muted-foreground'
          aria-label={`Back to ${groupName}`}
          render={<Link href={backHref} />}
        >
          <ArrowLeftIcon />
          <span className='hidden sm:inline'>{groupName}</span>
        </Button>
        <h1 className='min-w-0 truncate text-[13px] font-medium'>{title}</h1>
        <div className='ms-auto flex shrink-0 items-center gap-1'>
          <ViewportSwitch
            value={viewport}
            onValueChange={setViewport}
            hint={hint}
            label={`Preview width of ${title}`}
            className='hidden sm:flex'
          />
          <OpenInMenu title={title} itemName={itemName} />
        </div>
        <PreviewHintTooltip
          hint={hint}
          viewport={viewport}
          frameWidth={frameWidth}
          side='bottom'
        />
      </header>
      <main
        className={cn(
          'flex min-h-0 flex-1 justify-center',
          STAGE_PADDING[layout]
        )}
      >
        <div ref={setFrame} className={frameClassName}>
          <iframe
            src={frameSrc}
            title={`${title} preview`}
            className='bg-background block w-full flex-1'
          />
        </div>
      </main>
    </div>
  );
}
