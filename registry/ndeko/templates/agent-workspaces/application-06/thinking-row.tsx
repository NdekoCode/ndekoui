'use client';

import { useId, useState } from 'react';

import { WordRoll } from '@/components/core/word-roll';
import { elapsedOf, formatDuration } from '@/registry/ndeko/lib/agent-run';
import { BrainIcon, ChevronDownIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Fold } from '@/registry/ndeko/ui/chat-motion';
import { LiveDuration } from '@/registry/ndeko/ui/live-duration';
import { StreamedText } from '@/registry/ndeko/ui/streamed-text';

import { EFFORT_WORD, type Effort } from './data';
import { WORD_MS, type TurnStage } from './session';

function headlineOf(isThinking: boolean, duration: string, effort: Effort) {
  if (isThinking) {
    return 'Thinking';
  }
  const word = EFFORT_WORD[effort].toLowerCase();
  return `Thought for ${duration}, ${word} effort`;
}

function chevronTurnOf(isOpen: boolean) {
  if (isOpen) {
    return 'rotate-180';
  }
  return 'rotate-0';
}

type ThinkingRowProps = {
  text: string;
  stage: TurnStage;
  effort: Effort;
  isActive: boolean;
  startedAt: number;
  thoughtEndedAt?: number;
};

export function ThinkingRow({
  text,
  stage,
  effort,
  isActive,
  startedAt,
  thoughtEndedAt,
}: ThinkingRowProps) {
  const [openChoice, setOpenChoice] = useState<boolean | null>(null);
  const [wasThinking, setWasThinking] = useState(stage === 'thinking');
  const panelId = useId();
  const isThinking = stage === 'thinking';
  const span = { startedAt, endedAt: thoughtEndedAt };
  const elapsed = elapsedOf(span, thoughtEndedAt ?? 0);
  const duration = formatDuration(elapsed);
  const headline = headlineOf(isThinking, duration, effort);

  if (wasThinking !== isThinking) {
    setWasThinking(isThinking);
    setOpenChoice(null);
  }

  const isOpen = openChoice ?? isThinking;

  function toggle() {
    setOpenChoice(!isOpen);
  }

  return (
    <div className='bg-foreground/[0.03] dark:bg-foreground/[0.05] rounded-xl p-1.5'>
      <button
        type='button'
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={toggle}
        className='hover:bg-foreground/[0.04] focus-visible:ring-ring/25 flex h-8 w-full cursor-pointer items-center gap-2 rounded-lg px-2 text-start text-[13px] outline-none focus-visible:ring-[3px]'
      >
        <BrainIcon className='text-muted-foreground size-4 shrink-0' />
        <span className='min-w-0 truncate font-medium'>
          <WordRoll text={headline} />
        </span>
        {isThinking && (
          <LiveDuration
            item={span}
            isRunning
            className='text-muted-foreground w-10 text-xs'
          />
        )}
        <ChevronDownIcon
          className={cn(
            'text-muted-foreground ms-auto size-3.5 shrink-0 transition-transform duration-200 ease-(--ease-out-strong)',
            chevronTurnOf(isOpen)
          )}
        />
      </button>
      <Fold open={isOpen} id={panelId}>
        <p className='text-muted-foreground px-2 pt-1.5 pb-2 text-[13px] leading-relaxed'>
          <StreamedText
            text={text}
            isStreaming={isThinking}
            isActive={isActive}
            wordMs={WORD_MS}
          />
        </p>
      </Fold>
    </div>
  );
}
