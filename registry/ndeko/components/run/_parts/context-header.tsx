'use client';

import { WordRoll } from '@/components/core/word-roll';
import { cn } from '@/registry/ndeko/lib/utils';

import {
  LEVEL_LABELS,
  LEVEL_TONE,
  LEVEL_WORD,
  levelOf,
  usedTokensOf,
  type ContextBudget,
} from './context';
import { TokenCount } from './token-count';

type ContextHeaderProps = {
  budget: ContextBudget;
  titleId: string;
  title?: string;
};

export function ContextHeader({
  budget,
  titleId,
  title = 'Context',
}: ContextHeaderProps) {
  const used = usedTokensOf(budget);
  const level = levelOf(budget);

  return (
    <header className='flex items-start justify-between gap-3'>
      <div className='min-w-0'>
        <h3 id={titleId} className='text-sm font-medium'>
          {title}
        </h3>
        <p
          className={cn(
            'text-xs transition-colors duration-200',
            LEVEL_TONE[level]
          )}
        >
          <WordRoll text={LEVEL_WORD[level]} labels={LEVEL_LABELS} />
        </p>
      </div>
      <p className='text-[13px] tabular-nums'>
        <TokenCount tokens={used} className='font-medium' />
        <span className='text-muted-foreground'>
          {' of '}
          <TokenCount tokens={budget.limit} />
        </span>
      </p>
    </header>
  );
}
