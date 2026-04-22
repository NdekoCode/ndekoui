'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { FileTextIcon, MenuIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import {
  ChatContainerContent,
  ChatContainerRoot,
  type ChatContainerContext,
} from '@/registry/ndeko/ui/chat-container';
import { useTextStream } from '@/registry/ndeko/ui/chat-response-stream';
import { ScrollButton } from '@/registry/ndeko/ui/chat-scroll-button';

import { Composer, type SentPrompt } from './composer';
import {
  PRODUCT_NAME,
  thinkingMs,
  wordDelayMs,
  type AssistantTurn,
  type ChatTurn,
  type Conversation,
  type Feedback,
  type PageContext,
  type ReplyStatus,
} from './data';
import { rowPresenceOf } from './presence';
import { ReasoningReply } from './reasoning-reply';
import { AssistantMessage, UserMessage } from './turns';

type FeedbackByTurn = Record<string, Feedback | undefined>;

function replyAt(replies: string[], count: number) {
  const index = count % replies.length;
  return replies[index];
}

function withReply(
  turns: ChatTurn[],
  id: string,
  status: ReplyStatus,
  text: string
) {
  return turns.map((turn) => {
    if (turn.id !== id) {
      return turn;
    }
    const updated: AssistantTurn = { id, role: 'assistant', status, text };
    return updated;
  });
}

function withoutTurn(turns: ChatTurn[], id: string) {
  return turns.filter((turn) => turn.id !== id);
}

function titleSourceOf(prompt: SentPrompt) {
  if (prompt.text.length > 0) {
    return prompt.text;
  }
  return prompt.attachments[0].name;
}

function placeholderOf(page: PageContext | undefined) {
  if (page) {
    return 'Ask about this page';
  }
  return `Ask ${PRODUCT_NAME} to draft, rewrite or summarise`;
}

function PageHeading({ page }: { page: PageContext }) {
  return (
    <>
      <span className='gem-plate inline-flex size-7 shrink-0 items-center justify-center rounded-lg [--gem:var(--primary)] [&_svg]:size-4'>
        <FileTextIcon />
      </span>
      <div className='min-w-0'>
        <h1 className='truncate text-sm font-medium'>{page.title}</h1>
        <p className='text-muted-foreground truncate text-xs'>
          {page.space} · Ask {PRODUCT_NAME} about this page
        </p>
      </div>
    </>
  );
}

type ConversationViewProps = {
  conversation: Conversation;
  onFirstMessage: (conversationId: string, titleSource: string) => void;
  onOpenNavigation: () => void;
};

