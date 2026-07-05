// Adapted from prompt-kit (MIT, Copyright (c) 2025 Julien Thibeaut).
'use client';

import { motion, type Transition } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';
import { Spinner } from '@/registry/ndeko/ui/spinner';

type LoaderSize = 'sm' | 'md' | 'lg';

type LoaderVariant = 'spinner' | 'dots' | 'pulse' | 'bars' | 'text';

type LoaderPartProps = {
  size?: LoaderSize;
  className?: string;
  label?: string;
};

const DEFAULT_LABEL = 'Thinking';

const BREATH: Transition = {
  duration: 1.2,
  repeat: Infinity,
  ease: 'easeInOut',
};

const SLOW_BREATH: Transition = {
  duration: 2,
  repeat: Infinity,
  ease: 'easeInOut',
};

const STAGGER_SECONDS = 0.16;

const PARTS = [0, 1, 2] as const;

const BAR_PARTS = [0, 1, 2, 3] as const;

function staggered(index: number, transition: Transition): Transition {
  const delay = index * STAGGER_SECONDS;
  return { ...transition, delay };
}

const SPINNER_SIZE: Record<LoaderSize, string> = {
  sm: '[&_svg]:size-3.5',
  md: '[&_svg]:size-4',
  lg: '[&_svg]:size-5',
};

function SpinnerLoader({ size = 'md', className, label }: LoaderPartProps) {
  const spinnerSize = SPINNER_SIZE[size];
  return (
    <Spinner
      label={label ?? DEFAULT_LABEL}
      className={cn(spinnerSize, className)}
    />
  );
}

const DOT_SIZE: Record<LoaderSize, string> = {
  sm: 'size-1',
  md: 'size-1.5',
  lg: 'size-2',
};

const BOX_HEIGHT: Record<LoaderSize, string> = {
  sm: 'h-4',
  md: 'h-5',
  lg: 'h-6',
};

/** Opacity only, so it keeps breathing under reduced motion like a spinner keeps turning. */
function DotsLoader({ size = 'md', className, label }: LoaderPartProps) {
  return (
    <span
      role='status'
      aria-label={label ?? DEFAULT_LABEL}
      className={cn(
        'inline-flex items-center gap-1',
        BOX_HEIGHT[size],
        className
      )}
    >
      {PARTS.map((index) => (
        <motion.span
          key={index}
          aria-hidden='true'
          className={cn('bg-muted-foreground rounded-full', DOT_SIZE[size])}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={staggered(index, BREATH)}
        />
      ))}
    </span>
  );
}

const PULSE_SIZE: Record<LoaderSize, string> = {
  sm: 'size-2',
  md: 'size-2.5',
  lg: 'size-3',
};

function pulseKeyframesOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return { opacity: [0.45, 1, 0.45] };
  }
  return { opacity: [0.45, 1, 0.45], scale: [0.85, 1, 0.85] };
}

function PulseDotLoader({ size = 'md', className, label }: LoaderPartProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const keyframes = pulseKeyframesOf(shouldReduceMotion);

  return (
    <span
      role='status'
      aria-label={label ?? DEFAULT_LABEL}
      className={cn('inline-flex items-center', BOX_HEIGHT[size], className)}
    >
      <motion.span
        aria-hidden='true'
        className={cn('bg-primary rounded-full', PULSE_SIZE[size])}
        animate={keyframes}
        transition={BREATH}
      />
    </span>
  );
}

const BAR_WIDTH: Record<LoaderSize, string> = {
  sm: 'w-0.5',
  md: 'w-[3px]',
  lg: 'w-1',
};

function barKeyframesOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return { opacity: [0.35, 1, 0.35] };
  }
  return { scaleY: [0.4, 1, 0.4], opacity: [0.5, 1, 0.5] };
}

function BarsLoader({ size = 'md', className, label }: LoaderPartProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const keyframes = barKeyframesOf(shouldReduceMotion);

  return (
    <span
      role='status'
      aria-label={label ?? DEFAULT_LABEL}
      className={cn(
        'inline-flex items-center gap-0.5',
        BOX_HEIGHT[size],
        className
      )}
    >
      {BAR_PARTS.map((index) => (
        <motion.span
          key={index}
          aria-hidden='true'
          className={cn(
            'bg-muted-foreground h-full rounded-full',
            BAR_WIDTH[size]
          )}
          animate={keyframes}
          transition={staggered(index, BREATH)}
        />
      ))}
    </span>
  );
}

const TEXT_SIZE: Record<LoaderSize, string> = {
  sm: 'text-xs',
  md: 'text-[13px]',
  lg: 'text-sm',
};

type TextLoaderProps = Omit<LoaderPartProps, 'label'> & {
  text?: string;
};

function TextLoader({
  text = DEFAULT_LABEL,
  size = 'md',
  className,
}: TextLoaderProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const classNames = cn(
    'text-muted-foreground inline-block font-medium',
    TEXT_SIZE[size],
    className
  );

  if (shouldReduceMotion) {
    return (
      <span role='status' className={classNames}>
        {text}
      </span>
    );
  }

  return (
    <motion.span
      role='status'
      className={classNames}
      initial={{ opacity: 1 }}
      animate={{ opacity: [1, 0.45, 1] }}
      transition={SLOW_BREATH}
    >
      {text}
    </motion.span>
  );
}

type LoaderProps = {
  variant?: LoaderVariant;
  size?: LoaderSize;
  /** The visible word of the `text` variant, and the accessible name of the others. */
  text?: string;
  className?: string;
};

function Loader({
  variant = 'spinner',
  size = 'md',
  text,
  className,
}: LoaderProps) {
  if (variant === 'dots') {
    return <DotsLoader size={size} label={text} className={className} />;
  }
  if (variant === 'pulse') {
    return <PulseDotLoader size={size} label={text} className={className} />;
  }
  if (variant === 'bars') {
    return <BarsLoader size={size} label={text} className={className} />;
  }
  if (variant === 'text') {
    return <TextLoader size={size} text={text} className={className} />;
  }
  return <SpinnerLoader size={size} label={text} className={className} />;
}

export {
  BarsLoader,
  DotsLoader,
  Loader,
  PulseDotLoader,
  SpinnerLoader,
  TextLoader,
  type LoaderProps,
  type LoaderSize,
  type LoaderVariant,
};
