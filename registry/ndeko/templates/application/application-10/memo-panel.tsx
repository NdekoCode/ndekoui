'use client';

import { useId } from 'react';

import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { ChevronDownIcon, FileTextIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Fold, Swap } from '@/registry/ndeko/ui/chat-motion';
import { Spinner } from '@/registry/ndeko/ui/spinner';

import {
  MEMO,
  MEMO_TITLE,
  MEMO_WORDS,
  RECEIVERS,
  type MemoSection,
} from './data';
import { WORD_MS, type Stage } from './session';
import { peopleOf } from './share-request';
import { StreamedText } from './stream';
import { useFollowBottom } from './use-follow-bottom';
import { countOf } from './words';

type Progress = {
  sectionsStarted: number;
  sectionsDone: number;
};

function statusOf(stage: Stage, progress: Progress) {
  const { sectionsStarted, sectionsDone } = progress;
  if (sectionsStarted === 0) {
    return 'Written while the agent reads';
  }
  const isWriting = sectionsStarted > sectionsDone;
  if (isWriting) {
    const writingIndex = sectionsStarted - 1;
    const section = MEMO[writingIndex];
    return `Writing ${section.heading}`;
  }
  const isComplete = sectionsDone === MEMO.length;
  if (!isComplete) {
    return 'Reading the next source';
  }
  if (stage === 'shared') {
    const people = peopleOf(RECEIVERS.length);
    return `Shared with ${people}`;
  }
  const words = countOf(MEMO_WORDS, 'word');
  return `Draft ready, ${words}`;
}

function chevronTurnOf(isFolded: boolean) {
  if (isFolded) {
    return '-rotate-90';
  }
  return 'rotate-0';
}

type SectionBlockProps = {
  section: MemoSection;
  isStreaming: boolean;
  isFolded: boolean;
  isPressed: boolean;
  isActive: boolean;
  onToggle: (id: string) => void;
};

function SectionBlock({
  section,
  isStreaming,
  isFolded,
  isPressed,
  isActive,
  onToggle,
}: SectionBlockProps) {
  const bodyId = useId();

  function toggle() {
    onToggle(section.id);
  }

  return (
    <section className='flex flex-col transition-opacity duration-300 starting:opacity-0'>
      <h3 className='flex'>
        <button
          type='button'
          aria-expanded={!isFolded}
          aria-controls={bodyId}
          onClick={toggle}
          className={cn(
            'hover:bg-foreground/[0.04] focus-visible:ring-ring/25 -mx-1.5 flex h-8 flex-1 cursor-pointer items-center gap-1.5 rounded-md px-1.5 text-start text-[13px] font-medium transition-[background-color,scale] duration-150 outline-none focus-visible:ring-[3px] focus-visible:ring-inset',
            pressedQuietOf(isPressed)
          )}
        >
          <ChevronDownIcon
            className={cn(
              'text-muted-foreground size-3.5 shrink-0 transition-transform duration-200 ease-(--ease-out-strong)',
              chevronTurnOf(isFolded)
            )}
          />
          {section.heading}
        </button>
      </h3>
      <Fold open={!isFolded} id={bodyId}>
        <p className='text-foreground/85 ps-5 pb-2 text-[13px] leading-relaxed'>
          <StreamedText
            text={section.text}
            isStreaming={isStreaming}
            isActive={isActive}
            wordMs={WORD_MS}
          />
        </p>
      </Fold>
    </section>
  );
}

export type MemoPanelProps = Progress & {
  stage: Stage;
  foldedSections: string[];
  stepInProgress: string | null;
  pressed: string | null;
  isActive: boolean;
  onToggleSection: (id: string) => void;
  className?: string;
};

export function MemoPanel({
  stage,
  sectionsStarted,
  sectionsDone,
  foldedSections,
  stepInProgress,
  pressed,
  isActive,
  onToggleSection,
  className,
}: MemoPanelProps) {
  const { scrollerRef, contentRef, updatePinned } = useFollowBottom();
  const status = statusOf(stage, { sectionsStarted, sectionsDone });
  const sections = MEMO.slice(0, sectionsStarted);
  const isEmpty = sectionsStarted === 0;

  return (
    <div className={cn('flex min-h-0 flex-col gap-3', className)}>
      <header className='flex items-center gap-2.5'>
        <span
          aria-hidden='true'
          className='keycap-3d text-muted-foreground inline-flex size-7 shrink-0 items-center justify-center rounded-md'
        >
          <FileTextIcon className='size-3.5' />
        </span>
        <div className='flex min-w-0 flex-1 flex-col leading-tight'>
          <h2 className='truncate text-sm font-medium'>{MEMO_TITLE}</h2>
          <Swap swapKey={status} className='text-muted-foreground text-xs'>
            {status}
          </Swap>
        </div>
      </header>

      {stepInProgress && (
        <p className='bg-foreground/[0.04] text-muted-foreground flex h-8 shrink-0 items-center gap-2 overflow-hidden rounded-lg px-2.5 text-xs'>
          <Spinner aria-hidden='true' className='[&_svg]:size-3.5' />
          <Swap swapKey={stepInProgress}>{stepInProgress}</Swap>
        </p>
      )}

      <div
        ref={scrollerRef}
        onScroll={updatePinned}
        className='-mx-1.5 min-h-0 flex-1 overflow-y-auto px-1.5'
      >
        <div ref={contentRef} className='flex flex-col gap-1'>
          {isEmpty && (
            <p className='text-muted-foreground text-[13px] leading-relaxed'>
              Nothing written yet. Each section appears here as the agent reads
              the source it comes from.
            </p>
          )}
          {sections.map((section, index) => {
            const pressKey = `section-${section.id}`;
            return (
              <SectionBlock
                key={section.id}
                section={section}
                isStreaming={index >= sectionsDone}
                isFolded={foldedSections.includes(section.id)}
                isPressed={pressed === pressKey}
                isActive={isActive}
                onToggle={onToggleSection}
              />
            );
          })}
        </div>
      </div>

      <footer className='flex shrink-0 items-center gap-2'>
        <Badge variant='secondary'>Illustrative figures</Badge>
      </footer>
    </div>
  );
}
