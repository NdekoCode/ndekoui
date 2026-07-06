'use client';

import { MotionNumber } from '@/components/core/motion-number';
import { formatTokens } from '@/registry/ndeko/lib/agent-run';
import { GitBranchIcon } from '@/registry/ndeko/lib/icons';
import { Badge } from '@/registry/ndeko/ui/badge';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';

import { MODEL, REPOSITORY } from './data';

/** Under a dollar a cost keeps three decimals, as in the rest of the kit. */
const COST_FORMAT: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
};

type StatusFooterProps = {
  tokens: number;
  costUsd: number;
};

/** The count of tokens is plain text: it changes with each step and has no digit to roll in a figure such as 6.1k. */
export function StatusFooter({ tokens, costUsd }: StatusFooterProps) {
  return (
    <footer className='bg-foreground/[0.03] text-muted-foreground flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-xs'>
      <span className='flex min-w-0 items-center gap-1.5'>
        <GitBranchIcon className='size-3.5 shrink-0' />
        <span className='sr-only'>Branch</span>
        <span className='text-foreground truncate font-mono'>
          {REPOSITORY.branch}
        </span>
      </span>
      <span className='tabular-nums'>
        <span className='text-foreground'>{formatTokens(tokens)}</span> tokens
      </span>
      <span className='flex items-center gap-1.5'>
        <span className='sr-only'>Cost of this run</span>
        <MotionNumber
          value={costUsd}
          format={COST_FORMAT}
          className='text-foreground'
        />
        <Badge variant='secondary'>Illustrative</Badge>
      </span>
      <span className='ms-auto flex items-center gap-1.5'>
        <BrandTile brand={MODEL.brand} />
        <span className='sr-only @sm:not-sr-only'>{MODEL.name}</span>
      </span>
    </footer>
  );
}
