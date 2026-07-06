'use client';

import { useId } from 'react';

import {
  pressedQuietOf,
  pressedSolidOf,
} from '@/registry/ndeko/lib/demonstration';
import { ThumbsDownIcon, ThumbsUpIcon } from '@/registry/ndeko/lib/icons';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold } from '@/registry/ndeko/ui/chat-motion';
import { StatusOrb } from '@/registry/ndeko/ui/status-orb';
import { Textarea } from '@/registry/ndeko/ui/textarea';

import type { FeedbackState } from './session';

const REASON_LIMIT = 280;

function thanksLineOf(hasNote: boolean) {
  if (hasNote) {
    return 'Your note goes to the team that writes these articles, and someone reads every one.';
  }
  return 'Your answer helps us decide which articles to rewrite first.';
}

type FeedbackCardProps = {
  state: FeedbackState;
  pressed: string | null;
  onAnswer: (answer: 'yes' | 'no') => void;
  onType: (value: string) => void;
  onSend: () => void;
  onSkip: () => void;
  onChange: () => void;
};

export function FeedbackCard({
  state,
  pressed,
  onAnswer,
  onType,
  onSend,
  onSkip,
  onChange,
}: FeedbackCardProps) {
  const questionId = useId();
  const reasonId = useId();
  const isThanked = state.status === 'thanked';
  const isExplaining = state.status === 'explaining';
  const canSend = state.reason.trim() !== '';

  function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (canSend) {
      onSend();
    }
  }

  return (
    <section
      aria-labelledby={questionId}
      className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] rounded-xl p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <AnimatedSize>
        {!isThanked && (
          <div className='flex flex-col gap-4'>
            <div className='flex flex-wrap items-center gap-3'>
              <h2 id={questionId} className='flex-1 text-sm font-medium'>
                Was this article helpful?
              </h2>
              <div className='flex items-center gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  data-answer-yes
                  onClick={() => onAnswer('yes')}
                  className={pressedQuietOf(pressed === 'answer-yes')}
                >
                  <ThumbsUpIcon className='size-3.5' />
                  Yes
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  aria-pressed={isExplaining}
                  onClick={() => onAnswer('no')}
                  className={cn(
                    'aria-pressed:bg-foreground/[0.06]',
                    pressedQuietOf(pressed === 'answer-no')
                  )}
                >
                  <ThumbsDownIcon className='size-3.5' />
                  No
                </Button>
              </div>
            </div>
            <Fold open={isExplaining}>
              <form onSubmit={send} className='flex flex-col gap-2 pb-0.5'>
                <label htmlFor={reasonId} className='text-[13px] font-medium'>
                  What was missing or wrong?
                </label>
                <Textarea
                  id={reasonId}
                  data-reason
                  rows={2}
                  maxLength={REASON_LIMIT}
                  placeholder='A sentence is enough'
                  value={state.reason}
                  onChange={(event) => onType(event.target.value)}
                />
                <div className='flex items-center gap-2'>
                  <Button
                    type='submit'
                    size='sm'
                    disabled={!canSend}
                    className={pressedSolidOf(pressed === 'send')}
                  >
                    Send
                  </Button>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={onSkip}
                  >
                    Skip
                  </Button>
                </div>
              </form>
            </Fold>
          </div>
        )}
        {isThanked && (
          <div className='flex items-start gap-3 transition-opacity duration-200 starting:opacity-0'>
            <StatusOrb tone='success' size='sm' />
            <div className='flex min-w-0 flex-col items-start gap-1'>
              <h2
                id={questionId}
                data-thanks
                tabIndex={-1}
                className={cn('rounded-sm text-sm font-medium', FOCUS_RING)}
              >
                Thanks for telling us
              </h2>
              <p className='text-muted-foreground text-[13px] text-pretty'>
                {thanksLineOf(state.hasNote)}
              </p>
              <button
                type='button'
                onClick={onChange}
                className={cn(
                  'text-primary-ink mt-1 rounded-sm text-xs font-medium underline-offset-4 hover:underline',
                  FOCUS_RING
                )}
              >
                Change my answer
              </button>
            </div>
          </div>
        )}
      </AnimatedSize>
    </section>
  );
}
