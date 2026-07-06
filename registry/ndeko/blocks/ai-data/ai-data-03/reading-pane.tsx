'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import {
  pressedQuietOf,
  pressedSolidOf,
} from '@/registry/ndeko/lib/demonstration';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BookOpenIcon,
  CheckIcon,
  RefreshCwIcon,
  SendIcon,
  UndoIcon,
} from '@/registry/ndeko/lib/icons';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';
import { StreamedInk } from '@/registry/ndeko/ui/streamed-text';
import { Textarea } from '@/registry/ndeko/ui/textarea';

import {
  articlesOf,
  ME,
  topicLabelOf,
  WRITER,
  type Conversation,
  type TopicId,
} from './data';
import { draftOf, type ConversationLive, type SendStatus } from './session';

/** How long one word of a rewritten draft takes to follow the one before it. */
const WORD_MS = 40;

const SEND_STATE: Record<SendStatus, MorphState> = {
  open: 'idle',
  sending: 'busy',
  handled: 'done',
};

const SEND_LABELS: Record<MorphState, string> = {
  idle: 'Send',
  busy: 'Sending',
  done: 'Sent',
};

function topicVariantOf(topic: TopicId) {
  if (topic === 'urgent') {
    return 'destructive';
  }
  return 'secondary';
}

/** Draft 2 of 2 while the words are the agent's, and whose they are once a person changed them. */
function versionLineOf(conversation: Conversation, live: ConversationLive) {
  if (live.edited !== null) {
    return 'Edited by you';
  }
  return `Draft ${live.variant + 1} of ${conversation.drafts.length}`;
}

