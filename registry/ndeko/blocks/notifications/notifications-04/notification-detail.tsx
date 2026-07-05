'use client';

import { AnimatePresence, motion, type Transition } from 'motion/react';
import { useId, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  ArchiveIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  CheckIcon,
  InboxIcon,
  MailIcon,
  SendIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Textarea } from '@/registry/ndeko/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/registry/ndeko/ui/tooltip';

import {
  YOU,
  type AssignedItem,
  type InboxItem,
  type MessageItem,
  type StatusItem,
} from './data';
import { IssueTypeGem, PersonAvatar, SenderAvatar, StatusChip } from './glyphs';
import { rowCollapseOf, Swap } from './motion-parts';

const PANE_FADE: Transition = { duration: 0.14, ease: [0.23, 1, 0.32, 1] };

function eventOf(item: InboxItem) {
  if (item.kind === 'mention') {
    return 'mentioned you';
  }
  if (item.kind === 'comment') {
    return 'commented';
  }
  if (item.kind === 'assigned') {
    return 'assigned this task to you';
  }
  return 'changed the status';
}

function isMessageItem(item: InboxItem): item is MessageItem {
  const isMention = item.kind === 'mention';
  const isComment = item.kind === 'comment';
  return isMention || isComment;
}

function isAssignedItem(item: InboxItem): item is AssignedItem {
  return item.kind === 'assigned';
}

function isStatusItem(item: InboxItem): item is StatusItem {
  return item.kind === 'status';
}

function readLabelOf(isUnread: boolean) {
  if (isUnread) {
    return 'Mark as read';
  }
  return 'Mark as unread';
}

function firstNameOf(name: string) {
  const [firstName] = name.split(' ');
  return firstName;
}

type ReplyThreadProps = {
  item: MessageItem;
  replies: string[];
  onReply: (itemId: string, text: string) => void;
};

