'use client';

import { AnimatePresence, motion } from 'motion/react';

import { FeatherIcon } from '@/registry/ndeko/lib/icons';
import { TextLoader } from '@/registry/ndeko/ui/chat-loader';
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageGlyph,
} from '@/registry/ndeko/ui/chat-message';
import {
  ResponseStreamSegments,
  type StreamSegment,
} from '@/registry/ndeko/ui/chat-response-stream';

import type { AssistantTurn, Feedback, UserTurn } from './data';
import { reader } from './data';
import { fadePresence } from './presence';
import { ReplyActions } from './reply-actions';

export function UserMessage({ turn }: { turn: UserTurn }) {
  return (
    <Message className='justify-end'>
      <MessageContent className='max-w-[85%] sm:max-w-[75%]'>
        {turn.text}
      </MessageContent>
      <MessageAvatar
        src={reader.avatar}
        alt={reader.name}
        fallback={reader.initials}
        className='hidden sm:inline-flex'
      />
    </Message>
  );
}

type AssistantMessageProps = {
  turn: AssistantTurn;
  segments: StreamSegment[];
  feedback: Feedback | undefined;
  onFeedback: (feedback: Feedback | undefined) => void;
};

export function AssistantMessage({
  turn,
  segments,
  feedback,
  onFeedback,
}: AssistantMessageProps) {
  const isThinking = turn.status === 'thinking';
  const isStreaming = turn.status === 'streaming';
  const isStopped = turn.status === 'stopped';
  const isDone = turn.status === 'done';
  const isSettled = isDone || isStopped;
  const presence = fadePresence();

  return (
    <Message>
      <MessageGlyph>
        <FeatherIcon />
      </MessageGlyph>
      <div className='min-w-0 flex-1 space-y-2 pt-1'>
        {isThinking && <TextLoader text='Thinking' />}
        {isStreaming && (
          <MessageContent variant='plain'>
            <ResponseStreamSegments segments={segments} />
          </MessageContent>
        )}
        {isSettled && (
          <MessageContent variant='plain'>{turn.text}</MessageContent>
        )}
        <AnimatePresence initial={false}>
          {isStopped && (
            <motion.p
              key='stopped'
              className='text-muted-foreground text-xs'
              {...presence}
            >
              Stopped
            </motion.p>
          )}
          {isSettled && (
            <motion.div key='actions' {...presence}>
              <ReplyActions
                text={turn.text}
                feedback={feedback}
                onFeedback={onFeedback}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Message>
  );
}