type DraftCardProps = {
  conversation: Conversation;
  live: ConversationLive;
  isStreaming: boolean;
  pressed: string | null;
  onSend: () => void;
  onEdit: () => void;
  onType: (text: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onRegenerate: () => void;
};

function DraftCard({
  conversation,
  live,
  isStreaming,
  pressed,
  onSend,
  onEdit,
  onType,
  onSave,
  onCancel,
  onRegenerate,
}: DraftCardProps) {
  const fieldId = useId();
  const isEditing = live.editing !== null;
  const isSending = live.status === 'sending';
  const editingText = live.editing ?? '';
  const isEmpty = editingText.trim() === '';
  const versionLine = versionLineOf(conversation, live);
  const sources = articlesOf(conversation);

  return (
    <section
      aria-label='Draft reply'
      className='bg-foreground/[0.04] flex flex-col gap-3 rounded-xl p-3.5'
    >
      <header className='flex items-center gap-2'>
        <MeshTile seed={WRITER.name} color={seriesColorOf(WRITER.series)} />
        <h3 className='min-w-0 flex-1 truncate text-[13px] font-medium'>
          Draft by {WRITER.name}
        </h3>
        <Swap
          swapKey={versionLine}
          className='text-muted-foreground text-xs tabular-nums'
        >
          {versionLine}
        </Swap>
      </header>
      {!isEditing && (
        <p
          key={live.rewrites}
          className='text-[13px] leading-relaxed whitespace-pre-line'
        >
          <StreamedInk
            text={draftOf(conversation, live)}
            isStreaming={isStreaming}
            wordMs={WORD_MS}
          />
        </p>
      )}
      {isEditing && (
        <div className='flex flex-col gap-1.5'>
          <label htmlFor={fieldId} className='sr-only'>
            Reply to {conversation.customer}
          </label>
          <Textarea
            id={fieldId}
            data-draft-field
            value={editingText}
            onChange={(event) => onType(event.target.value)}
          />
        </div>
      )}
      <ul aria-label='Sources' className='flex flex-wrap gap-1.5'>
        {sources.map((article) => (
          <li
            key={article.id}
            className='bg-card dark:bg-foreground/[0.06] flex h-6 max-w-full items-center gap-1.5 rounded-full ps-2 pe-2.5 text-xs'
          >
            <BookOpenIcon className='text-muted-foreground size-3.5 shrink-0' />
            <span className='min-w-0 truncate'>{article.title}</span>
          </li>
        ))}
      </ul>
      {!isEditing && (
        <div className='flex flex-wrap items-center gap-2'>
          <MorphButton
            type='button'
            size='sm'
            data-send
            state={SEND_STATE[live.status]}
            labels={SEND_LABELS}
            idleIcon={<SendIcon />}
            onClick={onSend}
            className={pressedSolidOf(pressed === 'send')}
          />
          <Button
            type='button'
            size='sm'
            variant='outline'
            data-edit
            disabled={isSending}
            onClick={onEdit}
            className={pressedQuietOf(pressed === 'edit')}
          >
            Edit
          </Button>
          <Button
            type='button'
            size='sm'
            variant='ghost'
            disabled={isSending}
            onClick={onRegenerate}
            className={cn(
              'text-muted-foreground',
              pressedQuietOf(pressed === 'regenerate')
            )}
          >
            <RefreshCwIcon />
            Regenerate
          </Button>
        </div>
      )}
      {isEditing && (
        <div className='flex flex-wrap items-center gap-2'>
          <Button
            type='button'
            size='sm'
            disabled={isEmpty}
            focusableWhenDisabled
            onClick={onSave}
            className={pressedSolidOf(pressed === 'save')}
          >
            Save draft
          </Button>
          <Button type='button' size='sm' variant='ghost' onClick={onCancel}>
            Cancel
          </Button>
        </div>
      )}
    </section>
  );
}

type HandledProps = {
  hasNext: boolean;
  onReopen: () => void;
  onNext: () => void;
};

function Handled({ hasNext, onReopen, onNext }: HandledProps) {
  return (
    <div className='flex flex-wrap items-center gap-2'>
      <p className='text-muted-foreground flex min-w-0 flex-1 items-center gap-1.5 text-xs'>
        <CheckIcon className='text-success-foreground size-3.5 shrink-0' />
        Handled. Your reply is in the thread
      </p>
      <Button
        type='button'
        variant='ghost'
        size='sm'
        data-reopen
        onClick={onReopen}
        className='text-muted-foreground'
      >
        <UndoIcon />
        Reopen
      </Button>
      {hasNext && (
        <Button type='button' size='sm' data-next onClick={onNext}>
          Next conversation
          <ArrowRightIcon />
        </Button>
      )}
    </div>
  );
}

export type ReadingPaneProps = DraftCardProps &
  HandledProps & {
    onBack: () => void;
  };

/** The conversation on one side of the thread, the reply on the other, and under them what is left to do. */
export function ReadingPane({
  conversation,
  live,
  hasNext,
  pressed,
  onBack,
  onReopen,
  onNext,
  ...draft
}: ReadingPaneProps) {
  const headingId = useId();
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const isHandled = live.status === 'handled';

  return (
    <section
      aria-labelledby={headingId}
      className='flex min-w-0 flex-1 flex-col gap-4'
    >
      <header className='flex items-start gap-2'>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          data-back
          aria-label='Back to the conversations'
          onClick={onBack}
          className={cn(
            'text-muted-foreground -ms-1.5 shrink-0 @3xl:hidden',
            pressedQuietOf(pressed === 'back')
          )}
        >
          <ArrowLeftIcon />
        </Button>
        <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
          <h2
            id={headingId}
            data-pane-heading
            tabIndex={-1}
            className='focus-visible:ring-ring/25 rounded-sm text-sm leading-7 font-medium text-balance outline-none focus-visible:ring-[3px]'
          >
            {conversation.subject}
          </h2>
          <p className='text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs'>
            <CompanyMark seed={conversation.company} size='sm' />
            <span className='truncate'>
              {conversation.customer}, {conversation.company}
            </span>
          </p>
        </div>
        <Badge variant={topicVariantOf(conversation.topic)} className='mt-1'>
          {topicLabelOf(conversation.topic)}
        </Badge>
      </header>

      <div className='flex flex-col'>
        <div className='flex items-end gap-2 pb-3'>
          <Avatar seed={conversation.customer} className='size-7' />
          <div className='flex max-w-[85%] flex-col gap-1'>
            <p className='bg-foreground/[0.06] rounded-2xl rounded-es-md px-3.5 py-2 text-[13px] leading-relaxed'>
              {conversation.message}
            </p>
            <p className='text-muted-foreground ps-1 text-xs tabular-nums'>
              {conversation.receivedAgo} ago
            </p>
          </div>
        </div>
        <AnimatePresence initial={false}>
          {live.sent !== null && (
            <motion.div
              key='sent'
              className='-mx-1 overflow-hidden px-1'
              {...rowPresence}
            >
              <div className='flex items-end justify-end gap-2 pb-3'>
                <p className='bg-card hairline-ring ring-border dark:bg-foreground/[0.04] max-w-[85%] rounded-2xl rounded-ee-md px-3.5 py-2 text-[13px] leading-relaxed whitespace-pre-line shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
                  {live.sent}
                </p>
                <Avatar seed={ME.name} className='size-7' />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatedSize>
        {!isHandled && (
          <DraftCard
            conversation={conversation}
            live={live}
            pressed={pressed}
            {...draft}
          />
        )}
        {isHandled && (
          <Handled hasNext={hasNext} onReopen={onReopen} onNext={onNext} />
        )}
      </AnimatedSize>
    </section>
  );
}
