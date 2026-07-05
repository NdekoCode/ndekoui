'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { FileTextIcon } from '@/registry/ndeko/lib/icons';
import {
  ChatContainerContent,
  ChatContainerRoot,
  type ChatContainerContext,
} from '@/registry/ndeko/ui/chat-container';
import {
  PromptInput,
  PromptInputActions,
  PromptInputSubmit,
  PromptInputTextarea,
} from '@/registry/ndeko/ui/chat-prompt-input';
import { useTextStream } from '@/registry/ndeko/ui/chat-response-stream';
import { ScrollButton } from '@/registry/ndeko/ui/chat-scroll-button';
import { Kbd, KbdGroup } from '@/registry/ndeko/ui/kbd';

import {
  page,
  replies,
  seedTurns,
  thinkingMs,
  wordDelayMs,
  type AssistantTurn,
  type ChatTurn,
  type Feedback,
  type ReplyStatus,
} from './data';
import { rowPresenceOf } from './presence';
import { AssistantMessage, UserMessage } from './turns';

type FeedbackByTurn = Record<string, Feedback | undefined>;

function replyAt(count: number) {
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
    const updated: AssistantTurn = { ...turn, role: 'assistant', status, text };
    return updated;
  });
}

function withoutTurn(turns: ChatTurn[], id: string) {
  return turns.filter((turn) => turn.id !== id);
}

function Conversation01() {
  const [turns, setTurns] = useState<ChatTurn[]>(seedTurns);
  const [draft, setDraft] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeText, setActiveText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackByTurn>({});
  const thinkingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatRef = useRef<ChatContainerContext | null>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const isBusy = activeId !== null;

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

  function send() {
    const text = draft.trim();
    const isEmpty = text.length === 0;
    if (isEmpty) {
      return;
    }
    if (isBusy) {
      return;
    }
    const userId = `sent-${sentCount}-user`;
    const replyId = `sent-${sentCount}-reply`;
    const reply = replyAt(sentCount);
    const userTurn: ChatTurn = { id: userId, role: 'user', text };
    const replyTurn: ChatTurn = {
      id: replyId,
      role: 'assistant',
      status: 'thinking',
      text: '',
    };
    setTurns((current) => [...current, userTurn, replyTurn]);
    setDraft('');
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
    <div className='bg-background text-foreground flex h-dvh min-h-[30rem] w-full flex-col'>
      <header className='flex h-14 shrink-0 items-center gap-2.5 px-4 sm:px-6'>
        <span className='gem-plate inline-flex size-7 shrink-0 items-center justify-center rounded-lg [--gem:var(--primary)] [&_svg]:size-4'>
          <FileTextIcon />
        </span>
        <div className='min-w-0'>
          <h1 className='truncate text-sm font-medium'>{page.title}</h1>
          <p className='text-muted-foreground truncate text-xs'>
            {page.space} · Ask Quillstone about this page
          </p>
        </div>
      </header>

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

      <div className='shrink-0 px-4 pb-4 sm:px-6'>
        <div className='mx-auto w-full max-w-2xl'>
          <PromptInput
            value={draft}
            onValueChange={setDraft}
            isLoading={isBusy}
            onSubmit={send}
          >
            <PromptInputTextarea
              aria-label='Message Quillstone'
              placeholder='Ask about this page'
            />
            <PromptInputActions className='justify-between ps-2'>
              <p className='text-muted-foreground hidden items-center gap-1.5 text-xs sm:flex'>
                <KbdGroup>
                  <Kbd>Shift</Kbd>
                  <Kbd>Enter</Kbd>
                </KbdGroup>
                for a new line
              </p>
              <PromptInputSubmit onStop={stop} className='ms-auto' />
            </PromptInputActions>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}

export default Conversation01;
