'use client';

import { motion, useReducedMotion } from 'motion/react';

import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import { ChevronDownIcon, CircleCheckIcon } from '@/registry/ndeko/lib/icons';
import { EASE_OUT_STRONG } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold, Swap } from '@/registry/ndeko/ui/chat-motion';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';

import {
  CODER,
  NOTE_REPLY,
  OLD_REPLY,
  OLD_THREAD_LINE,
  PULL_REQUEST,
  REVIEWER,
  SUGGESTION,
  SUGGESTION_REPLY,
  type LineKind,
} from './data';
import type { ApplyStatus, Thread } from './session';

const APPLY_LABELS: Record<MorphState, string> = {
  idle: 'Apply suggestion',
  busy: 'Applying',
  done: 'Applied',
};

const CHECK_PATH = 'M2.6 6.4 4.9 8.7 9.5 3.6';

const DRAW = { duration: 0.28, ease: EASE_OUT_STRONG, delay: 0.08 };

const SIGN: Record<LineKind, string> = { same: ' ', added: '+', removed: '-' };

const LINE_TINT: Record<LineKind, string> = {
  same: '',
  added: 'bg-success/10',
  removed: 'bg-destructive/10',
};

function strokeStartOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return { pathLength: 1 };
  }
  return { pathLength: 0 };
}

function DrawnCheck() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <span className='chip-3d inline-flex size-[18px] items-center justify-center rounded-full [--chip:var(--success)]'>
      <svg aria-hidden='true' viewBox='0 0 12 12' className='size-3'>
        <motion.path
          d={CHECK_PATH}
          fill='none'
          stroke='currentColor'
          strokeWidth='1.9'
          strokeLinecap='round'
          strokeLinejoin='round'
          initial={strokeStartOf(shouldReduceMotion)}
          animate={{ pathLength: 1 }}
          transition={DRAW}
        />
      </svg>
    </span>
  );
}

function CoderTile() {
  const gemStyle = {
    '--gem': seriesColorOf(CODER.series),
  } as React.CSSProperties;

  return (
    <span
      aria-hidden='true'
      style={gemStyle}
      className='gem-plate inline-flex size-6 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold select-none'
    >
      {CODER.initial}
    </span>
  );
}

function TypingDots() {
  return (
    <span className='flex h-6 items-center gap-1' role='status'>
      <span className='sr-only'>Coder is writing a reply</span>
      <span className='bg-muted-foreground size-1.5 animate-pulse rounded-full' />
      <span className='bg-muted-foreground size-1.5 animate-pulse rounded-full [animation-delay:160ms]' />
      <span className='bg-muted-foreground size-1.5 animate-pulse rounded-full [animation-delay:320ms]' />
    </span>
  );
}

function morphStateOf(apply: ApplyStatus): MorphState {
  if (apply === 'busy') {
    return 'busy';
  }
  return 'idle';
}

function pressedSolidOf(isPressed: boolean) {
  if (isPressed) {
    return 'scale-[0.94] bg-primary/85';
  }
  return undefined;
}

function pressedQuietOf(isPressed: boolean) {
  if (isPressed) {
    return 'scale-[0.94] bg-foreground/[0.07]';
  }
  return undefined;
}

type SuggestionBlockProps = {
  apply: ApplyStatus;
  isPressed: boolean;
  onApply: () => void;
};

function SuggestionBlock({ apply, isPressed, onApply }: SuggestionBlockProps) {
  const isApplied = apply === 'done';

  return (
    <div className='bg-foreground/[0.04] flex flex-col gap-2 rounded-lg p-2'>
      <span className='text-muted-foreground px-1 text-xs'>
        Suggested change
      </span>
      <ol className='bg-card dark:bg-foreground/[0.04] overflow-hidden rounded-md py-1 font-mono text-xs leading-5'>
        {SUGGESTION.map((line) => (
          <li
            key={line.key}
            className={cn('flex gap-2 px-2', LINE_TINT[line.kind])}
          >
            <span
              aria-hidden='true'
              className='text-muted-foreground w-3 shrink-0 select-none'
            >
              {SIGN[line.kind]}
            </span>
            <code className='break-all whitespace-pre-wrap'>{line.text}</code>
          </li>
        ))}
      </ol>
      <div className='flex min-h-7 items-center px-1'>
        <Swap swapKey={String(isApplied)}>
          {!isApplied && (
            <MorphButton
              type='button'
              size='sm'
              state={morphStateOf(apply)}
              labels={APPLY_LABELS}
              onClick={onApply}
              className={pressedSolidOf(isPressed)}
            />
          )}
          {isApplied && (
            <span className='text-success-foreground flex items-center gap-1.5 text-xs font-medium'>
              <DrawnCheck />
              Applied in
              <code className='font-mono'>{PULL_REQUEST.commit}</code>
            </span>
          )}
        </Swap>
      </div>
    </div>
  );
}

