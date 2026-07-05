'use client';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  AnimatePresence,
  MotionConfig,
  Transition,
  motion,
} from 'motion/react';
import {
  Children,
  cloneElement,
  ReactElement,
  ReactNode,
  useState,
  useId,
} from 'react';

export type AnimatedBackgroundProps = {
  children:
    ReactElement<{ 'data-id': string }>[] | ReactElement<{ 'data-id': string }>;
  defaultValue?: string;
  onValueChange?: (newActiveId: string | null) => void;
  className?: string;
  transition?: Transition;
  enableHover?: boolean;
};

type AnimatedBackgroundChild = ReactElement<
  {
    'data-id': string;
    className?: string;
    children?: ReactNode;
  } & Record<string, unknown>
>;

function ReducedMotionConfig({ children }: { children: ReactNode }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  if (!prefersReducedMotion) {
    return children;
  }
  return <MotionConfig reducedMotion='always'>{children}</MotionConfig>;
}

function initialOpacityOf(defaultValue?: string) {
  if (defaultValue) {
    return 1;
  }
  return 0;
}

export function AnimatedBackground({
  children,
  defaultValue,
  onValueChange,
  className,
  transition,
  enableHover = false,
}: AnimatedBackgroundProps) {
  const [activeId, setActiveId] = useState<string | null>(defaultValue ?? null);
  const [syncedDefaultValue, setSyncedDefaultValue] = useState(defaultValue);
  const uniqueId = useId();

  const hasNewDefaultValue = defaultValue !== syncedDefaultValue;
  if (hasNewDefaultValue) {
    setSyncedDefaultValue(defaultValue);
    if (defaultValue !== undefined) {
      setActiveId(defaultValue);
    }
  }

  const handleSetActiveId = (id: string | null) => {
    setActiveId(id);

    if (onValueChange) {
      onValueChange(id);
    }
  };

  const interactionPropsOf = (id: string) => {
    if (enableHover) {
      return {
        onMouseEnter: () => handleSetActiveId(id),
        onMouseLeave: () => handleSetActiveId(null),
      };
    }
    return {
      onClick: () => handleSetActiveId(id),
    };
  };

  const initialOpacity = initialOpacityOf(defaultValue);

  return (
    <ReducedMotionConfig>
      {Children.map(children, (child, index) => {
        const element = child as AnimatedBackgroundChild;
        const id = element.props['data-id'];
        const isActive = activeId === id;

        return cloneElement(
          element,
          {
            key: index,
            className: cn('relative inline-flex', element.props.className),
            'data-checked': String(isActive),
            ...interactionPropsOf(id),
          },
          <>
            <AnimatePresence initial={false}>
              {isActive && (
                <motion.div
                  layoutId={`background-${uniqueId}`}
                  className={cn('absolute inset-0', className)}
                  transition={transition}
                  initial={{ opacity: initialOpacity }}
                  animate={{
                    opacity: 1,
                  }}
                  exit={{
                    opacity: 0,
                  }}
                />
              )}
            </AnimatePresence>
            <div className='z-10'>{element.props.children}</div>
          </>
        );
      })}
    </ReducedMotionConfig>
  );
}