export function ConversationView({
  conversation,
  onFirstMessage,
  onOpenNavigation,
}: ConversationViewProps) {
  const [turns, setTurns] = useState<ChatTurn[]>(conversation.turns);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeText, setActiveText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackByTurn>({});
  const thinkingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatRef = useRef<ChatContainerContext | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const isBusy = activeId !== null;
  const hasTurns = turns.length > 0;
  const isStart = !hasTurns;
  const page = conversation.page;

  const stream = useTextStream({
    textStream: activeText,
    mode: 'fade',
    segmentDelay: wordDelayMs,
    onComplete: finishReply,
  });

  useEffect(() => {
    return () => {
      if (thinkingTimer.current) {
        clearTimeout(thinkingTimer.current);
      }
    };
  }, []);

  function settle(id: string, status: ReplyStatus, text: string) {
    setTurns((current) => withReply(current, id, status, text));
    setActiveId(null);
    setActiveText('');
  }

  function finishReply() {
    if (!activeId) {
      return;
    }
    settle(activeId, 'done', activeText);
  }

  function startReply(id: string, text: string) {
    setIsThinking(false);
    setTurns((current) => withReply(current, id, 'streaming', ''));
    setActiveText(text);
    stream.startStreaming();
  }

  function send(prompt: SentPrompt) {
    if (isBusy) {
      return;
    }
    const prefix = `${conversation.id}-sent-${sentCount}`;
    const userId = `${prefix}-user`;
    const replyId = `${prefix}-reply`;
    const reply = replyAt(conversation.replies, sentCount);
    const userTurn: ChatTurn = {
      id: userId,
      role: 'user',
      text: prompt.text,
      attachments: prompt.attachments,
    };
    const replyTurn: ChatTurn = {
      id: replyId,
      role: 'assistant',
      status: 'thinking',
      text: '',
    };
    if (conversation.isDraft) {
      onFirstMessage(conversation.id, titleSourceOf(prompt));
    }
    setTurns((current) => [...current, userTurn, replyTurn]);
    setSentCount((count) => count + 1);
    setActiveId(replyId);
    setIsThinking(true);
    chatRef.current?.scrollToBottom();
    thinkingTimer.current = setTimeout(
      () => startReply(replyId, reply),
      thinkingMs
    );
  }

  function stop() {
    if (!activeId) {
      return;
    }
    if (isThinking) {
      if (thinkingTimer.current) {
        clearTimeout(thinkingTimer.current);
      }
      setIsThinking(false);
      setTurns((current) => withoutTurn(current, activeId));
      setActiveId(null);
      return;
    }
    stream.pause();
    settle(activeId, 'stopped', stream.displayedText);
  }

  function changeFeedback(id: string, choice: Feedback | undefined) {
    setFeedback((current) => ({ ...current, [id]: choice }));
  }

  return (
    <>
      <header className='flex h-14 shrink-0 items-center gap-2.5 px-4 sm:px-6'>
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label='Open conversations'
          onClick={onOpenNavigation}
          className='text-muted-foreground -ms-1.5 md:hidden'
        >
          <MenuIcon />
        </Button>
        {page && <PageHeading page={page} />}
        {!page && (
          <h1 className='min-w-0 truncate text-sm font-medium'>
            {conversation.title}
          </h1>
        )}
      </header>

      {hasTurns && (
        <ChatContainerRoot contextRef={chatRef} className='flex-1'>
          <ChatContainerContent className='mx-auto max-w-2xl px-4 pt-4 pb-2 sm:px-6'>
            <AnimatePresence initial={false}>
              {turns.map((turn) => (
                <motion.div
                  key={turn.id}
                  className='-mx-1 overflow-hidden px-1'
                  {...rowPresence}
                >
                  <div className='pb-6'>
                    {turn.role === 'user' && <UserMessage turn={turn} />}
                    {turn.role === 'reasoning' && <ReasoningReply />}
                    {turn.role === 'assistant' && (
                      <AssistantMessage
                        turn={turn}
                        segments={stream.segments}
                        feedback={feedback[turn.id]}
                        onFeedback={(choice) => changeFeedback(turn.id, choice)}
                      />
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </ChatContainerContent>
          <div className='pointer-events-none absolute inset-x-0 bottom-3 flex justify-center'>
            <ScrollButton wrapperClassName='pointer-events-auto' />
          </div>
        </ChatContainerRoot>
      )}

      {isStart && (
        <div className='flex flex-1 flex-col justify-end px-4 pb-5 sm:px-6'>
          <div className='mx-auto w-full max-w-xl space-y-1.5 text-center'>
            <h2 className='text-xl font-semibold text-balance sm:text-2xl'>
              Draft with {PRODUCT_NAME}
            </h2>
            <p className='text-muted-foreground text-sm text-balance'>
              Attach notes or a page, pick a model and say what you need
            </p>
          </div>
        </div>
      )}

      <div
        className={cn('shrink-0 px-4 pb-4 sm:px-6', isStart && 'flex-1 pb-10')}
      >
        <div
          className={cn(
            'mx-auto w-full',
            hasTurns && 'max-w-2xl',
            isStart && 'max-w-xl'
          )}
        >
          <Composer
            isBusy={isBusy}
            placeholder={placeholderOf(page)}
            withSuggestions={isStart}
            onSend={send}
            onStop={stop}
          />
        </div>
      </div>
    </>
  );
}
