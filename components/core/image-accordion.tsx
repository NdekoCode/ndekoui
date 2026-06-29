'use client';
import { useState, type MouseEvent, type PointerEvent } from 'react';
import { cn } from '@/lib/utils';

export type ImageAccordionItem = {
  id: string;
  src: string;
  alt: string;
  title: string;
  description?: string;
  href?: string;
};

export type ImageAccordionOrientation = 'horizontal' | 'vertical';

export type ImageAccordionProps = {
  items: ImageAccordionItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  orientation?: ImageAccordionOrientation;
  className?: string;
};

const ORIENTATION_CLASS: Record<ImageAccordionOrientation, string> = {
  horizontal: 'h-[28rem] flex-col sm:h-80 sm:flex-row',
  vertical: 'h-[28rem] flex-col',
};

const IMAGE_CLASS: Record<ImageAccordionOrientation, string> = {
  horizontal:
    'top-1/2 left-0 h-auto min-h-full w-full -translate-y-1/2 sm:top-0 sm:left-1/2 sm:h-full sm:min-h-0 sm:w-auto sm:min-w-full sm:-translate-x-1/2 sm:translate-y-0',
  vertical: 'top-1/2 left-0 h-auto min-h-full w-full -translate-y-1/2',
};

const ITEM_CLASS =
  'min-h-0 min-w-0 basis-0 grow transition-[flex-grow] duration-500 ease-(--ease-out-strong) data-[active=true]:grow-[4]';

const PANEL_CLASS =
  'group/panel bg-foreground/[0.04] focus-visible:ring-ring focus-visible:ring-offset-background relative block size-full cursor-pointer overflow-hidden rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

const CAPTION_CLASS =
  'pointer-events-none absolute bottom-3 left-3 flex w-56 flex-col gap-0.5 rounded-lg bg-card/90 px-3 py-2 text-card-foreground opacity-0 shadow-[0_1px_2px_rgb(0_0_0/0.08)] transition-[opacity,translate] duration-100 ease-(--ease-out-strong) translate-y-1 group-data-[active=true]/panel:translate-y-0 group-data-[active=true]/panel:opacity-100 group-data-[active=true]/panel:delay-150 group-data-[active=true]/panel:duration-200';

function firstIdOf(items: ImageAccordionItem[]) {
  const first = items[0];
  if (!first) {
    return '';
  }
  return first.id;
}

function selectedIdOf(
  controlledValue: string | undefined,
  internalValue: string
) {
  if (controlledValue === undefined) {
    return internalValue;
  }
  return controlledValue;
}

type PanelContentProps = {
  item: ImageAccordionItem;
  orientation: ImageAccordionOrientation;
};

function PanelContent({ item, orientation }: PanelContentProps) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- registry items land in any React app, where next/image may not exist */}
      <img
        src={item.src}
        alt={item.alt}
        draggable={false}
        decoding='async'
        className={cn(
          'absolute max-w-none object-cover',
          IMAGE_CLASS[orientation]
        )}
      />
      <span className={CAPTION_CLASS}>
        <span className='truncate text-sm font-medium'>{item.title}</span>
        {item.description && (
          <span className='text-muted-foreground line-clamp-2 text-xs'>
            {item.description}
          </span>
        )}
      </span>
    </>
  );
}

function ImageAccordion({
  items,
  defaultValue,
  value: controlledValue,
  onValueChange,
  orientation = 'horizontal',
  className,
}: ImageAccordionProps) {
  const [internalValue, setInternalValue] = useState(
    defaultValue ?? firstIdOf(items)
  );
  const activeId = selectedIdOf(controlledValue, internalValue);

  const activate = (id: string) => {
    if (id === activeId) {
      return;
    }
    setInternalValue(id);
    onValueChange?.(id);
  };

  const activateOnPress = (
    item: ImageAccordionItem,
    event: MouseEvent<HTMLElement>
  ) => {
    const isLink = item.href !== undefined;
    const isClosed = item.id !== activeId;
    const isClosedLink = isLink && isClosed;
    if (isClosedLink) {
      event.preventDefault();
    }
    activate(item.id);
  };

  const activateOnHover = (id: string, event: PointerEvent<HTMLElement>) => {
    const isMouse = event.pointerType === 'mouse';
    if (isMouse) {
      activate(id);
    }
  };

  return (
    <ul className={cn('flex gap-2', ORIENTATION_CLASS[orientation], className)}>
      {items.map((item) => {
        const isActive = item.id === activeId;
        const sharedProps = {
          'data-active': isActive,
          className: PANEL_CLASS,
          onFocus: () => activate(item.id),
          onClick: (event: MouseEvent<HTMLElement>) =>
            activateOnPress(item, event),
          onPointerEnter: (event: PointerEvent<HTMLElement>) =>
            activateOnHover(item.id, event),
        };

        return (
          <li key={item.id} data-active={isActive} className={ITEM_CLASS}>
            {item.href && (
              <a href={item.href} {...sharedProps}>
                <PanelContent item={item} orientation={orientation} />
              </a>
            )}
            {!item.href && (
              <button type='button' aria-expanded={isActive} {...sharedProps}>
                <PanelContent item={item} orientation={orientation} />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export { ImageAccordion };
