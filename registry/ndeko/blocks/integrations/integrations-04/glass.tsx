'use client';

import { motion } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { pressedSolidOf } from '@/registry/ndeko/lib/demonstration';
import { XIcon } from '@/registry/ndeko/lib/icons';
import { springOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { Button } from '@/registry/ndeko/ui/button';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';

import type { Tool } from './data';

const WINDOW_STYLE = { borderRadius: 48 };

const PANEL_STYLE = { borderRadius: 18 };

const LABELS: Record<MorphState, string> = {
  idle: 'Connect',
  busy: 'Connecting',
  done: 'Connected',
};

const CONTENT_ARRIVAL = { duration: 0.18, delay: 0.12 };

function morphStateOf(isConnected: boolean, isConnecting: boolean): MorphState {
  if (isConnected) {
    return 'done';
  }
  if (isConnecting) {
    return 'busy';
  }
  return 'idle';
}

function contentStartOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return false;
  }
  return { opacity: 0 };
}

type FrameProps = {
  layoutId: string;
};

function WindowFrame({ layoutId }: FrameProps) {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <motion.div
      layoutId={layoutId}
      style={WINDOW_STYLE}
      transition={springOf(shouldReduceMotion)}
      className='hairline-ring ring-foreground/15 h-full w-24 shadow-[0_10px_28px_-14px_rgb(0_0_0/0.28)]'
    />
  );
}

type PanelFrameProps = FrameProps & {
  tool: Tool;
  isConnected: boolean;
  isConnecting: boolean;
  isConnectPressed: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onClose: () => void;
};

function PanelFrame({
  layoutId,
  tool,
  isConnected,
  isConnecting,
  isConnectPressed,
  onConnect,
  onDisconnect,
  onClose,
}: PanelFrameProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const morphState = morphStateOf(isConnected, isConnecting);

  return (
    <motion.div
      layoutId={layoutId}
      style={PANEL_STYLE}
      transition={springOf(shouldReduceMotion)}
      role='dialog'
      aria-label={`Connect ${tool.name}`}
      className='bg-card hairline-ring ring-foreground/15 dark:bg-popover pointer-events-auto h-full w-full max-w-sm shadow-[0_10px_28px_-14px_rgb(0_0_0/0.28)]'
    >
      <motion.div
        key={tool.id}
        initial={contentStartOf(shouldReduceMotion)}
        animate={{ opacity: 1 }}
        transition={CONTENT_ARRIVAL}
        className='flex h-full flex-col gap-3 p-4'
      >
        <div className='flex items-center gap-3'>
          <BrandTile brand={tool.id} size='2xl' />
          <div className='flex min-w-0 flex-1 flex-col'>
            <h3 className='truncate text-sm font-medium'>{tool.name}</h3>
            <p className='text-muted-foreground text-xs'>{tool.kind}</p>
          </div>
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            aria-label={`Close ${tool.name}`}
            onClick={onClose}
            className='text-muted-foreground self-start'
          >
            <XIcon />
          </Button>
        </div>
        <p className='text-muted-foreground text-[13px] text-pretty'>
          {tool.summary}
        </p>
        <div className='mt-auto flex items-center gap-2'>
          <MorphButton
            type='button'
            data-connect=''
            state={morphState}
            labels={LABELS}
            onClick={onConnect}
            className={cn(pressedSolidOf(isConnectPressed))}
          />
          {isConnected && (
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={onDisconnect}
            >
              Disconnect
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

type GlassProps = {
  layoutId: string;
  tool: Tool | null;
  isConnected: boolean;
  isConnecting: boolean;
  isConnectPressed: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onClose: () => void;
};

/** One frame that is the window while nothing is open and the panel once a tool is, so the window grows into it. */
export function Glass({ layoutId, tool, ...panel }: GlassProps) {
  let frame = <WindowFrame layoutId={layoutId} />;
  if (tool !== null) {
    frame = <PanelFrame layoutId={layoutId} tool={tool} {...panel} />;
  }

  return (
    <div className='pointer-events-none absolute inset-0 flex justify-center'>
      {frame}
    </div>
  );
}
