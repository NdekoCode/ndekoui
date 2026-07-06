'use client';

import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { PAGE } from './data';

type PageHeaderProps = {
  workspaceName: string;
  hasRequests: boolean;
  canReplay: boolean;
  onReplay: () => void;
  onReview: () => void;
};

export function PageHeader({
  workspaceName,
  hasRequests,
  canReplay,
  onReplay,
  onReview,
}: PageHeaderProps) {
  return (
    <div className='flex flex-wrap items-center gap-x-3 gap-y-2'>
      <div className='flex min-w-0 flex-1 basis-48 flex-col gap-0.5'>
        <h1 className='truncate text-lg font-semibold text-balance'>
          {PAGE.title}
        </h1>
        <p className='text-muted-foreground truncate text-xs'>
          {workspaceName}, {PAGE.meta}
        </p>
      </div>
      <div className='flex flex-wrap items-center gap-2'>
        <Badge variant='secondary'>{PAGE.note}</Badge>
        <ReplayButton isShown={canReplay} onReplay={onReplay} label='Replay' />
        <Button
          type='button'
          size='sm'
          disabled={!hasRequests}
          onClick={onReview}
        >
          Review requests
        </Button>
      </div>
    </div>
  );
}
