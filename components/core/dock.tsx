'use client';

import {
  motion,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
  type SpringOptions,
  AnimatePresence,
  MotionConfig,
} from 'motion/react';
import {
  Children,
  cloneElement,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';

const DOCK_HEIGHT = 128;
const DEFAULT_MAGNIFICATION = 80;
const DEFAULT_DISTANCE = 150;
const DEFAULT_PANEL_HEIGHT = 64;
const DEFAULT_ITEM_SIZE = 40;

export type DockProps = {
  children: React.ReactNode;
  className?: string;
  distance?: number;
  panelHeight?: number;
  magnification?: number;
  itemSize?: number;
  disableMagnification?: boolean;
  spring?: SpringOptions;
};

export type DockItemProps = {
  className?: string;
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
};

export type DockSeparatorProps = {
  className?: string;
};

type DockChildProps = {
  width?: MotionValue<number>;
  isHovered?: MotionValue<number>;
};

export type DockLabelProps = {
  className?: string;
  children: React.ReactNode;
};

export type DockIconProps = {
  className?: string;
  children: React.ReactNode;
};

export type DocContextType = {
  mouseX: MotionValue;
  spring: SpringOptions;
  magnification: number;
  distance: number;
  itemSize?: number;
};

export type DockProviderProps = {
  children: React.ReactNode;
  value: DocContextType;
};

const DockContext = createContext<DocContextType | undefined>(undefined);

function ReducedMotionConfig({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  if (!prefersReducedMotion) {
    return children;
  }
  return <MotionConfig reducedMotion='always'>{children}</MotionConfig>;
}

function followerOf(
  prefersReducedMotion: boolean | null,
  target: MotionValue<number>,
  spring: MotionValue<number>
) {
  if (prefersReducedMotion) {
    return target;
  }
  return spring;
}

function peakWidthOf(
  disableMagnification: boolean,
  magnification: number,
  itemSize: number
) {
  if (disableMagnification) {
    return itemSize;
  }
  return magnification;
}

function isActivationKey(key: string) {
  return key === 'Enter' || key === ' ';
}

function DockProvider({ children, value }: DockProviderProps) {
  return <DockContext.Provider value={value}>{children}</DockContext.Provider>;
}

function useDock() {
  const context = useContext(DockContext);
  if (!context) {
    throw new Error('useDock must be used within an DockProvider');
  }
  return context;
}

function Dock({
  children,
  className,
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = DEFAULT_MAGNIFICATION,
  distance = DEFAULT_DISTANCE,
  panelHeight = DEFAULT_PANEL_HEIGHT,
  itemSize = DEFAULT_ITEM_SIZE,
  disableMagnification = false,
}: DockProps) {
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);
  const prefersReducedMotion = usePrefersReducedMotion();
  const peakWidth = peakWidthOf(disableMagnification, magnification, itemSize);

  const maxHeight = useMemo(() => {
    return Math.max(DOCK_HEIGHT, magnification + magnification / 2 + 4);
  }, [magnification]);

  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
  const heightSpring = useSpring(heightRow, spring);
  const height = followerOf(prefersReducedMotion, heightRow, heightSpring);

  return (
    <ReducedMotionConfig>
      <motion.div
        style={{
          height: height,
          scrollbarWidth: 'none',
        }}
        className='mx-2 flex max-w-full items-end overflow-x-auto'
      >
        <motion.div
          onMouseMove={({ clientX }) => {
            isHovered.set(1);
            mouseX.set(clientX);
          }}
          onMouseLeave={() => {
            isHovered.set(0);
            mouseX.set(Infinity);
          }}
          className={cn(
            'bg-card hairline-ring ring-border mx-auto flex w-fit gap-4 rounded-2xl px-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
            className
          )}
          style={{ height: panelHeight }}
          role='toolbar'
          aria-label='Application dock'
        >
          <DockProvider
            value={{
              mouseX,
              spring,
              distance,
              magnification: peakWidth,
              itemSize,
            }}
          >
            {children}
          </DockProvider>
        </motion.div>
      </motion.div>
    </ReducedMotionConfig>
  );
}

function DockItem({ children, className, href, onClick }: DockItemProps) {
  const ref = useRef<HTMLElement>(null);

  const {
    distance,
    magnification,
    mouseX,
    spring,
    itemSize = DEFAULT_ITEM_SIZE,
  } = useDock();
  const prefersReducedMotion = usePrefersReducedMotion();

  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mouseX, (val) => {
    const domRect = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - domRect.x - domRect.width / 2;
  });

  const widthTransform = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [itemSize, magnification, itemSize]
  );

  const widthSpring = useSpring(widthTransform, spring);
  const width = followerOf(prefersReducedMotion, widthTransform, widthSpring);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isActivationKey(event.key)) {
      return;
    }
    event.preventDefault();
    onClick?.();
  };

  const itemProps = {
    style: { width },
    onHoverStart: () => isHovered.set(1),
    onHoverEnd: () => isHovered.set(0),
    onFocus: () => isHovered.set(1),
    onBlur: () => isHovered.set(0),
    className: cn(
      'relative inline-flex items-center justify-center',
      className
    ),
  };

  const content = Children.map(children, (child) =>
    cloneElement(child as React.ReactElement<DockChildProps>, {
      width,
      isHovered,
    })
  );

  if (href) {
    return (
      <motion.a
        ref={ref as React.RefObject<HTMLAnchorElement | null>}
        href={href}
        onClick={onClick}
        {...itemProps}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement | null>}
      tabIndex={0}
      role='button'
      onClick={onClick}
      onKeyDown={handleKeyDown}
      {...itemProps}
    >
      {content}
    </motion.div>
  );
}

function DockLabel({ children, className, ...rest }: DockLabelProps) {
  const restProps = rest as Record<string, unknown>;
  const isHovered = restProps['isHovered'] as MotionValue<number>;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = isHovered.on('change', (latest) => {
      setIsVisible(latest === 1);
    });

    return () => unsubscribe();
  }, [isHovered]);

  return (
    <>
      <span className='sr-only'>{children}</span>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: -10 }}
            exit={{ opacity: 0, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'surface-raised absolute -top-6 left-1/2 w-fit rounded-lg px-2 py-0.5 text-xs font-medium whitespace-pre',
              className
            )}
            aria-hidden='true'
            style={{ x: '-50%' }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function DockSeparator({ className }: DockSeparatorProps) {
  return (
    <div
      role='separator'
      aria-orientation='vertical'
      className={cn(
        'hairline-l border-border h-8 shrink-0 self-center',
        className
      )}
    />
  );
}

function DockIcon({ children, className, ...rest }: DockIconProps) {
  const restProps = rest as Record<string, unknown>;
  const width = restProps['width'] as MotionValue<number>;

  const widthTransform = useTransform(width, (val) => val / 2);

  return (
    <motion.div
      style={{ width: widthTransform }}
      className={cn('flex items-center justify-center', className)}
    >
      {children}
    </motion.div>
  );
}

export { Dock, DockIcon, DockItem, DockLabel, DockSeparator };
