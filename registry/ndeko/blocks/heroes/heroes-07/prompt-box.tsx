'use client';

import { useMemo, useState } from 'react';

import {
  type AutoplayStep,
  typingSteps,
  useAutoplay,
} from '@/registry/ndeko/hooks/use-autoplay';
import { keyDelayOf, prefixesOf } from '@/registry/ndeko/lib/demonstration';
import { PlugIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
} from '@/registry/ndeko/ui/chat-prompt-input';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { APPS, HERO, QUESTIONS } from './data';

const BEFORE_TYPING_MS = 350;
const TYPE_MS = 38;
const HOLD_MS = 1600;
const ERASE_MS = 14;
const LOOP_AFTER_MS = 500;

const BOX =
  'dark:bg-card cursor-text rounded-2xl p-2.5 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_16px_40px_-20px_rgb(0_0_0/0.16)]';

function erasingSteps(
  text: string,
  write: (typed: string) => void
): AutoplayStep[] {
  const prefixes = prefixesOf(text);
  const shorter = prefixes.slice(0, -1);
  const remaining = [...shorter.reverse(), ''];
  return remaining.map((typed, index) => {
    const after = keyDelayOf(index, HOLD_MS, ERASE_MS);
    return { after, run: () => write(typed) };
  });
}

function questionSteps(write: (typed: string) => void): AutoplayStep[] {
  const rounds = QUESTIONS.map((question) => [
    ...typingSteps(question, write, {
      startAfter: BEFORE_TYPING_MS,
      characterMs: TYPE_MS,
    }),
    ...erasingSteps(question, write),
  ]);
  return rounds.flat();
}

function placeholderOf(isAutoplaying: boolean) {
  if (isAutoplaying) {
    return '';
  }
  return QUESTIONS[0];
}

function hintKeyOf(isSent: boolean) {
  if (isSent) {
    return 'sent';
  }
  return 'idle';
}

function announcementOf(isSent: boolean) {
  if (isSent) {
    return HERO.sentAnnouncement;
  }
  return '';
}

function caretClassOf(isLive: boolean) {
  if (isLive) {
    return 'animate-pulse';
  }
  return undefined;
}

/** Sits over the empty field and uses its metrics, so the typed question lands where a person's would. */
function TypedQuestion({ text, isLive }: { text: string; isLive: boolean }) {
  return (
    <span
      aria-hidden='true'
      className='text-muted-foreground/75 pointer-events-none absolute inset-0 px-2 py-1.5 text-base leading-normal select-none'
    >
      {text}
      <span
        className={cn(
          'bg-foreground/60 ms-px inline-block h-[1.15em] w-0.5 translate-y-[0.2em] rounded-full',
          caretClassOf(isLive)
        )}
      />
    </span>
  );
}

function Hint({ isSent }: { isSent: boolean }) {
  const key = hintKeyOf(isSent);

  return (
    <Swap swapKey={key} className='text-muted-foreground min-w-0 text-xs'>
      {!isSent && (
        <span className='flex items-center gap-1.5'>
          <PlugIcon className='size-3.5 shrink-0' />
          <span>Reads from {APPS.length} connected apps</span>
        </span>
      )}
      {isSent && (
        <a
          href='#'
          className='text-primary-ink focus-visible:ring-ring/25 rounded-sm outline-none hover:underline focus-visible:ring-[3px]'
        >
          {HERO.sentHint}
        </a>
      )}
    </Swap>
  );
}

export function PromptBox() {
  const [question, setQuestion] = useState('');
  const [typed, setTyped] = useState('');
  const [isSent, setIsSent] = useState(false);
  const steps = useMemo(() => questionSteps(setTyped), []);

  function clearTyped() {
    setTyped('');
  }

  const { ref, isInView, isAutoplaying } = useAutoplay(steps, {
    loopAfter: LOOP_AFTER_MS,
    onReset: clearTyped,
  });
  const placeholder = placeholderOf(isAutoplaying);
  const announcement = announcementOf(isSent);

  function changeQuestion(value: string) {
    setQuestion(value);
    setIsSent(false);
  }

  function send() {
    const hasText = question.trim().length > 0;
    if (!hasText) {
      return;
    }
    setIsSent(true);
  }

  return (
    <div ref={ref} className='w-full max-w-[30rem]'>
      <PromptInput
        value={question}
        onValueChange={changeQuestion}
        onSubmit={send}
        className={BOX}
      >
        <div className='relative'>
          <PromptInputTextarea
            aria-label={HERO.boxLabel}
            placeholder={placeholder}
            className='min-h-[4.5rem] text-base md:text-base'
          />
          {isAutoplaying && <TypedQuestion text={typed} isLive={isInView} />}
        </div>
        <div className='flex min-h-8 items-center justify-between gap-3 ps-2'>
          <Hint isSent={isSent} />
          <PromptInputSubmit sendLabel={HERO.sendLabel} />
        </div>
      </PromptInput>
      <LiveRegion message={announcement} />
    </div>
  );
}
