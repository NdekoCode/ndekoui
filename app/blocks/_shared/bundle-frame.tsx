'use client';

import { useRef, useState } from 'react';

import { CodeDialog } from '@/app/_site/code-dialog';
import { MaximizeIcon, RefreshCwIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import {
  TOOLTIP_GLIDE_CLOSE_DELAY,
  TooltipTrigger,
  useTooltipHandle,
  type TooltipHandle,
} from '@/registry/ndeko/ui/tooltip';

import { InstallCommand } from './install-command';
import { useElementWidth } from './use-element-width';
import {
  PreviewHintTooltip,
  VIEWPORT_WIDTH_CLASS,
  ViewportSwitch,
  type PreviewHint,
  type Viewport,
} from './viewport-switch';

const DEFAULT_HEIGHT = 560;

const STAGE = [
  'bg-background hairline-ring ring-border overflow-hidden rounded-[calc(var(--radius-2xl)-0.375rem)]',
  'shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-[width] duration-300 ease-(--ease-out-quint)',
].join(' ');

const TOOL_BUTTON = 'text-muted-foreground';

const RELOAD_TURN =
  'transition-[rotate] duration-[450ms] ease-(--ease-out-strong)';

type ToolProps = {
  title: string;
  hint: TooltipHandle<PreviewHint>;
};

type ReloadButtonProps = ToolProps & {
  onReload: () => void;
};

/** Each press turns the icon once more; a quick second press carries the turn on instead of restarting it. */
function ReloadButton({ title, hint, onReload }: ReloadButtonProps) {
  const [turns, setTurns] = useState(0);
  const angle = turns * 360;
  const iconStyle = { rotate: `${angle}deg` };

  function reload() {
    setTurns((count) => count + 1);
    onReload();
  }

  return (
    <TooltipTrigger
      handle={hint}
      payload='reload'
      closeDelay={TOOLTIP_GLIDE_CLOSE_DELAY}
      render={
        <Button
          variant='ghost'
          size='icon-sm'
          className={TOOL_BUTTON}
          aria-label={`Reload the preview of ${title}`}
          onClick={reload}
        />
      }
    >
      <RefreshCwIcon style={iconStyle} className={RELOAD_TURN} />
    </TooltipTrigger>
  );
}

type FullPageLinkProps = ToolProps & {
  href: string;
};

function FullPageLink({ href, title, hint }: FullPageLinkProps) {
  return (
    <TooltipTrigger
      handle={hint}
      payload='full-page'
      closeDelay={TOOLTIP_GLIDE_CLOSE_DELAY}
      render={
        <Button
          variant='ghost'
          size='icon-sm'
          nativeButton={false}
          className={TOOL_BUTTON}
          aria-label={`Open ${title} full page in a new tab`}
          render={<a href={href} target='_blank' rel='noreferrer' />}
        />
      }
    >
      <MaximizeIcon />
    </TooltipTrigger>
  );
}

type BundleFrameProps = {
  src: string;
  fullPageHref: string;
  title: string;
  description: string;
  itemName: string;
  height?: number;
};

/**
 * The toolbar sits between the title and the frame: the viewport switch rests on the top edge of
 * the frame it resizes, the frame keeps its height so nothing under the pointer moves, and the
 * tools stay in view with the title when a link lands on the entry.
 */
export function BundleFrame({
  src,
  fullPageHref,
  title,
  description,
  itemName,
  height = DEFAULT_HEIGHT,
}: BundleFrameProps) {
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);
  const frameWidth = useElementWidth(frame);
  const hint = useTooltipHandle<PreviewHint>();
  const previewStyle = { height };

  function reloadPreview() {
    const previewWindow = previewRef.current?.contentWindow;
    previewWindow?.location.reload();
  }

  return (
    <div className='bg-foreground/[0.025] flex flex-col gap-1.5 rounded-2xl p-1.5'>
      <div className='flex flex-col gap-0.5 px-1.5 pt-1.5 pb-1'>
        <h2 className='text-sm font-semibold'>{title}</h2>
        <p className='text-muted-foreground text-xs text-pretty'>
          {description}
        </p>
      </div>
      <div className='flex items-center gap-2'>
        <div className='flex shrink-0 items-center gap-1'>
          <ViewportSwitch
            value={viewport}
            onValueChange={setViewport}
            hint={hint}
            label={`Preview width of ${title}`}
            className='hidden sm:flex'
          />
          <ReloadButton title={title} hint={hint} onReload={reloadPreview} />
          <FullPageLink href={fullPageHref} title={title} hint={hint} />
        </div>
        <div className='ms-auto flex min-w-0 items-center gap-1.5'>
          <InstallCommand itemName={itemName} className='hidden md:flex' />
          <CodeDialog
            title={title}
            description={description}
            itemName={itemName}
          />
        </div>
        <PreviewHintTooltip
          hint={hint}
          viewport={viewport}
          frameWidth={frameWidth}
        />
      </div>
      <div className='flex justify-center'>
        <div
          ref={setFrame}
          className={cn(VIEWPORT_WIDTH_CLASS[viewport], STAGE)}
        >
          <iframe
            ref={previewRef}
            src={src}
            title={title}
            loading='lazy'
            style={previewStyle}
            className='bg-background block w-full'
          />
        </div>
      </div>
    </div>
  );
}
