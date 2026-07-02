'use client';

import { ClaudeCodeMark } from '@/app/mcp/_components/client-marks';
import { PauseIcon, PlayIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';

import { ChapterBar } from './chapter-bar';
import { ProjectPane, type ReplayCode } from './project-pane';
import {
  CHAPTERS,
  chapterIndexAt,
  PROJECT_NAME,
  TOTAL_MS,
} from './replay-script';
import { SessionPane } from './session-pane';
import { useReplayClock } from './use-replay-clock';

/** From this chapter on, a phone shows the project instead of the conversation. */
const PROJECT_CHAPTER_INDEX = 3;

function PlayToggle({
  isPlaying,
  onToggle,
}: {
  isPlaying: boolean;
  onToggle: () => void;
}) {
  if (isPlaying) {
    return (
      <Button
        variant='ghost'
        size='icon-sm'
        aria-label='Pause the replay'
        onClick={onToggle}
        className='text-muted-foreground'
      >
        <PauseIcon />
      </Button>
    );
  }
  return (
    <Button
      variant='ghost'
      size='icon-sm'
      aria-label='Play the replay'
      onClick={onToggle}
      className='text-muted-foreground'
    >
      <PlayIcon />
    </Button>
  );
}

/**
 * A session in Claude Code played like a video: the prompt, the ndekoui tools, the shadcn command,
 * and the project changing beside it until the component is on the page.
 */
export function ProjectReplay({ code }: { code: ReplayCode }) {
  const { elapsed, isPlaying, isStill, setStage, togglePlaying, seek } =
    useReplayClock(TOTAL_MS);
  const activeIndex = chapterIndexAt(elapsed);
  const isProjectChapter = activeIndex >= PROJECT_CHAPTER_INDEX;

  /** A still replay shows where a chapter ends; a playing one starts it from its beginning. */
  function seekToChapter(index: number) {
    const chapter = CHAPTERS[index];
    if (isStill) {
      seek(chapter.endMs - 1);
      return;
    }
    seek(chapter.startMs);
  }

  return (
    <div className='flex flex-col gap-8'>
      <div
        ref={setStage}
        className='dark bg-card text-foreground hairline-ring ring-border overflow-hidden rounded-2xl shadow-[0_24px_48px_-24px_rgb(0_0_0/0.35)]'
      >
        <div className='flex h-11 items-center gap-2.5 ps-4 pe-2'>
          <ClaudeCodeMark className='size-4' />
          <p className='text-[13px] font-medium'>Claude Code</p>
          <p className='text-muted-foreground min-w-0 flex-1 truncate font-mono text-xs'>
            {`~/${PROJECT_NAME}`}
          </p>
          {!isStill && (
            <PlayToggle isPlaying={isPlaying} onToggle={togglePlaying} />
          )}
        </div>
        <div className='grid h-[26rem] md:h-[30rem] md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]'>
          <div className={cn('min-h-0', isProjectChapter && 'max-md:hidden')}>
            <SessionPane elapsed={elapsed} />
          </div>
          <div className={cn('min-h-0', !isProjectChapter && 'max-md:hidden')}>
            <ProjectPane elapsed={elapsed} code={code} />
          </div>
        </div>
      </div>
      <ChapterBar
        elapsed={elapsed}
        activeIndex={activeIndex}
        onSeek={seekToChapter}
      />
    </div>
  );
}
