'use client';

import { useId } from 'react';

import { pressedSolidOf } from '@/registry/ndeko/lib/demonstration';
import { SearchIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold } from '@/registry/ndeko/ui/chat-motion';
import { Input } from '@/registry/ndeko/ui/input';
import { StreamedInk } from '@/registry/ndeko/ui/streamed-text';

import { answerTextOf, SUGGESTIONS, type SuggestionId } from './data';
import type { AnswerId } from './session';

const WORD_MS = 38;

type AskBarProps = {
  question: string;
  answerId: AnswerId | null;
  isStreaming: boolean;
  pressed: string | null;
  onType: (text: string) => void;
  onAsk: () => void;
  onPick: (id: SuggestionId) => void;
};

export function AskBar({
  question,
  answerId,
  isStreaming,
  pressed,
  onType,
  onAsk,
  onPick,
}: AskBarProps) {
  const fieldId = useId();
  const answerRegionId = useId();
  const hasAnswer = answerId !== null;

  function ask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onAsk();
  }

  return (
    <section aria-label='Ask' className='flex flex-col gap-3'>
      <form onSubmit={ask} className='flex items-center gap-2'>
        <div className='relative min-w-0 flex-1'>
          <label htmlFor={fieldId} className='sr-only'>
            Ask about your runs, tasks and spend
          </label>
          <SearchIcon className='text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2' />
          <Input
            id={fieldId}
            autoComplete='off'
            placeholder='Ask about your runs, tasks and spend'
            value={question}
            aria-controls={answerRegionId}
            onChange={(event) => onType(event.target.value)}
            className='h-10 rounded-lg ps-9'
          />
        </div>
        <Button
          type='submit'
          size='lg'
          className={cn('h-10 shrink-0', pressedSolidOf(pressed === 'ask'))}
        >
          Ask
        </Button>
      </form>
      <ul aria-label='Suggested questions' className='flex flex-wrap gap-1.5'>
        {SUGGESTIONS.map((suggestion) => (
          <li key={suggestion.id}>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => onPick(suggestion.id)}
            >
              {suggestion.label}
            </Button>
          </li>
        ))}
      </ul>
      <Fold open={hasAnswer} id={answerRegionId}>
        {hasAnswer && (
          <div className='bg-foreground/[0.04] flex flex-col gap-1 rounded-lg p-3'>
            <p className='text-muted-foreground text-xs'>Answer</p>
            <p
              key={answerId}
              className='max-w-prose text-[13px] leading-relaxed text-pretty'
            >
              <StreamedInk
                text={answerTextOf(answerId)}
                isStreaming={isStreaming}
                wordMs={WORD_MS}
              />
            </p>
          </div>
        )}
      </Fold>
    </section>
  );
}
