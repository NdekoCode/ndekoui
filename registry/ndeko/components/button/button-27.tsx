'use client';

import { useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { ChevronDownIcon, ChevronUpIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

const BASE_SCORE = 235;

const SEGMENT =
  'rounded-none first:rounded-s-full last:rounded-e-full focus-visible:z-10 aria-pressed:text-primary-ink';

const COUNT_SEGMENT = [
  'flex items-center px-3 text-[13px] font-medium tabular-nums',
  'bg-card shadow-[0_1px_2px_rgb(0_0_0/0.05)] hairline-ring ring-foreground/12',
  'dark:bg-foreground/[0.04] dark:ring-foreground/15',
].join(' ');

type Vote = -1 | 0 | 1;

function nextVoteOf(currentVote: Vote, castVote: Vote): Vote {
  if (currentVote === castVote) {
    return 0;
  }
  return castVote;
}

export default function Button27() {
  const [vote, setVote] = useState<Vote>(0);
  const score = BASE_SCORE + vote;
  const isUpvoted = vote === 1;
  const isDownvoted = vote === -1;

  function castVote(cast: Vote) {
    const nextVote = nextVoteOf(vote, cast);
    setVote(nextVote);
  }

  function upvote() {
    castVote(1);
  }

  function downvote() {
    castVote(-1);
  }

  return (
    <div className='inline-flex -space-x-px'>
      <Button
        variant='outline'
        size='icon'
        aria-label='Upvote'
        aria-pressed={isUpvoted}
        onClick={upvote}
        className={SEGMENT}
      >
        <ChevronUpIcon />
      </Button>
      <span className={COUNT_SEGMENT}>
        <span className='flex' aria-hidden='true'>
          <MotionNumber value={score} />
        </span>
        <span className='sr-only'>Score {score}</span>
      </span>
      <Button
        variant='outline'
        size='icon'
        aria-label='Downvote'
        aria-pressed={isDownvoted}
        onClick={downvote}
        className={SEGMENT}
      >
        <ChevronDownIcon />
      </Button>
    </div>
  );
}
