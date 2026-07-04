'use client';

import type { CallStatus } from '@/registry/ndeko/lib/agent-run';
import {
  CircleCheckIcon,
  CircleXIcon,
  LoaderIcon,
  UserRoundIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Swap } from '@/registry/ndeko/ui/chat-motion';

export const CALL_STATUS_WORD: Record<CallStatus, string> = {
  queued: 'Queued',
  running: 'Running',
  waiting: 'Waiting on you',
  done: 'Done',
  failed: 'Failed',
};

function GlyphOf({ status }: { status: CallStatus }) {
  if (status === 'queued') {
    return (
      <span className='flex size-4 items-center justify-center'>
        <span className='bg-muted-foreground/50 size-1.5 rounded-full' />
      </span>
    );
  }
  if (status === 'running') {
    return <LoaderIcon className='text-muted-foreground size-4 animate-spin' />;
  }
  if (status === 'waiting') {
    return <UserRoundIcon className='text-warning-foreground size-4' />;
  }
  if (status === 'done') {
    return <CircleCheckIcon className='text-success-foreground size-4' />;
  }
  return <CircleXIcon className='text-destructive-ink size-4' />;
}

type CallStatusMarkProps = {
  status: CallStatus;
  className?: string;
};

export function CallStatusMark({ status, className }: CallStatusMarkProps) {
  return (
    <span className={cn('inline-flex size-4 shrink-0', className)}>
      <Swap swapKey={status} className='size-4'>
        <GlyphOf status={status} />
      </Swap>
      <span className='sr-only'>{CALL_STATUS_WORD[status]}</span>
    </span>
  );
}
