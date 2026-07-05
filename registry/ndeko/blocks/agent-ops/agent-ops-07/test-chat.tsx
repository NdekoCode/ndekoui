'use client';

import { useEffect, useId, useRef, useState } from 'react';

import { ArrowUpIcon, BotIcon, CheckIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Input } from '@/registry/ndeko/ui/input';

import type { ChatTurn } from './session';

const WORD_MS = 48;

function pressedSolidOf(isPressed: boolean) {
  if (isPressed) {
    return 'scale-[0.94] bg-primary/85';
  }
  return undefined;
}

function useRevealedCount(total: number, isActive: boolean) {
  const [count, setCount] = useState(0);
  const isStreaming = isActive && count < total;

  useEffect(() => {
    if (!isStreaming) {
      return;
    }
    const timer = setInterval(() => {
      setCount((current) => Math.min(total, current + 1));
    }, WORD_MS);
    return () => clearInterval(timer);
  }, [isStreaming, total]);

  return count;
}

type StreamedReplyProps = {
  text: string;
  isActive: boolean;
};

/** Only this text re-renders while the reply streams, word by word. */
function StreamedReply({ text, isActive }: StreamedReplyProps) {
  const words = text.split(' ');
  const count = useRevealedCount(words.length, isActive);
  const shown = words.slice(0, count);

  return (
    <p className='text-sm leading-relaxed'>
      <span className='sr-only'>{text}</span>
      <span aria-hidden='true'>
        {shown.map((word, index) => (
          <span
            key={index}
            className='transition-opacity duration-300 ease-(--ease-out-strong) starting:opacity-0'
          >
            {word}{' '}
          </span>
        ))}
      </span>
    </p>
  );
}

function AgentTile() {
  return (
    <span
      aria-hidden='true'
      className='gem-plate inline-flex size-6 shrink-0 items-center justify-center rounded-md [--gem:var(--primary)]'
    >
      <BotIcon className='size-3.5' />
    </span>
  );
}

type TurnRowProps = {
  turn: ChatTurn;
  isActive: boolean;
  shouldStream: boolean;
};

function TurnRow({ turn, isActive, shouldStream }: TurnRowProps) {
  if (turn.role === 'person') {
    return (
      <li className='flex justify-end'>
        <p className='bg-foreground/[0.06] max-w-[85%] rounded-2xl rounded-ee-md px-3.5 py-2 text-sm leading-relaxed'>
          {turn.text}
        </p>
      </li>
    );
  }
  return (
    <li className='flex items-start gap-2.5'>
      <AgentTile />
      <div className='flex min-w-0 flex-1 flex-col gap-1.5'>
        {turn.tool && (
          <p className='text-muted-foreground flex items-center gap-1.5 text-xs transition-opacity duration-300 starting:opacity-0'>
            <CheckIcon className='text-success-foreground size-3.5 shrink-0' />
            {turn.tool}
          </p>
        )}
        {shouldStream && <StreamedReply text={turn.text} isActive={isActive} />}
        {!shouldStream && (
          <p className='text-sm leading-relaxed'>{turn.text}</p>
        )}
      </div>
    </li>
  );
}

export type TestChatProps = {
  agentName: string;
  turns: ChatTurn[];
  draft: string;
  isAnswering: boolean;
  /** False while the block is off screen: the reply stops streaming until it is back. */
  isActive: boolean;
  shouldReduceMotion: boolean | null;
  pressed: string | null;
  onDraftChange: (text: string) => void;
  onSend: () => void;
};

/** The replies are canned: nothing is sent to a model. */
export function TestChat({
  agentName,
  turns,
  draft,
  isAnswering,
  isActive,
  shouldReduceMotion,
  pressed,
  onDraftChange,
  onSend,
}: TestChatProps) {
  const fieldId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const turnCount = turns.length;
  const isEmpty = turnCount === 0;
  const canSend = draft.trim() !== '' && !isAnswering;
  const shouldStream = !shouldReduceMotion;

  useEffect(() => {
    const list = listRef.current;
    if (list) {
      list.scrollTop = list.scrollHeight;
    }
  }, [turnCount, isAnswering]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSend();
  }

  return (
    <div className='flex flex-col gap-3'>
      <div
        ref={listRef}
        className='bg-foreground/[0.03] dark:bg-foreground/[0.05] flex h-72 flex-col overflow-y-auto rounded-xl p-3'
      >
        {isEmpty && (
          <p className='text-muted-foreground m-auto max-w-xs text-center text-[13px]'>
            Ask what a customer would ask. The replies are canned for this demo:
            nothing is sent to a model.
          </p>
        )}
        <ul aria-label='Test conversation' className='flex flex-col gap-3'>
          {turns.map((turn) => (
            <TurnRow
              key={turn.id}
              turn={turn}
              isActive={isActive}
              shouldStream={shouldStream}
            />
          ))}
        </ul>
        {isAnswering && (
          <p className='text-muted-foreground flex items-center gap-2 pt-3 text-xs'>
            <span
              aria-hidden='true'
              className='bg-primary size-1.5 animate-pulse rounded-full'
            />
            {agentName} is thinking
          </p>
        )}
      </div>
      <form onSubmit={submit} className='flex items-center gap-2'>
        <label htmlFor={fieldId} className='sr-only'>
          Message to test the agent
        </label>
        <Input
          id={fieldId}
          autoComplete='off'
          placeholder='Ask as a customer'
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
        />
        <Button
          type='submit'
          size='icon'
          aria-label='Send the message'
          disabled={!canSend}
          className={cn('shrink-0', pressedSolidOf(pressed === 'send'))}
        >
          <ArrowUpIcon />
        </Button>
      </form>
    </div>
  );
}
