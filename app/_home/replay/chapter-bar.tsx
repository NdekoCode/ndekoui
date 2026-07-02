import type { CSSProperties } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

import { type Chapter, CHAPTERS, chapterProgressOf } from './replay-script';

function fillStyleOf(progress: number): CSSProperties {
  return { transform: `scaleX(${progress})` };
}

function currentOf(isActive: boolean) {
  if (isActive) {
    return 'step';
  }
  return undefined;
}

function numberOf(index: number) {
  const position = index + 1;
  return String(position).padStart(2, '0');
}

type ChapterButtonProps = {
  chapter: Chapter;
  index: number;
  elapsed: number;
  isActive: boolean;
  onSeek: (index: number) => void;
};

function ChapterButton({
  chapter,
  index,
  elapsed,
  isActive,
  onSeek,
}: ChapterButtonProps) {
  const progress = chapterProgressOf(chapter, elapsed);

  function seekToChapter() {
    onSeek(index);
  }

  return (
    <li>
      <button
        type='button'
        aria-current={currentOf(isActive)}
        onClick={seekToChapter}
        className='group focus-visible:ring-ring/50 flex w-full flex-col gap-3 rounded-md text-left outline-none focus-visible:ring-[3px]'
      >
        <span className='bg-foreground/10 block h-0.5 w-full overflow-hidden rounded-full'>
          <span
            style={fillStyleOf(progress)}
            className='bg-primary block h-full origin-left rounded-full'
          />
        </span>
        <span className='flex flex-col gap-1'>
          <span
            className={cn(
              'flex items-baseline gap-2 text-sm font-medium transition-colors duration-150',
              !isActive && 'text-muted-foreground group-hover:text-foreground'
            )}
          >
            <span className='text-muted-foreground font-mono text-xs tabular-nums'>
              {numberOf(index)}
            </span>
            {chapter.title}
          </span>
          <span className='text-muted-foreground text-sm text-pretty'>
            {chapter.detail}
          </span>
        </span>
      </button>
    </li>
  );
}

type ChapterBarProps = {
  elapsed: number;
  activeIndex: number;
  onSeek: (index: number) => void;
};

/** The chapters of the replay, as under a video: each fills while it plays and jumps there on a click. */
export function ChapterBar({ elapsed, activeIndex, onSeek }: ChapterBarProps) {
  return (
    <ol
      aria-label='Chapters of the replay'
      className='grid grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-4'
    >
      {CHAPTERS.map((chapter, index) => (
        <ChapterButton
          key={chapter.id}
          chapter={chapter}
          index={index}
          elapsed={elapsed}
          isActive={index === activeIndex}
          onSeek={onSeek}
        />
      ))}
    </ol>
  );
}