function replyTextOf(thread: Thread) {
  if (thread.lineKey === OLD_THREAD_LINE) {
    return OLD_REPLY;
  }
  if (thread.reply === 'suggestion') {
    return SUGGESTION_REPLY;
  }
  return NOTE_REPLY;
}

function chevronOf(isFolded: boolean) {
  if (isFolded) {
    return 'rotate-0';
  }
  return 'rotate-180';
}

type ReviewThreadProps = {
  thread: Thread;
  pressed: string | null;
  onApply: (lineKey: string) => void;
  onResolve: (lineKey: string) => void;
  onToggleFold: (lineKey: string) => void;
};

export function ReviewThread({
  thread,
  pressed,
  onApply,
  onResolve,
  onToggleFold,
}: ReviewThreadProps) {
  const isTyping = thread.reply === 'typing';
  const hasSuggestion = thread.reply === 'suggestion';
  const isOpen = !thread.isFolded;

  return (
    <div className='bg-card hairline-ring ring-border dark:bg-foreground/[0.04] rounded-lg font-sans shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      {thread.isResolved && (
        <button
          type='button'
          aria-expanded={isOpen}
          onClick={() => onToggleFold(thread.lineKey)}
          className='hover:bg-foreground/[0.03] focus-visible:ring-ring/25 flex h-9 w-full cursor-pointer items-center gap-2 rounded-lg px-3 text-start text-xs outline-none focus-visible:ring-[3px]'
        >
          <CircleCheckIcon className='text-success-foreground size-4 shrink-0' />
          <span className='font-medium'>Resolved conversation</span>
          <span className='text-muted-foreground'>2 comments</span>
          <ChevronDownIcon
            className={cn(
              'text-muted-foreground ms-auto size-4 transition-transform duration-200 ease-(--ease-out-strong)',
              chevronOf(thread.isFolded)
            )}
          />
        </button>
      )}
      <Fold open={isOpen}>
        <div className='flex flex-col gap-3 p-3'>
          <div className='flex gap-2.5'>
            <Avatar className='size-6'>
              <AvatarImage src={REVIEWER.avatar} alt='' />
              <AvatarFallback className='text-[9px]'>
                {REVIEWER.initials}
              </AvatarFallback>
            </Avatar>
            <div className='flex min-w-0 flex-col'>
              <span className='text-xs leading-6 font-medium'>
                {REVIEWER.name}
              </span>
              <p className='text-[13px] leading-relaxed'>{thread.comment}</p>
            </div>
          </div>
          <div className='flex gap-2.5'>
            <CoderTile />
            <div className='flex min-w-0 flex-1 flex-col gap-2'>
              <span className='text-xs leading-6 font-medium'>
                {CODER.name}
              </span>
              {isTyping && <TypingDots />}
              {!isTyping && (
                <p className='text-[13px] leading-relaxed transition-opacity duration-300 starting:opacity-0'>
                  {replyTextOf(thread)}
                </p>
              )}
              {hasSuggestion && (
                <SuggestionBlock
                  apply={thread.apply}
                  isPressed={pressed === 'apply'}
                  onApply={() => onApply(thread.lineKey)}
                />
              )}
            </div>
          </div>
          {!thread.isResolved && (
            <div className='flex justify-end'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                disabled={isTyping}
                onClick={() => onResolve(thread.lineKey)}
                className={pressedQuietOf(pressed === 'resolve')}
              >
                Resolve conversation
              </Button>
            </div>
          )}
        </div>
      </Fold>
    </div>
  );
}
