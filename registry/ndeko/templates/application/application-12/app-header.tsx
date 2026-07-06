'use client';

import { WordRoll } from '@/components/core/word-roll';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { REPOSITORY, type StepId } from './data';
import type { CodingState, Stage } from './session';

const WORKING_WORD: Record<StepId, string> = {
  read: 'Reading the code',
  reproduce: 'Reproducing the bug',
  edit: 'Writing the fix',
  verify: 'Running the tests',
  preview: 'Checking the page',
};

const STAGE_WORD: Record<Stage, string> = {
  idle: 'Ready',
  working: 'Working',
  answering: 'Answering',
  asking: 'Waiting on you',
  opening: 'Opening the pull request',
  opened: 'Done',
  declined: 'Done',
};

const WORKING_WORDS = Object.values(WORKING_WORD);

const STAGE_WORDS = Object.values(STAGE_WORD);

const STATUS_WORDS = [...WORKING_WORDS, ...STAGE_WORDS];

const STATUS_DOT: Record<Stage, string> = {
  idle: 'bg-muted-foreground/45',
  working: 'bg-info',
  answering: 'bg-info',
  asking: 'bg-warning',
  opening: 'bg-info',
  opened: 'bg-success',
  declined: 'bg-success',
};

const LIVE_STAGES: Stage[] = ['working', 'answering', 'opening'];

function statusOf(state: CodingState) {
  if (state.stage !== 'working') {
    return STAGE_WORD[state.stage];
  }
  const running = state.steps.find((run) => run.status === 'running');
  if (!running) {
    return STAGE_WORD.working;
  }
  return WORKING_WORD[running.id];
}

function pulseOf(stage: Stage) {
  if (LIVE_STAGES.includes(stage)) {
    return 'animate-pulse';
  }
  return undefined;
}

type AppHeaderProps = {
  state: CodingState;
  canReplay: boolean;
  onReplay: () => void;
  onOpenWork: () => void;
};

export function AppHeader({
  state,
  canReplay,
  onReplay,
  onOpenWork,
}: AppHeaderProps) {
  const { stage } = state;

  return (
    <header className='flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5'>
      <div className='flex min-w-40 flex-1 items-center gap-2.5'>
        <span
          aria-hidden='true'
          className='gem-plate inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold select-none [--gem:var(--primary)]'
        >
          {REPOSITORY.initial}
        </span>
        <div className='flex min-w-0 flex-col leading-tight'>
          <h1 className='truncate text-sm font-medium'>
            {REPOSITORY.owner}
            <span className='text-muted-foreground font-normal'>
              {' '}
              / {REPOSITORY.name}
            </span>
          </h1>
          <p className='text-muted-foreground flex items-center gap-1.5 text-xs'>
            <span
              aria-hidden='true'
              className={cn(
                'size-1.5 shrink-0 rounded-full transition-colors duration-200',
                STATUS_DOT[stage],
                pulseOf(stage)
              )}
            />
            <WordRoll text={statusOf(state)} labels={STATUS_WORDS} />
          </p>
        </div>
      </div>
      <div className='flex items-center gap-2'>
        <ReplayButton isShown={canReplay} onReplay={onReplay} label='Replay' />
        <Button
          type='button'
          variant='outline'
          size='sm'
          data-work-open
          aria-haspopup='dialog'
          onClick={onOpenWork}
          className='@3xl:hidden'
        >
          Diff and tests
        </Button>
      </div>
    </header>
  );
}