function ReplyThread({ item, replies, onReply }: ReplyThreadProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const fieldId = useId();
  const [draft, setDraft] = useState('');
  const trimmed = draft.trim();
  const canSend = trimmed.length > 0;
  const placeholder = `Reply to ${firstNameOf(item.sender.name)}`;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSend) {
      return;
    }
    onReply(item.id, trimmed);
    setDraft('');
  }

  function sendOnShortcut(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    const isEnter = event.key === 'Enter';
    const hasModifier = event.metaKey || event.ctrlKey;
    const isSendShortcut = isEnter && hasModifier;
    if (!isSendShortcut) {
      return;
    }
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <div className='flex flex-col gap-4'>
      <blockquote className='bg-foreground/[0.025] hairline-ring ring-border rounded-xl px-4 py-3 text-[13px] leading-6'>
        {item.quote}
      </blockquote>
      <ul aria-label='Your replies' className='flex flex-col'>
        <AnimatePresence initial={false}>
          {replies.map((reply, index) => (
            <motion.li
              key={`${item.id}-${index}`}
              variants={rowCollapseOf(shouldReduceMotion)}
              initial='hidden'
              animate='shown'
              exit='hidden'
              className='overflow-hidden'
            >
              <div className='flex items-start gap-3 pb-4'>
                <PersonAvatar person={YOU} />
                <div className='min-w-0'>
                  <p className='text-xs'>
                    <span className='font-medium'>{YOU.name}</span>
                    <span className='text-muted-foreground'> · now</span>
                  </p>
                  <p className='mt-0.5 text-[13px] leading-5 whitespace-pre-wrap'>
                    {reply}
                  </p>
                </div>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <form onSubmit={submit} className='flex flex-col gap-2'>
        <label htmlFor={fieldId} className='sr-only'>
          {placeholder}
        </label>
        <Textarea
          id={fieldId}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={sendOnShortcut}
          placeholder={placeholder}
          rows={2}
          className='min-h-16 resize-none'
        />
        <div className='flex justify-end'>
          <Button type='submit' size='sm' disabled={!canSend}>
            <SendIcon />
            Reply
          </Button>
        </div>
      </form>
    </div>
  );
}

function AssignmentFacts({ item }: { item: AssignedItem }) {
  return (
    <dl className='grid grid-cols-[7rem_minmax(0,1fr)] gap-y-3 text-[13px]'>
      <dt className='text-muted-foreground'>Status</dt>
      <dd>
        <StatusChip status={item.status} />
      </dd>
      <dt className='text-muted-foreground'>Due</dt>
      <dd>{item.due}</dd>
      <dt className='text-muted-foreground'>Estimate</dt>
      <dd className='tabular-nums'>{item.estimate}</dd>
      <dt className='text-muted-foreground'>Assigned by</dt>
      <dd className='flex items-center gap-2'>
        <PersonAvatar person={item.sender} className='size-5 text-[9px]' />
        {item.sender.name}
      </dd>
    </dl>
  );
}

function StatusChange({ item }: { item: StatusItem }) {
  return (
    <p className='flex flex-wrap items-center gap-2'>
      <StatusChip status={item.from} />
      <ArrowRightIcon className='text-muted-foreground size-3.5' />
      <span className='sr-only'>to</span>
      <StatusChip status={item.to} />
    </p>
  );
}

type DetailBodyProps = {
  item: InboxItem;
  replies: string[];
  onReply: (itemId: string, text: string) => void;
};

function DetailBody({ item, replies, onReply }: DetailBodyProps) {
  return (
    <div className='flex flex-col gap-5'>
      <div>
        <h2 className='text-lg font-semibold text-balance'>
          {item.task.title}
        </h2>
        <p className='text-muted-foreground mt-1 text-xs'>
          {item.task.project} · {item.task.key}
        </p>
      </div>
      <div className='flex items-center gap-3'>
        <SenderAvatar person={item.sender} kind={item.kind} />
        <p className='text-muted-foreground text-[13px]'>
          <span className='text-foreground font-medium'>
            {item.sender.name}
          </span>{' '}
          {eventOf(item)}
          <span className='tabular-nums'> · {item.time}</span>
        </p>
      </div>
      {isMessageItem(item) && (
        <ReplyThread item={item} replies={replies} onReply={onReply} />
      )}
      {isAssignedItem(item) && <AssignmentFacts item={item} />}
      {isStatusItem(item) && <StatusChange item={item} />}
    </div>
  );
}

function NothingSelected() {
  return (
    <div className='flex h-full flex-col items-center justify-center px-6 text-center'>
      <span className='keycap-3d text-muted-foreground flex size-9 items-center justify-center rounded-lg'>
        <InboxIcon />
      </span>
      <p className='mt-3 text-sm font-medium'>Nothing selected</p>
      <p className='text-muted-foreground mt-1 max-w-60 text-[13px] text-balance'>
        Pick a notification to read it here, or press the arrows in the list
      </p>
    </div>
  );
}

type NotificationDetailProps = {
  item: InboxItem | null;
  replies: string[];
  onBack: () => void;
  onToggleRead: (itemId: string) => void;
  onArchive: (itemId: string) => void;
  onReply: (itemId: string, text: string) => void;
};

export function NotificationDetail({
  item,
  replies,
  onBack,
  onToggleRead,
  onArchive,
  onReply,
}: NotificationDetailProps) {
  if (!item) {
    return <NothingSelected />;
  }

  const readLabel = readLabelOf(item.isUnread);

  return (
    <div className='flex h-full min-h-0 flex-col'>
      <div className='flex h-12 shrink-0 items-center gap-1 px-3 md:px-5'>
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label='Back to the inbox'
          onClick={onBack}
          className='text-muted-foreground -ms-1 md:hidden'
        >
          <ArrowLeftIcon />
        </Button>
        <span className='flex min-w-0 items-center gap-1.5 text-xs'>
          <IssueTypeGem type={item.task.type} />
          <span className='text-muted-foreground tabular-nums'>
            {item.task.key}
          </span>
        </span>
        <div className='ms-auto flex items-center gap-1'>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant='ghost'
                  size='icon-sm'
                  aria-label={readLabel}
                  onClick={() => onToggleRead(item.id)}
                  className='text-muted-foreground'
                />
              }
            >
              <Swap swapKey={String(item.isUnread)}>
                {item.isUnread && <CheckIcon />}
                {!item.isUnread && <MailIcon />}
              </Swap>
            </TooltipTrigger>
            <TooltipContent>{readLabel}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant='ghost'
                  size='icon-sm'
                  aria-label='Archive'
                  onClick={() => onArchive(item.id)}
                  className='text-muted-foreground'
                />
              }
            >
              <ArchiveIcon />
            </TooltipTrigger>
            <TooltipContent>Archive</TooltipContent>
          </Tooltip>
          <Button
            size='sm'
            variant='outline'
            nativeButton={false}
            render={<a href='#' />}
            className='ms-1'
          >
            Open task
            <ArrowUpRightIcon />
          </Button>
        </div>
      </div>
      <div className='relative min-h-0 flex-1 overflow-y-auto'>
        <AnimatePresence mode='popLayout' initial={false}>
          <motion.div
            key={item.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={PANE_FADE}
            className='mx-auto w-full max-w-xl px-4 pt-2 pb-8 md:px-8'
          >
            <DetailBody item={item} replies={replies} onReply={onReply} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
