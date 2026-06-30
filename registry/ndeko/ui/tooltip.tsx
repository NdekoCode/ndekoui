'use client';

import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip';
import { useState } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';

type WithClassName<Props> = Omit<Props, 'className'> & { className?: string };

type TooltipHandle<Payload> = TooltipPrimitive.Handle<Payload>;

const TOOLTIP_DELAY_MS = 400;

/** Long enough for the pointer to cross the gap between two triggers of one gliding tooltip. */
const TOOLTIP_GLIDE_CLOSE_DELAY = 120;

function TooltipProvider({
  delay = TOOLTIP_DELAY_MS,
  ...props
}: TooltipPrimitive.Provider.Props) {
  return <TooltipPrimitive.Provider delay={delay} {...props} />;
}

function Tooltip<Payload>(props: TooltipPrimitive.Root.Props<Payload>) {
  return <TooltipPrimitive.Root data-slot='tooltip' {...props} />;
}

function TooltipTrigger<Payload>(
  props: TooltipPrimitive.Trigger.Props<Payload>
) {
  return <TooltipPrimitive.Trigger data-slot='tooltip-trigger' {...props} />;
}

/** One handle per mounted component, so two copies of a demo never share an open state. */
function useTooltipHandle<Payload>() {
  const [handle] = useState(() => TooltipPrimitive.createHandle<Payload>());
  return handle;
}

const BUBBLE = [
  'relative max-w-64 rounded-lg px-2 py-1 text-xs font-medium leading-snug text-balance text-popover-foreground',
  '[--tooltip-top:var(--popover)] [--tooltip-bottom:color-mix(in_oklab,var(--popover),var(--primary)_9%)]',
  'bg-linear-to-b from-(--tooltip-top) to-(--tooltip-bottom) hairline-ring ring-border shadow-md shadow-black/6',
  'origin-(--transform-origin) transition-[opacity,scale] duration-[125ms] ease-(--ease-out-strong)',
  'data-starting-style:scale-[0.97] data-starting-style:opacity-0 data-ending-style:scale-[0.97] data-ending-style:opacity-0 data-ending-style:duration-100',
  'data-instant:transition-none',
].join(' ');

const ARROW = [
  'flex fill-(--tooltip-bottom) stroke-border',
  'data-[side=bottom]:-top-[6px] data-[side=bottom]:fill-(--tooltip-top)',
  'data-[side=top]:-bottom-[6px] data-[side=top]:rotate-180',
  'data-[side=left]:-right-[9px] data-[side=left]:rotate-90',
  'data-[side=right]:-left-[9px] data-[side=right]:-rotate-90',
].join(' ');

/**
 * The first open does not glide: Base UI positions the popup while it still holds transitions
 * off. `data-instant` covers the provider's instant phase and cursor tracking.
 */
const TOOLTIP_GLIDE = [
  'transition-[top,left,right,bottom,transform] duration-200 ease-(--ease-out-strong)',
  'data-closed:transition-none data-instant:transition-none',
].join(' ');

/** The arrow remounts when the side changes, so it fades in on its new edge instead of jumping round a corner. */
const ARROW_GLIDE = [
  'transition-[left,top,opacity] duration-[200ms,200ms,125ms] ease-(--ease-out-strong)',
  'starting:opacity-0 data-instant:transition-none',
].join(' ');

/** The bubble's `max-w-64` minus its padding, so a long label still wraps inside the resizing box. */
const GLIDE_LABEL_MAX_WIDTH = 'max-w-62';

function positionerClassOf(glide: boolean) {
  return cn('z-50', glide && TOOLTIP_GLIDE);
}

function arrowClassOf(glide: boolean) {
  return cn(ARROW, glide && ARROW_GLIDE);
}

function TooltipBody({
  glide,
  children,
}: {
  glide: boolean;
  children: React.ReactNode;
}) {
  if (!glide) {
    return children;
  }
  return (
    <AnimatedSize axis='both' contentClassName={GLIDE_LABEL_MAX_WIDTH}>
      {children}
    </AnimatedSize>
  );
}

type TooltipContentProps = WithClassName<TooltipPrimitive.Popup.Props> &
  Pick<TooltipPrimitive.Positioner.Props, 'side' | 'sideOffset' | 'align'> & {
    /** Glide to the next trigger of a shared tooltip and ease to the size of its label. */
    glide?: boolean;
  };

function TooltipContent({
  className,
  children,
  side = 'top',
  sideOffset = 8,
  align = 'center',
  glide = false,
  ...props
}: TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        className={positionerClassOf(glide)}
      >
        <TooltipPrimitive.Popup
          data-slot='tooltip-content'
          className={cn(BUBBLE, className)}
          {...props}
        >
          <TooltipBody glide={glide}>{children}</TooltipBody>
          <TooltipPrimitive.Arrow key={side} className={arrowClassOf(glide)}>
            <svg width='12' height='6' viewBox='0 0 12 6' aria-hidden='true'>
              <path d='M0 6 6 0l6 6Z' stroke='none' />
              <polyline points='0,6 6,0.5 12,6' fill='none' strokeWidth='1' />
            </svg>
          </TooltipPrimitive.Arrow>
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

export {
  TOOLTIP_GLIDE,
  TOOLTIP_GLIDE_CLOSE_DELAY,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  useTooltipHandle,
  type TooltipHandle,
};
