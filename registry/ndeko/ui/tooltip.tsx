'use client';

import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip';

import { cn } from '@/registry/ndeko/lib/utils';

type WithClassName<Props> = Omit<Props, 'className'> & { className?: string };

const TOOLTIP_DELAY_MS = 400;

function TooltipProvider({
  delay = TOOLTIP_DELAY_MS,
  ...props
}: TooltipPrimitive.Provider.Props) {
  return <TooltipPrimitive.Provider delay={delay} {...props} />;
}

function Tooltip(props: TooltipPrimitive.Root.Props) {
  return <TooltipPrimitive.Root data-slot='tooltip' {...props} />;
}

function TooltipTrigger(props: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot='tooltip-trigger' {...props} />;
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

type TooltipContentProps = WithClassName<TooltipPrimitive.Popup.Props> &
  Pick<TooltipPrimitive.Positioner.Props, 'side' | 'sideOffset' | 'align'>;

function TooltipContent({
  className,
  children,
  side = 'top',
  sideOffset = 8,
  align = 'center',
  ...props
}: TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        className='z-50'
      >
        <TooltipPrimitive.Popup
          data-slot='tooltip-content'
          className={cn(BUBBLE, className)}
          {...props}
        >
          {children}
          <TooltipPrimitive.Arrow className={ARROW}>
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

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
