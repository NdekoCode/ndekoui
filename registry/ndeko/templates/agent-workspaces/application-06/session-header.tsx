'use client';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll } from '@/components/core/word-roll';
import { MenuIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { stepSeedOf } from './data';
import type { Turn, TurnStage } from './session';

/** Under a dollar a cost keeps three decimals, as in the rest of the kit. */
const COST_FORMAT: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
};

const STAGE_WORD: Record<Exclude<TurnStage, 'working'>, string> = {
  thinking: 'Thinking',
  asking: 'Waiting on you',
  answering: 'Answering',
  done: 'Done',
  declined: 'Done',
};

const FIXED_WORDS = ['Ready', 'Working', ...Object.values(STAGE_WORD)];

const LIVE_STAGES: TurnStage[] = ['thinking', 'working', 'answering'];

function runningTitleOf(turn: Turn) {
  const running = turn.steps.find((run) => run.status === 'running');
  if (!running) {
    return 'Working';
  }
  return stepSeedOf(running.id).title;
}

export function statusWordOf(turn: Turn | undefined) {
  if (!turn) {
    return 'Ready';
  }
  if (turn.stage === 'working') {
    return runningTitleOf(turn);
  }
  return STAGE_WORD[turn.stage];
}

function dotToneOf(turn: Turn | undefined) {
  if (!turn) {
    return 'bg-muted-foreground/45';
  }
  if (turn.stage === 'asking') {
    return 'bg-warning';
  }
  if (turn.stage === 'done' || turn.stage === 'declined') {
    return 'bg-success';
  }
  return 'bg-info';
}

function pulseOf(turn: Turn | undefined) {
  if (!turn) {
    return undefined;
  }
  if (LIVE_STAGES.includes(turn.stage)) {
    return 'animate-pulse';
  }
  return undefined;
}

type SessionHeaderProps = {
  title: string;
  turn: Turn | undefined;
  statusWord: string;
  costUsd: number;
  hasSheet: boolean;
  canReplay: boolean;
  onReplay: () => void;
  onOpenSessions: () => void;
};

export function SessionHeader({
  title,
  turn,
  statusWord,
  costUsd,
  hasSheet,
  canReplay,
  onReplay,
  onOpenSessions,
}: SessionHeaderProps) {
  const words = [...FIXED_WORDS, statusWord];

  return (
    <header className='flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 @xl:px-4'>
      <div className='flex min-w-40 flex-1 items-center gap-2'>
        {hasSheet && (
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            data-sidebar-open
            aria-label='Open the sessions'
            aria-haspopup='dialog'
            onClick={onOpenSessions}
            className='text-muted-foreground'
          >
            <MenuIcon />
          </Button>
        )}
        <div className='flex min-w-0 flex-col leading-tight'>
          <h1 className='truncate text-sm font-medium'>{title}</h1>
          <p className='text-muted-foreground flex items-center gap-1.5 text-xs'>
            <span
              aria-hidden='true'
              className={cn(
                'size-1.5 shrink-0 rounded-full transition-colors duration-200',
                dotToneOf(turn),
                pulseOf(turn)
              )}
            />
            <WordRoll text={statusWord} labels={words} />
          </p>
        </div>
      </div>
      <div className='flex flex-wrap items-center gap-2'>
        <ReplayButton isShown={canReplay} onReplay={onReplay} label='Replay' />
        <span className='flex items-center gap-1.5 text-xs'>
          <span className='sr-only'>Cost of this session</span>
          <MotionNumber
            value={costUsd}
            format={COST_FORMAT}
            className='font-medium'
          />
          <Badge variant='secondary'>Illustrative</Badge>
        </span>
      </div>
    </header>
  );
}
