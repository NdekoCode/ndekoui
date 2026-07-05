'use client';
import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';

export type ImageTabsOrientation = 'horizontal' | 'vertical';

export type ImageTabsListVariant = 'list' | 'thumbnails';

export type ImageTabsTransition = 'fade' | 'clip';

type PanelState = 'active' | 'previous' | 'idle';

type PanelSide = 'before' | 'after';

type ImageTabsContextValue = {
  value: string;
  previousValue: string | null;
  orientation: ImageTabsOrientation;
};

type ImageTabsFrameContextValue = {
  values: string[];
  transition: ImageTabsTransition;
};

const ImageTabsContext = createContext<ImageTabsContextValue | undefined>(
  undefined
);

const ImageTabsListContext = createContext<ImageTabsListVariant>('list');

const ImageTabsFrameContext = createContext<
  ImageTabsFrameContextValue | undefined
>(undefined);

function useImageTabs() {
  const context = useContext(ImageTabsContext);
  if (!context) {
    throw new Error('useImageTabs must be used within ImageTabs');
  }
  return context;
}

function useImageTabsFrame() {
  const context = useContext(ImageTabsFrameContext);
  if (!context) {
    throw new Error('ImageTabsPanel must be used within ImageTabsFrame');
  }
  return context;
}

function selectedValueOf(
  controlledValue: string | undefined,
  internal: string
) {
  if (controlledValue === undefined) {
    return internal;
  }
  return controlledValue;
}

export type ImageTabsProps = {
  children: ReactNode;
  className?: string;
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  orientation?: ImageTabsOrientation;
};

function ImageTabs({
  children,
  className,
  defaultValue,
  value: controlledValue,
  onValueChange,
  orientation = 'vertical',
}: ImageTabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const value = selectedValueOf(controlledValue, internalValue);
  const [shownValue, setShownValue] = useState(value);
  const [previousValue, setPreviousValue] = useState<string | null>(null);

  const hasNewValue = value !== shownValue;
  if (hasNewValue) {
    setPreviousValue(shownValue);
    setShownValue(value);
  }

  const handleValueChange = (nextValue: unknown) => {
    const next = String(nextValue);
    setInternalValue(next);
    onValueChange?.(next);
  };

  return (
    <ImageTabsContext.Provider value={{ value, previousValue, orientation }}>
      <TabsPrimitive.Root
        value={value}
        onValueChange={handleValueChange}
        orientation={orientation}
        className={cn('grid gap-4', className)}
      >
        {children}
      </TabsPrimitive.Root>
    </ImageTabsContext.Provider>
  );
}

const LIST_CLASS: Record<ImageTabsListVariant, string> = {
  list: 'flex gap-1 data-[orientation=vertical]:flex-col',
  thumbnails: 'flex flex-wrap gap-2 p-1',
};

const INDICATOR_CLASS: Record<ImageTabsListVariant, string> = {
  list: 'bg-card hairline-ring ring-foreground/10 dark:bg-foreground/[0.06] dark:ring-foreground/15 z-0 rounded-lg shadow-[0_1px_2px_rgb(0_0_0/0.08)]',
  thumbnails: 'outline-primary z-20 rounded-lg outline-2 outline-offset-2',
};

const INDICATOR_MOTION =
  'pointer-events-none absolute top-0 left-0 h-(--active-tab-height) w-(--active-tab-width) translate-x-(--active-tab-left) translate-y-(--active-tab-top) transition-[translate,width,height] duration-250 ease-(--ease-out-strong)';

export type ImageTabsListProps = {
  children: ReactNode;
  className?: string;
  variant?: ImageTabsListVariant;
  activateOnFocus?: boolean;
  'aria-label'?: string;
};

function ImageTabsList({
  children,
  className,
  variant = 'list',
  activateOnFocus = true,
  'aria-label': ariaLabel,
}: ImageTabsListProps) {
  return (
    <ImageTabsListContext.Provider value={variant}>
      <TabsPrimitive.List
        data-variant={variant}
        activateOnFocus={activateOnFocus}
        aria-label={ariaLabel}
        className={cn('relative', LIST_CLASS[variant], className)}
      >
        {children}
        <TabsPrimitive.Indicator
          className={cn(INDICATOR_MOTION, INDICATOR_CLASS[variant])}
        />
      </TabsPrimitive.List>
    </ImageTabsListContext.Provider>
  );
}

const TAB_BASE =
  'relative z-10 cursor-pointer text-left outline-none select-none focus-visible:ring-[3px] focus-visible:ring-ring/25';

const TAB_CLASS: Record<ImageTabsListVariant, string> = {
  list: 'text-muted-foreground hover:text-foreground data-active:text-foreground flex flex-col gap-0.5 rounded-lg px-3 py-2.5 transition-colors duration-150',
  thumbnails:
    'size-14 overflow-hidden rounded-lg opacity-60 transition-opacity duration-150 hover:opacity-100 data-active:opacity-100',
};

export type ImageTabsTabProps = {
  value: string;
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
  disabled?: boolean;
};

function ImageTabsTab({
  value,
  children,
  className,
  'aria-label': ariaLabel,
  disabled,
}: ImageTabsTabProps) {
  const variant = useContext(ImageTabsListContext);

  return (
    <TabsPrimitive.Tab
      value={value}
      aria-label={ariaLabel}
      disabled={disabled}
      className={cn(TAB_BASE, TAB_CLASS[variant], className)}
    >
      {children}
    </TabsPrimitive.Tab>
  );
}

export type ImageTabsTextProps = {
  children: ReactNode;
  className?: string;
};

function ImageTabsTitle({ children, className }: ImageTabsTextProps) {
  return (
    <span className={cn('text-sm font-medium text-balance', className)}>
      {children}
    </span>
  );
}

