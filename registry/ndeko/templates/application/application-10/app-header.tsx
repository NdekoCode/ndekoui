'use client';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll } from '@/components/core/word-roll';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { Button } from '@/registry/ndeko/ui/button';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { MODEL, WORKSPACE } from './data';
import type { Stage } from './session';

const STATUS_WORD: Record<Stage, string> = {
  idle: 'Ready',
  researching: 'Researching',
  answering: 'Answering',
  answered: 'Answered',
  asking: 'Waiting on you',
  sharing: 'Sharing',
  shared: 'Done',
  kept: 'Done',
};

const STATUS_WORDS = Object.values(STATUS_WORD);

const STATUS_DOT: Record<Stage, string> = {
  idle: 'bg-muted-foreground/45',
  researching: 'bg-info',
  answering: 'bg-info',
  answered: 'bg-info',
  asking: 'bg-warning',
  sharing: 'bg-info',
  shared: 'bg-success',
  kept: 'bg-success',
};

const LIVE_STAGES: Stage[] = ['researching', 'answering', 'sharing'];

/** Under a dollar a cost keeps three decimals, as in the rest of the kit. */
const COST_FORMAT: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
};

function pulseOf(stage: Stage) {
  if (LIVE_STAGES.includes(stage)) {
    return 'animate-pulse';
  }
  return undefined;
}

type AppHeaderProps = {
  stage: Stage;
  costUsd: number;
  isMemoBeingWritten: boolean;
  canReplay: boolean;
  onReplay: () => void;
  onOpenMemo: () => void;
};

export function AppHeader({
  stage,
  costUsd,
  isMemoBeingWritten,
  canReplay,
  onReplay,
  onOpenMemo,
}: AppHeaderProps) {
  return (
    <header className='flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5'>
      <div className='flex min-w-40 flex-1 items-center gap-2.5'>
        <CompanyMark seed={WORKSPACE.name} size='lg' />
        <div className='flex min-w-0 flex-col leading-tight'>
          <h1 className='truncate text-sm font-medium'>
            {WORKSPACE.name}
            <span className='text-muted-foreground font-normal'>
              {' '}
              / {WORKSPACE.space}
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
            <WordRoll text={STATUS_WORD[stage]} labels={STATUS_WORDS} />
          </p>
        </div>
      </div>
      <div className='flex flex-wrap items-center gap-2'>
        <ReplayButton isShown={canReplay} onReplay={onReplay} label='Replay' />
        <span className='flex items-center gap-1.5 text-xs'>
          <BrandTile brand={MODEL.brand} />
          <span className='sr-only @sm:not-sr-only'>{MODEL.name}</span>
        </span>
        <span className='flex items-center gap-1.5 text-xs'>
          <span className='sr-only'>Cost of this run</span>
          <MotionNumber
            value={costUsd}
            format={COST_FORMAT}
            className='font-medium'
          />
          <Badge variant='secondary'>Illustrative</Badge>
        </span>
        <Button
          type='button'
          variant='outline'
          size='sm'
          data-memo-open
          aria-haspopup='dialog'
          onClick={onOpenMemo}
          className='@3xl:hidden'
        >
          {isMemoBeingWritten && (
            <span
              aria-hidden='true'
              className='bg-info size-1.5 rounded-full'
            />
          )}
          Memo
        </Button>
      </div>
    </header>
  );
}
