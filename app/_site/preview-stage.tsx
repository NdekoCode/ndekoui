'use client';

import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

import { cn } from '@/registry/ndeko/lib/utils';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';

import { offscreenAttributeOf, useOffscreenPause } from './use-offscreen-pause';

type PreviewStageProps = {
  className?: string;
  children: ReactNode;
};

function topOffsetOf(stage: HTMLElement, content: HTMLElement) {
  const stageStyle = window.getComputedStyle(stage);
  const paddingTop = Number.parseFloat(stageStyle.paddingTop);
  const offset = content.offsetTop - paddingTop;
  return Math.max(0, offset);
}

function contentStyleOf(topOffset: number | null): CSSProperties | undefined {
  if (topOffset === null) {
    return undefined;
  }
  return { marginTop: topOffset };
}

function stageAlignmentOf(isAnchored: boolean) {
  if (isAnchored) {
    return 'justify-start';
  }
  return 'justify-center';
}

/**
 * Centres the preview on first paint, then anchors its top edge: a preview that grows or shrinks
 * extends downwards instead of re-centring, so nothing above the change moves. The anchor is only
 * recomputed when the stage width changes, because the layout of the whole row changes with it.
 */
export function PreviewStage({ className, children }: PreviewStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [topOffset, setTopOffset] = useState<number | null>(null);
  const isAnchored = topOffset !== null;
  const isInView = useOffscreenPause(stageRef);

  useLayoutEffect(() => {
    if (isAnchored) {
      return;
    }
    const stage = stageRef.current;
    const content = contentRef.current;
    if (!stage || !content) {
      return;
    }
    setTopOffset(topOffsetOf(stage, content));
  }, [isAnchored]);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }
    let lastWidth = stage.clientWidth;
    const observer = new ResizeObserver(() => {
      const width = stage.clientWidth;
      if (width === lastWidth) {
        return;
      }
      lastWidth = width;
      setTopOffset(null);
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={stageRef}
      data-offscreen={offscreenAttributeOf(isInView)}
      className={cn(
        'relative flex min-w-0 flex-col overflow-x-auto',
        stageAlignmentOf(isAnchored),
        className
      )}
    >
      <div
        ref={contentRef}
        style={contentStyleOf(topOffset)}
        className='flex w-full justify-center-safe'
      >
        <ClockGate isActive={isInView}>{children}</ClockGate>
      </div>
    </div>
  );
}
