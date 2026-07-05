'use client';
import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react';
import {
  Children,
  createContext,
  useContext,
  useEffect,
  useRef,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  ImageTabs,
  ImageTabsFrame,
  ImageTabsImage,
  ImageTabsPanel,
  type ImageTabsProps,
} from './image-tabs';

type DockLayout = {
  centers: number[];
  sizes: number[];
};

type DockMetrics = {
  pointerX: number;
  presence: number;
  layout: DockLayout;
  magnification: number;
  distance: number;
};

type DockContextValue = {
  pointer: MotionValue<number>;
  presence: MotionValue<number>;
  layoutRef: RefObject<DockLayout>;
  magnification: number;
  distance: number;
};

const POINTER_SPRING = { stiffness: 520, damping: 46 };

const PRESENCE_SPRING = { stiffness: 320, damping: 36 };

const RESTING_PRESENCE = 0.05;

const DockContext = createContext<DockContextValue | undefined>(undefined);

const DockItemIndexContext = createContext(0);

function useDock() {
  const context = useContext(DockContext);
  if (!context) {
    throw new Error('MagnifiedDocItem must be used within MagnifiedDocDock');
  }
  return context;
}

function measureLayout(list: HTMLElement): DockLayout {
  const items = list.querySelectorAll<HTMLElement>('[data-dock-item]');
  const centers: number[] = [];
  const sizes: number[] = [];
  items.forEach((item) => {
    const center = item.offsetLeft + item.offsetWidth / 2;
    centers.push(center);
    sizes.push(item.offsetWidth);
  });
  return { centers, sizes };
}

function weightOf(offsetFromPointer: number, distance: number) {
  const ratio = Math.abs(offsetFromPointer) / distance;
  if (ratio >= 1) {
    return 0;
  }
  const wave = Math.cos(ratio * Math.PI);
  return (wave + 1) / 2;
}

function growthOf(index: number, metrics: DockMetrics) {
  const center = metrics.layout.centers[index] ?? 0;
  const size = metrics.layout.sizes[index] ?? 0;
  const weight = weightOf(metrics.pointerX - center, metrics.distance);
  const maximumGrowth = (metrics.magnification - 1) * size;
  return weight * metrics.presence * maximumGrowth;
}

function scaleOf(index: number, metrics: DockMetrics) {
  const size = metrics.layout.sizes[index];
  if (!size) {
    return 1;
  }
  const growth = growthOf(index, metrics);
  return 1 + growth / size;
}

/** Translates each item as if its neighbours had grown in width, so the row spreads like a dock without animating layout. */
function shiftOf(index: number, metrics: DockMetrics) {
  let growthBefore = 0;
  let totalGrowth = 0;
  metrics.layout.centers.forEach((_, otherIndex) => {
    const growth = growthOf(otherIndex, metrics);
    totalGrowth += growth;
    if (otherIndex < index) {
      growthBefore += growth;
    }
  });
  const ownGrowth = growthOf(index, metrics);
  return growthBefore + ownGrowth / 2 - totalGrowth / 2;
}

function liftOf(index: number, metrics: DockMetrics) {
  const growth = growthOf(index, metrics);
  return -growth;
}

export type MagnifiedDocProps = Omit<ImageTabsProps, 'orientation'>;

function MagnifiedDoc({ className, ...props }: MagnifiedDocProps) {
  return (
    <ImageTabs
      orientation='horizontal'
      className={cn('relative', className)}
      {...props}
    />
  );
}

export type MagnifiedDocDockProps = {
  children: ReactNode;
  className?: string;
  magnification?: number;
  distance?: number;
  'aria-label'?: string;
};

function MagnifiedDocDock({
  children,
  className,
  magnification = 1.6,
  distance = 120,
  'aria-label': ariaLabel,
}: MagnifiedDocDockProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<DockLayout>({ centers: [], sizes: [] });
  const pointerTarget = useMotionValue(0);
  const presenceTarget = useMotionValue(0);
  const pointer = useSpring(pointerTarget, POINTER_SPRING);
  const presence = useSpring(presenceTarget, PRESENCE_SPRING);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const list = listRef.current;
    if (!list) {
      return;
    }
    const remeasure = () => {
      layoutRef.current = measureLayout(list);
    };
    remeasure();
    const observer = new ResizeObserver(remeasure);
    observer.observe(list);
    return () => observer.disconnect();
  }, []);

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) {
      return;
    }
    if (event.pointerType === 'touch') {
      return;
    }
    const listLeft = event.currentTarget.getBoundingClientRect().left;
    const pointerX = event.clientX - listLeft;
    const isResting = presence.get() < RESTING_PRESENCE;
    pointerTarget.set(pointerX);
    if (isResting) {
      pointer.jump(pointerX);
    }
    presenceTarget.set(1);
  };

  const handlePointerLeave = () => {
    presenceTarget.set(0);
  };

  const items = Children.toArray(children);

  return (
    <DockContext.Provider
      value={{ pointer, presence, layoutRef, magnification, distance }}
    >
      <TabsPrimitive.List
        ref={listRef}
        activateOnFocus
        aria-label={ariaLabel}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className={cn(
          'surface-raised absolute bottom-3 left-1/2 z-10 flex w-fit -translate-x-1/2 items-end gap-2 rounded-2xl px-2 pt-2 pb-1',
          className
        )}
      >
        {items.map((item, index) => (
          <DockItemIndexContext.Provider key={index} value={index}>
            {item}
          </DockItemIndexContext.Provider>
        ))}
      </TabsPrimitive.List>
    </DockContext.Provider>
  );
}

export type MagnifiedDocItemProps = {
  value: string;
  label: string;
  children: ReactNode;
  className?: string;
};

function MagnifiedDocItem({
  value,
  label,
  children,
  className,
}: MagnifiedDocItemProps) {
  const index = useContext(DockItemIndexContext);
  const { pointer, presence, layoutRef, magnification, distance } = useDock();

  const metricsOf = (): DockMetrics => ({
    pointerX: pointer.get(),
    presence: presence.get(),
    layout: layoutRef.current,
    magnification,
    distance,
  });

  const scale = useTransform(() => scaleOf(index, metricsOf()));
  const x = useTransform(() => shiftOf(index, metricsOf()));
  const labelY = useTransform(() => liftOf(index, metricsOf()));

  return (
    <motion.div
      data-dock-item=''
      style={{ x }}
      className='group/dock-item relative flex flex-col items-center gap-1'
    >
      <motion.span
        aria-hidden
        style={{ y: labelY }}
        className='surface-raised pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-lg px-2 py-0.5 text-xs font-medium whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover/dock-item:opacity-100 group-has-[:focus-visible]/dock-item:opacity-100'
      >
        {label}
      </motion.span>
      <TabsPrimitive.Tab
        value={value}
        aria-label={label}
        render={<motion.button style={{ scale, originY: 1 }} />}
        className={cn(
          'keycap-3d text-foreground focus-visible:ring-ring focus-visible:ring-offset-background grid size-10 cursor-pointer place-items-center overflow-hidden rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2 [&_svg]:size-5',
          className
        )}
      >
        {children}
      </TabsPrimitive.Tab>
      <span
        aria-hidden
        className='bg-foreground size-1 rounded-full opacity-0 transition-opacity duration-150 group-has-[[data-active]]/dock-item:opacity-100'
      />
    </motion.div>
  );
}

export {
  MagnifiedDoc,
  MagnifiedDocDock,
  MagnifiedDocItem,
  ImageTabsFrame as MagnifiedDocStage,
  ImageTabsPanel as MagnifiedDocPanel,
  ImageTabsImage as MagnifiedDocImage,
};