function ImageTabsDescription({ children, className }: ImageTabsTextProps) {
  return (
    <span
      className={cn(
        'text-muted-foreground text-[13px] leading-relaxed',
        className
      )}
    >
      {children}
    </span>
  );
}

function valuesOf(children: ReactNode) {
  const values: string[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement<{ value?: string }>(child)) {
      return;
    }
    const value = child.props.value;
    if (value !== undefined) {
      values.push(value);
    }
  });
  return values;
}

function transitionOf(
  transition: ImageTabsTransition,
  prefersReducedMotion: boolean | null
): ImageTabsTransition {
  if (prefersReducedMotion) {
    return 'fade';
  }
  return transition;
}

export type ImageTabsFrameProps = {
  children: ReactNode;
  className?: string;
  transition?: ImageTabsTransition;
};

function ImageTabsFrame({
  children,
  className,
  transition = 'fade',
}: ImageTabsFrameProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const values = valuesOf(children);
  const activeTransition = transitionOf(transition, prefersReducedMotion);

  return (
    <ImageTabsFrameContext.Provider
      value={{ values, transition: activeTransition }}
    >
      <div
        className={cn(
          'bg-foreground/[0.04] relative isolate aspect-[3/2] overflow-hidden rounded-xl',
          className
        )}
      >
        {children}
      </div>
    </ImageTabsFrameContext.Provider>
  );
}

const FADE_DURATION = 200;

const CLIP_DURATION = 320;

const FADE_IN = `opacity ${FADE_DURATION}ms var(--ease-out-strong)`;

const CLIP_IN = `clip-path ${CLIP_DURATION}ms var(--ease-in-out-strong)`;

const HIDE_AFTER_FADE = `opacity 0s linear ${FADE_DURATION}ms`;

const HIDE_AFTER_CLIP = `clip-path 0s linear ${CLIP_DURATION}ms`;

const SHOWN_CLIP = 'inset(0 0 0 0)';

function panelStateOf(
  value: string,
  activeValue: string,
  previousValue: string | null
): PanelState {
  if (value === activeValue) {
    return 'active';
  }
  if (value === previousValue) {
    return 'previous';
  }
  return 'idle';
}

function sideOf(index: number, activeIndex: number): PanelSide {
  if (index < activeIndex) {
    return 'before';
  }
  return 'after';
}

function hiddenClipOf(side: PanelSide, orientation: ImageTabsOrientation) {
  const isAfter = side === 'after';
  if (orientation === 'vertical') {
    if (isAfter) {
      return 'inset(100% 0 0 0)';
    }
    return 'inset(0 0 100% 0)';
  }
  if (isAfter) {
    return 'inset(0 0 0 100%)';
  }
  return 'inset(0 100% 0 0)';
}

function stackOrderOf(state: PanelState) {
  if (state === 'active') {
    return 2;
  }
  if (state === 'previous') {
    return 1;
  }
  return 0;
}

function fadeStyleOf(state: PanelState): CSSProperties {
  const zIndex = stackOrderOf(state);
  if (state === 'idle') {
    return {
      opacity: 0,
      clipPath: 'none',
      zIndex,
      transition: HIDE_AFTER_FADE,
    };
  }
  return { opacity: 1, clipPath: 'none', zIndex, transition: FADE_IN };
}

function clipStyleOf(
  state: PanelState,
  side: PanelSide,
  orientation: ImageTabsOrientation
): CSSProperties {
  const zIndex = stackOrderOf(state);
  if (state === 'idle') {
    const clipPath = hiddenClipOf(side, orientation);
    return { opacity: 1, clipPath, zIndex, transition: HIDE_AFTER_CLIP };
  }
  return { opacity: 1, clipPath: SHOWN_CLIP, zIndex, transition: CLIP_IN };
}

function renderVisiblePanel(props: ComponentProps<'div'>) {
  return <div {...props} hidden={false} />;
}

export type ImageTabsPanelProps = {
  value: string;
  children: ReactNode;
  className?: string;
};

function ImageTabsPanel({ value, children, className }: ImageTabsPanelProps) {
  const { value: activeValue, previousValue, orientation } = useImageTabs();
  const { values, transition } = useImageTabsFrame();
  const state = panelStateOf(value, activeValue, previousValue);
  const index = values.indexOf(value);
  const activeIndex = values.indexOf(activeValue);
  const side = sideOf(index, activeIndex);
  let style = fadeStyleOf(state);
  if (transition === 'clip') {
    style = clipStyleOf(state, side, orientation);
  }

  return (
    <TabsPrimitive.Panel
      value={value}
      keepMounted
      render={renderVisiblePanel}
      data-state={state}
      style={style}
      className={cn(
        'focus-visible:outline-ring absolute inset-0 focus-visible:outline-2 focus-visible:-outline-offset-2',
        className
      )}
    >
      {children}
    </TabsPrimitive.Panel>
  );
}

export type ImageTabsImageProps = {
  value: string;
  src: string;
  alt: string;
  className?: string;
};

function ImageTabsImage({ value, src, alt, className }: ImageTabsImageProps) {
  return (
    <ImageTabsPanel value={value}>
      {/* eslint-disable-next-line @next/next/no-img-element -- registry items land in any React app, where next/image may not exist */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        decoding='async'
        className={cn('size-full object-cover', className)}
      />
    </ImageTabsPanel>
  );
}

export {
  ImageTabs,
  ImageTabsDescription,
  ImageTabsFrame,
  ImageTabsImage,
  ImageTabsList,
  ImageTabsPanel,
  ImageTabsTab,
  ImageTabsTitle,
  useImageTabs,
};
