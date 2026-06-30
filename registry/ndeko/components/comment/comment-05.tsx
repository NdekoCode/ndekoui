'use client';

import { useEffect, useRef, useState } from 'react';

import { CheckIcon, ChevronDownIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';

import { commentWordOf, type CommentItem } from './_parts/comment-model';
import { CommentBlock } from './_parts/comment-parts';
import { Swap } from './_parts/motion-parts';
import { actorNameOf, CURRENT_USER_ID } from './_parts/people';

type ThreadState = 'open' | 'resolved' | 'peeking';

const THREAD: CommentItem[] = [
  {
    id: 't1',
    authorId: 'tomas',
    at: '2026-11-05T09:10:00',
    body: 'Do we round amounts before or after the totals row? Rounding each line first can leave the total one cent off.',
  },
  {
    id: 't2',
    authorId: 'leo',
    at: '2026-11-05T09:26:00',
    body: 'After. The totals use the raw values, and each line is rounded only when it is written.',
  },
  {
    id: 't3',
    authorId: 'sana',
    at: '2026-11-05T09:40:00',
    body: 'That matches what finance does in the ledger. Good to resolve.',
  },
];

function ResolvedGlyph({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'bg-success/15 text-success-foreground flex size-5 shrink-0 items-center justify-center rounded-full',
        className
      )}
    >
      <CheckIcon strokeWidth={2.75} className='size-3' />
    </span>
  );
}

function ResolvedSummary({
  showRef,
  onShow,
}: {
  showRef: React.RefObject<HTMLButtonElement | null>;
  onShow: () => void;
}) {
  const first = THREAD[0];
  return (
    <div className='flex items-center gap-3'>
      <ResolvedGlyph />
      <div className='min-w-0 flex-1'>
        <p className='text-[13px] font-medium'>
          Resolved by {actorNameOf(CURRENT_USER_ID)}
        </p>
        <p className='text-muted-foreground truncate text-xs'>
          {THREAD.length} {commentWordOf(THREAD.length)} · {first.body}
        </p>
      </div>
      <Button ref={showRef} variant='ghost' size='sm' onClick={onShow}>
        Show thread
      </Button>
    </div>
  );
}

function ThreadBody() {
  return (
    <ul className='flex flex-col gap-3'>
      {THREAD.map((comment) => (
        <li key={comment.id}>
          <CommentBlock comment={comment} />
        </li>
      ))}
    </ul>
  );
}

function footerKeyOf(state: ThreadState) {
  if (state === 'open') {
    return 'resolve';
  }
  return 'reopen';
}

export default function Comment05() {
  const [state, setState] = useState<ThreadState>('open');
  const showRef = useRef<HTMLButtonElement>(null);
  const footerRef = useRef<HTMLButtonElement>(null);
  const hasActed = useRef(false);
  const isFolded = state === 'resolved';
  const isPeeking = state === 'peeking';
  const isOpen = state === 'open';

  useEffect(() => {
    if (!hasActed.current) {
      return;
    }
    if (state === 'resolved') {
      showRef.current?.focus();
      return;
    }
    footerRef.current?.focus();
  }, [state]);

  function moveTo(next: ThreadState) {
    hasActed.current = true;
    setState(next);
  }

  function toggleResolved() {
    if (isOpen) {
      moveTo('resolved');
      return;
    }
    moveTo('open');
  }

  return (
    <section
      aria-label='Discussion thread'
      className={cn(
        'bg-foreground/[0.025] w-full max-w-md rounded-xl p-3 transition-colors duration-200',
        isFolded && 'bg-success/[0.06]'
      )}
    >
      <AnimatedSize>
        {isFolded && (
          <ResolvedSummary showRef={showRef} onShow={() => moveTo('peeking')} />
        )}
        {!isFolded && (
          <div className='flex flex-col gap-3'>
            {isPeeking && (
              <p className='text-muted-foreground flex items-center gap-2 text-xs'>
                <ResolvedGlyph className='size-4' />
                Resolved by {actorNameOf(CURRENT_USER_ID)}
              </p>
            )}
            <ThreadBody />
            <div className='flex items-center justify-end gap-1'>
              {isPeeking && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => moveTo('resolved')}
                >
                  <ChevronDownIcon className='rotate-180' />
                  Fold
                </Button>
              )}
              <Button
                ref={footerRef}
                variant='outline'
                size='sm'
                onClick={toggleResolved}
              >
                <AnimatedSize as='span' axis='width'>
                  <Swap swapKey={footerKeyOf(state)}>
                    {isOpen && (
                      <span className='inline-flex items-center gap-2'>
                        <CheckIcon />
                        Resolve thread
                      </span>
                    )}
                    {!isOpen && 'Reopen'}
                  </Swap>
                </AnimatedSize>
              </Button>
            </div>
          </div>
        )}
      </AnimatedSize>
    </section>
  );
}
