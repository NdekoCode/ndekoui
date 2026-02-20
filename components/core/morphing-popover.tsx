'use client';

import {
  useState,
  useId,
  useRef,
  useEffect,
  createContext,
  createElement,
  useContext,
  isValidElement,
} from 'react';
import {
  AnimatePresence,
  MotionConfig,
  motion,
  Transition,
  useReducedMotion,
  Variants,
} from 'motion/react';
import useClickOutside from '@/hooks/useClickOutside';
import { cn } from '@/lib/utils';

const TRANSITION = {
  type: 'spring' as const,
  bounce: 0.1,
  duration: 0.4,
};

type MorphingPopoverContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  uniqueId: string;
  variants?: Variants;
};

type MorphingChildProps = Record<string, unknown>;

const motionTriggers = new Map<
  React.ElementType,
  React.ElementType<MorphingChildProps>
>();

// motion.create returns a new component on every call; one per element type keeps the trigger mounted across renders.
function motionTriggerFor(type: React.ElementType) {
  const cached = motionTriggers.get(type);
  if (cached) {
    return cached;
  }
  const created = motion.create(
    type as React.ComponentType<MorphingChildProps>
  ) as React.ElementType<MorphingChildProps>;
  motionTriggers.set(type, created);
  return created;
}

function ReducedMotionConfig({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion();
  if (!prefersReducedMotion) {
    return children;
  }
  return <MotionConfig reducedMotion='always'>{children}</MotionConfig>;
}

const MorphingPopoverContext =
  createContext<MorphingPopoverContextValue | null>(null);

function usePopoverLogic({
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
}: {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
} = {}) {
  const uniqueId = useId();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);

  const isOpen = controlledOpen ?? uncontrolledOpen;

  const open = () => {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(true);
    }
    onOpenChange?.(true);
  };

  const close = () => {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(false);
    }
    onOpenChange?.(false);
  };

  return { isOpen, open, close, uniqueId };
}

export type MorphingPopoverProps = {
  children: React.ReactNode;
  transition?: Transition;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  variants?: Variants;
  className?: string;
} & React.ComponentProps<'div'>;

function MorphingPopover({
  children,
  transition = TRANSITION,
  defaultOpen,
  open,
  onOpenChange,
  variants,
  className,
  ...props
}: MorphingPopoverProps) {
  const popoverLogic = usePopoverLogic({ defaultOpen, open, onOpenChange });

  return (
    <MorphingPopoverContext.Provider value={{ ...popoverLogic, variants }}>
      <ReducedMotionConfig>
        <MotionConfig transition={transition}>
          <div
            className={cn(
              'relative flex items-center justify-center',
              className
            )}
            key={popoverLogic.uniqueId}
            {...props}
          >
            {children}
          </div>
        </MotionConfig>
      </ReducedMotionConfig>
    </MorphingPopoverContext.Provider>
  );
}

export type MorphingPopoverTriggerProps = {
  asChild?: boolean;
  children: React.ReactNode;
  className?: string;
} & React.ComponentProps<typeof motion.button>;

function MorphingPopoverTrigger({
  children,
  className,
  asChild = false,
  ...props
}: MorphingPopoverTriggerProps) {
  const context = useContext(MorphingPopoverContext);
  if (!context) {
    throw new Error(
      'MorphingPopoverTrigger must be used within MorphingPopover'
    );
  }

  const shouldMergeIntoChild = asChild && isValidElement(children);
  if (shouldMergeIntoChild) {
    const childProps = children.props as MorphingChildProps;
    const childType = children.type as React.ElementType;

    return createElement(motionTriggerFor(childType), {
      ...childProps,
      onClick: context.open,
      layoutId: `popover-trigger-${context.uniqueId}`,
      className: childProps.className,
      key: context.uniqueId,
      'aria-expanded': context.isOpen,
      'aria-controls': `popover-content-${context.uniqueId}`,
    });
  }

  return (
    <motion.div
      key={context.uniqueId}
      layoutId={`popover-trigger-${context.uniqueId}`}
      onClick={context.open}
    >
      <motion.button
        {...props}
        layoutId={`popover-label-${context.uniqueId}`}
        key={context.uniqueId}
        className={className}
        aria-expanded={context.isOpen}
        aria-controls={`popover-content-${context.uniqueId}`}
      >
        {children}
      </motion.button>
    </motion.div>
  );
}

export type MorphingPopoverContentProps = {
  children: React.ReactNode;
  className?: string;
} & React.ComponentProps<typeof motion.div>;

function MorphingPopoverContent({
  children,
  className,
  ...props
}: MorphingPopoverContentProps) {
  const context = useContext(MorphingPopoverContext);
  if (!context)
    throw new Error(
      'MorphingPopoverContent must be used within MorphingPopover'
    );

  const ref = useRef<HTMLDivElement>(null);
  const { isOpen, close } = context;
  useClickOutside(ref, close);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  return (
    <AnimatePresence>
      {context.isOpen && (
        <>
          <motion.div
            {...props}
            ref={ref}
            layoutId={`popover-trigger-${context.uniqueId}`}
            key={context.uniqueId}
            id={`popover-content-${context.uniqueId}`}
            role='dialog'
            aria-modal='true'
            className={cn(
              'surface-raised absolute overflow-hidden rounded-xl p-2',
              className
            )}
            initial='initial'
            animate='animate'
            exit='exit'
            variants={context.variants}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export { MorphingPopover, MorphingPopoverTrigger, MorphingPopoverContent };
