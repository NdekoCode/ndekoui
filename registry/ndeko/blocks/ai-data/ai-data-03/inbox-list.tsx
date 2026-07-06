'use client';

import { memo } from 'react';

import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';

import { CONVERSATIONS, TOPICS, type Conversation, type TopicId } from './data';
import { DrawnCheck } from './drawn-check';
import type { ConversationLive } from './session';

const ROW =
  'focus-visible:ring-ring/25 flex w-full cursor-pointer items-start gap-2.5 rounded-lg px-2.5 py-2 text-start transition-[background-color,scale] duration-150 outline-none focus-visible:ring-[3px]';

function rowToneOf(isSelected: boolean) {
  if (isSelected) {
    return 'bg-foreground/[0.07]';
  }
  return 'hover:bg-foreground/[0.04]';
}

function currentOf(isSelected: boolean): 'true' | undefined {
  if (isSelected) {
    return 'true';
  }
  return undefined;
}

/** A handled row steps back where it stands. It never leaves its place in the list. */
function dimOf(isHandled: boolean) {
  if (isHandled) {
    return 'opacity-55';
  }
  return 'opacity-100';
}

/** Only what is urgent wears a colour: the other topics are told apart by their name. */
function topicDotOf(topic: TopicId) {
  if (topic === 'urgent') {
    return 'bg-destructive';
  }
  return 'bg-foreground/25';
}

function conversationsWordOf(count: number) {
  if (count === 1) {
    return 'conversation';
  }
  return 'conversations';
}

type ConversationRowProps = {
  conversation: Conversation;
  live: ConversationLive;
  isSelected: boolean;
  isPressed: boolean;
  onOpen: (id: string) => void;
};

/** Memoised: a key typed in the draft of one conversation draws its own row again, not the nine others. */
const ConversationRow = memo(function ConversationRow({
  conversation,
  live,
  isSelected,
  isPressed,
  onOpen,
}: ConversationRowProps) {
  const isHandled = live.status === 'handled';

  return (
    <li className={cn('transition-opacity duration-300', dimOf(isHandled))}>
      <button
        type='button'
        data-row={conversation.id}
        aria-current={currentOf(isSelected)}
        onClick={() => onOpen(conversation.id)}
        className={cn(ROW, rowToneOf(isSelected), pressedQuietOf(isPressed))}
      >
        <Avatar seed={conversation.customer} className='mt-0.5 size-7' />
        <span className='flex min-w-0 flex-1 flex-col'>
          <span className='flex items-center gap-2'>
            <span className='min-w-0 flex-1 truncate text-[13px] leading-5 font-medium'>
              {conversation.customer}
            </span>
            <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
              {conversation.receivedAgo}
            </span>
          </span>
          <span className='truncate text-[13px] leading-5'>
            {conversation.subject}
          </span>
          <span className='text-muted-foreground truncate text-xs'>
            {conversation.reason}
          </span>
        </span>
        <span className='flex size-[18px] shrink-0 items-center justify-center self-center'>
          {isHandled && <DrawnCheck />}
        </span>
        {isHandled && <span className='sr-only'>Handled</span>}
      </button>
    </li>
  );
});

const ARROW_STEP: Partial<Record<string, number>> = {
  ArrowDown: 1,
  ArrowUp: -1,
};

/** Up and Down walk the rows across the topics, as one list. */
function moveBetweenRows(event: React.KeyboardEvent<HTMLElement>) {
  const step = ARROW_STEP[event.key];
  if (step === undefined) {
    return;
  }
  const rows = event.currentTarget.querySelectorAll<HTMLElement>('[data-row]');
  const buttons = Array.from(rows);
  const index = buttons.findIndex((row) => row === document.activeElement);
  if (index === -1) {
    return;
  }
  const target = buttons[index + step];
  if (!target) {
    return;
  }
  event.preventDefault();
  target.focus();
}

export type InboxListProps = {
  live: Record<string, ConversationLive>;
  selectedId: string;
  pressed: string | null;
  onOpen: (id: string) => void;
};

export function InboxList({
  live,
  selectedId,
  pressed,
  onOpen,
}: InboxListProps) {
  return (
    <nav
      aria-label='Conversations'
      onKeyDown={moveBetweenRows}
      className='flex w-full flex-col gap-4'
    >
      {TOPICS.map((topic) => {
        const conversations = CONVERSATIONS.filter(
          (conversation) => conversation.topic === topic.id
        );
        const count = conversations.length;
        return (
          <section key={topic.id} className='flex flex-col gap-0.5'>
            <h2 className='text-muted-foreground flex h-6 items-center gap-2 px-2.5 text-xs font-medium'>
              <span
                aria-hidden='true'
                className={cn(
                  'size-1.5 shrink-0 rounded-full',
                  topicDotOf(topic.id)
                )}
              />
              {topic.label}
              <span className='tabular-nums'>
                {count}
                <span className='sr-only'> {conversationsWordOf(count)}</span>
              </span>
            </h2>
            <ul className='flex flex-col gap-px'>
              {conversations.map((conversation) => (
                <ConversationRow
                  key={conversation.id}
                  conversation={conversation}
                  live={live[conversation.id]}
                  isSelected={conversation.id === selectedId}
                  isPressed={pressed === `row-${conversation.id}`}
                  onOpen={onOpen}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </nav>
  );
}
