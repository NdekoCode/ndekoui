'use client';

import { PreviewCard as PreviewCardPrimitive } from '@base-ui/react/preview-card';

import { POPUP_TRANSITION } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';

type WithClassName<Props> = Omit<Props, 'className'> & { className?: string };

function HoverCard(props: PreviewCardPrimitive.Root.Props) {
  return <PreviewCardPrimitive.Root data-slot='hover-card' {...props} />;
}

function HoverCardTrigger(props: PreviewCardPrimitive.Trigger.Props) {
  return (
    <PreviewCardPrimitive.Trigger data-slot='hover-card-trigger' {...props} />
  );
}

type HoverCardContentProps = WithClassName<PreviewCardPrimitive.Popup.Props> &
  Pick<
    PreviewCardPrimitive.Positioner.Props,
    'side' | 'sideOffset' | 'align' | 'alignOffset'
  > & {
    showArrow?: boolean;
  };

function HoverCardContent({
  className,
  children,
  side = 'bottom',
  sideOffset = 6,
  align = 'center',
  alignOffset = 0,
  showArrow = false,
  ...props
}: HoverCardContentProps) {
  return (
    <PreviewCardPrimitive.Portal>
      <PreviewCardPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        className='z-50'
      >
        <PreviewCardPrimitive.Popup
          data-slot='hover-card-content'
          className={cn(
            'surface-raised w-64 rounded-xl p-4 text-[13px] outline-none',
            POPUP_TRANSITION,
            className
          )}
          {...props}
        >
          {children}
          {showArrow && (
            <PreviewCardPrimitive.Arrow className='fill-popover stroke-border flex data-[side=bottom]:-top-[6px] data-[side=left]:-right-[9px] data-[side=left]:rotate-90 data-[side=right]:-left-[9px] data-[side=right]:-rotate-90 data-[side=top]:-bottom-[6px] data-[side=top]:rotate-180'>
              <svg width='12' height='6' viewBox='0 0 12 6' aria-hidden='true'>
                <path d='M0 6 6 0l6 6Z' stroke='none' />
                <polyline points='0,6 6,0.5 12,6' fill='none' strokeWidth='1' />
              </svg>
            </PreviewCardPrimitive.Arrow>
          )}
        </PreviewCardPrimitive.Popup>
      </PreviewCardPrimitive.Positioner>
    </PreviewCardPrimitive.Portal>
  );
}

export { HoverCard, HoverCardContent, HoverCardTrigger };
