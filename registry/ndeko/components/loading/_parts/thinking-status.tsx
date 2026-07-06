'use client';

import type { ReactNode, Ref } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

import { ShimmerLabel } from './shimmer-label';

export type ThinkingSize = 'sm' | 'md' | 'lg';

export type ThinkingIndicatorProps = {
  /** What the agent is doing, beside the mark and read by screen readers: Thinking, Reading the brief. */
  label?: string;
  /** `sm` sits in a line of small text, `md` in a message, `lg` alone. */
  size?: ThinkingSize;
  /** The work is over: the mark lands on its done state and the label stops shimmering. */
  isDone?: boolean;
  className?: string;
};

export const DEFAULT_LABEL = 'Thinking';

/** The mark is as tall as one line of its label, so a label that wraps keeps the mark on its first line. */
export const MARK_BOX: Record<ThinkingSize, string> = {
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-6',
};

const LABEL_TYPE: Record<ThinkingSize, string> = {
  sm: 'text-xs leading-4',
  md: 'text-[13px] leading-5',
  lg: 'text-sm leading-6',
};

const ROW_GAP: Record<ThinkingSize, string> = {
  sm: 'gap-1.5',
  md: 'gap-2',
  lg: 'gap-2.5',
};

type ThinkingStatusProps = {
  ref: Ref<HTMLSpanElement>;
  label: string;
  size: ThinkingSize;
  isDone: boolean;
  canLoop: boolean;
  isPlaying: boolean;
  /** False for a mark shown alone: the label is still read by screen readers. */
  showsLabel?: boolean;
  className?: string;
  /** The mark, hidden from screen readers. */
  children: ReactNode;
};

/** A mark and its label in one status, so a change of label or the end of the work is said once. */
export function ThinkingStatus({
  ref,
  label,
  size,
  isDone,
  canLoop,
  isPlaying,
  showsLabel = true,
  className,
  children,
}: ThinkingStatusProps) {
  return (
    <span
      ref={ref}
      role='status'
      className={cn(
        'inline-flex max-w-full min-w-0 items-start align-top',
        ROW_GAP[size],
        className
      )}
    >
      {children}
      <span className='sr-only'>{label}</span>
      {showsLabel && (
        <ShimmerLabel
          text={label}
          isDone={isDone}
          canLoop={canLoop}
          isPlaying={isPlaying}
          className={LABEL_TYPE[size]}
        />
      )}
    </span>
  );
}
