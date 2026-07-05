'use client';

import {
  LayoutGroup,
  motion,
  Reorder,
  useDragControls,
  useInView,
  useReducedMotion,
} from 'motion/react';
import {
  useEffect,
  useEffectEvent,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { useDocumentVisible } from '@/registry/ndeko/hooks/use-agent-run';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  EllipsisIcon,
  GripVerticalIcon,
  ListChecksIcon,
  PencilIcon,
  PlayIcon,
  TrashIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import { springOf } from '@/registry/ndeko/lib/motion-presets';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { Textarea } from '@/registry/ndeko/ui/textarea';

import { isOwnKey, isSendKey, useAutosize } from './_parts/use-autosize';
import { nounOf, wordsOf } from './_parts/words';

export type QueuedPrompt = {
  id: string;
  text: string;
};

function moveItem<T>(items: T[], from: number, to: number) {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

function placeWordOf(index: number) {
  if (index === 0) {
    return 'Next';
  }
  return 'Then';
}

function moveStepOf(event: React.KeyboardEvent) {
  if (!event.altKey) {
    return 0;
  }
  if (event.key === 'ArrowUp') {
    return -1;
  }
  if (event.key === 'ArrowDown') {
    return 1;
  }
  return 0;
}

function settleOf(shouldReduceMotion: boolean | null) {
  return springOf(shouldReduceMotion);
}

function liftOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return undefined;
  }
  return { scale: 1.02 };
}

type QueuedCardProps = {
  item: QueuedPrompt;
  index: number;
  count: number;
  groupRef: React.RefObject<HTMLUListElement | null>;
  onMove: (from: number, to: number) => void;
  onEdit: (id: string, text: string) => void;
  onRemove: (id: string) => void;
};

function QueuedCard({
  item,
  index,
  count,
  groupRef,
  onMove,
  onEdit,
  onRemove,
}: QueuedCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(item.text);
  const controls = useDragControls();
  const textButtonRef = useRef<HTMLButtonElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const isFirst = index === 0;
  const isLast = index === count - 1;
  const placeWord = placeWordOf(index);

  function startDrag(event: React.PointerEvent) {
    controls.start(event);
  }

  function startEdit() {
    setDraft(item.text);
    setIsEditing(true);
  }

  function endEdit(shouldSave: boolean) {
    setIsEditing(false);
    const trimmed = draft.trim();
    const canSave = shouldSave && trimmed !== '';
    if (canSave) {
      onEdit(item.id, trimmed);
    }
    requestAnimationFrame(() => textButtonRef.current?.focus());
  }

  function handleFieldKeys(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      endEdit(true);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      endEdit(false);
    }
  }

  function moveFromKeys(event: React.KeyboardEvent<HTMLButtonElement>) {
    const step = moveStepOf(event);
    if (step === 0) {
      return;
    }
    event.preventDefault();
    const target = index + step;
    const isInside = target >= 0 && target < count;
    if (isInside) {
      onMove(index, target);
    }
  }

  return (
    <Reorder.Item
      value={item}
      layoutId={`prompt-${item.id}`}
      dragListener={false}
      dragControls={controls}
      dragConstraints={groupRef}
      dragElastic={0.08}
      whileDrag={liftOf(shouldReduceMotion)}
      transition={settleOf(shouldReduceMotion)}
      className='bg-card hairline-ring ring-border relative flex items-center gap-1 rounded-lg py-1 ps-1 pe-1 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <span
        aria-hidden='true'
        onPointerDown={startDrag}
        className='text-muted-foreground hover:bg-foreground/5 hover:text-foreground grid size-7 shrink-0 cursor-grab touch-none place-items-center rounded-md active:cursor-grabbing'
      >
        <GripVerticalIcon className='size-4' />
      </span>
      <span className='text-muted-foreground w-9 shrink-0 text-xs'>
        <Swap swapKey={placeWord}>{placeWord}</Swap>
      </span>
      {isEditing && (
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleFieldKeys}
          onBlur={() => endEdit(true)}
          aria-label='Edit the queued prompt'
          autoFocus
          className='focus-visible:ring-ring/25 bg-foreground/[0.04] h-7 min-w-0 flex-1 rounded-md px-2 text-[13px] outline-none focus-visible:ring-[3px]'
        />
      )}
      {!isEditing && (
        <button
          ref={textButtonRef}
          type='button'
          onClick={startEdit}
          onKeyDown={moveFromKeys}
          aria-label={`${placeWord}: ${item.text}. Edit it, or move it with Alt and the arrows`}
          className='hover:bg-foreground/[0.03] focus-visible:ring-ring/25 h-7 min-w-0 flex-1 cursor-text truncate rounded-md px-2 text-start text-[13px] outline-none focus-visible:ring-[3px]'
        >
          {item.text}
        </button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              aria-label={`More for “${item.text}”`}
              className='text-muted-foreground'
            />
          }
        >
          <EllipsisIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='min-w-48'>
          <DropdownMenuItem onClick={startEdit}>
            <PencilIcon />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isFirst}
            onClick={() => onMove(index, index - 1)}
          >
            <ArrowUpIcon />
            Move up
            <DropdownMenuShortcut>Alt ↑</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isLast}
            onClick={() => onMove(index, index + 1)}
          >
            <ArrowDownIcon />
            Move down
            <DropdownMenuShortcut>Alt ↓</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant='destructive'
            onClick={() => onRemove(item.id)}
          >
            <TrashIcon />
            Remove from the queue
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        type='button'
        variant='ghost'
        size='icon-sm'
        aria-label={`Remove “${item.text}” from the queue`}
        onClick={() => onRemove(item.id)}
        className='text-muted-foreground'
      >
        <XIcon />
      </Button>
    </Reorder.Item>
  );
}

export type PromptQueueProps = {
  items: QueuedPrompt[];
  onReorder: (items: QueuedPrompt[]) => void;
  onEdit: (id: string, text: string) => void;
  onRemove: (id: string) => void;
  /** After a stop the queue waits; Send next releases the first prompt. */
  isPaused?: boolean;
  onSendNext?: () => void;
};

export function PromptQueue({
  items,
  onReorder,
  onEdit,
  onRemove,
  isPaused = false,
  onSendNext,
}: PromptQueueProps) {
  const groupRef = useRef<HTMLUListElement>(null);
  const count = items.length;
  const hasItems = count > 0;
  const canSendNext = isPaused && onSendNext !== undefined;

  function move(from: number, to: number) {
    const next = moveItem(items, from, to);
    onReorder(next);
  }

  return (
    <AnimatedSize>
      {hasItems && (
        <div className='flex flex-col gap-1.5 pb-2'>
          <div className='flex h-6 items-center justify-between gap-2 px-1'>
            <p className='text-muted-foreground flex items-center gap-1.5 text-xs'>
              <ListChecksIcon className='size-3.5' />
              <MotionNumber value={count} /> queued
              {isPaused && (
                <span className='text-warning-foreground'>, paused</span>
              )}
            </p>
            {canSendNext && (
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={onSendNext}
                className='h-6 px-2'
              >
                <PlayIcon />
                Send next
              </Button>
            )}
          </div>
          <Reorder.Group
            ref={groupRef}
            axis='y'
            values={items}
            onReorder={onReorder}
            aria-label='Queued prompts'
            className='flex flex-col gap-1.5'
          >
            {items.map((item, index) => (
              <QueuedCard
                key={item.id}
                item={item}
                index={index}
                count={count}
                groupRef={groupRef}
                onMove={move}
                onEdit={onEdit}
                onRemove={onRemove}
              />
            ))}
          </Reorder.Group>
        </div>
      )}
    </AnimatedSize>
  );
}

type MessageStatus = 'streaming' | 'done' | 'stopped';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  status: MessageStatus;
};

const WORD_MS = 85;

const END_PAUSE_MS = 650;

const STICK_DISTANCE = 48;

const FIRST_PROMPT = 'Compare the shipping terms of Brightmoor and Ostrava';

const ANSWERS: Record<string, string> = {
  [FIRST_PROMPT]:
    'Brightmoor ships within 3 working days and charges a flat $18 per order, free above $500. Ostrava takes 5 to 7 days, bills freight by weight and only covers damage when the box is opened in front of the driver. For your usual orders Brightmoor is faster and about $40 cheaper a month.',
  'Also compare the refund policies':
    'Brightmoor refunds within 30 days and pays the return shipping when the item is faulty. Ostrava gives store credit only, within 14 days, and keeps a 10% restocking fee.',
  'Then draft a short note for finance':
    'Here is a note you can send: We compared Brightmoor and Ostrava on shipping and refunds. Brightmoor is faster, cheaper for our order sizes and refunds in cash, so we suggest moving the October orders there.',
};

const SEED_QUEUE: QueuedPrompt[] = [
  { id: 'refunds', text: 'Also compare the refund policies' },
  { id: 'finance', text: 'Then draft a short note for finance' },
];

const SEED_MESSAGES: Message[] = [
  { id: 'first', role: 'user', text: FIRST_PROMPT, status: 'done' },
  {
    id: 'first-answer',
    role: 'assistant',
    text: ANSWERS[FIRST_PROMPT],
    status: 'streaming',
  },
];

function answerFor(prompt: string) {
  const prepared = ANSWERS[prompt];
  if (prepared) {
    return prepared;
  }
  return `Looked into “${prompt}”. The two vendors differ less here: both answer within a day and both keep the details in their terms page, which I linked in the notes.`;
}

function promptMessagesOf(item: QueuedPrompt): Message[] {
  return [
    { id: item.id, role: 'user', text: item.text, status: 'done' },
    {
      id: `${item.id}-answer`,
      role: 'assistant',
      text: answerFor(item.text),
      status: 'streaming',
    },
  ];
}

function finishedOf(
  messages: Message[],
  status: MessageStatus,
  shownText?: string
) {
  return messages.map((message) => {
    if (message.status !== 'streaming') {
      return message;
    }
    const text = shownText ?? message.text;
    return { ...message, status, text };
  });
}

function delayOf(isComplete: boolean) {
  if (isComplete) {
    return END_PAUSE_MS;
  }
  return WORD_MS;
}

function sendLabelOf(isAnswering: boolean, hasText: boolean) {
  if (!isAnswering) {
    return 'Send';
  }
  if (hasText) {
    return 'Add to the queue';
  }
  return 'Stop the answer';
}

function keyGlyphOf(isAnswering: boolean, hasText: boolean) {
  const isStop = isAnswering && !hasText;
  if (isStop) {
    return 'stop';
  }
  return 'send';
}

function UserBubble({ message }: { message: Message }) {
  return (
    <motion.div
      layoutId={`prompt-${message.id}`}
      className='bg-foreground/[0.05] dark:bg-foreground/[0.07] ms-auto max-w-[85%] rounded-2xl rounded-ee-md px-3 py-2 text-[13px] leading-5'
    >
      <motion.span layout='position' className='block'>
        {message.text}
      </motion.span>
    </motion.div>
  );
}

function AssistantText({
  message,
  shownWords,
}: {
  message: Message;
  shownWords: number;
}) {
  const isStreaming = message.status === 'streaming';
  const isStopped = message.status === 'stopped';
  const words = wordsOf(message.text);
  const visible = textOf(words, shownWords, isStreaming);

  return (
    <div className='text-[13px] leading-6 text-pretty'>
      {visible}
      {isStreaming && (
        <span
          aria-hidden='true'
          className='bg-primary ms-0.5 inline-block h-3.5 w-1.5 animate-pulse rounded-[2px] align-[-2px]'
        />
      )}
      {isStopped && (
        <Badge variant='secondary' className='ms-1.5 align-[1px]'>
          Stopped
        </Badge>
      )}
    </div>
  );
}

function textOf(words: string[], shownWords: number, isStreaming: boolean) {
  if (!isStreaming) {
    return words.join(' ');
  }
  const shown = words.slice(0, shownWords);
  return shown.join(' ');
}

export default function Prompt09() {
  const [messages, setMessages] = useState<Message[]>(SEED_MESSAGES);
  const [queue, setQueue] = useState<QueuedPrompt[]>(SEED_QUEUE);
  const [shownWords, setShownWords] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [draft, setDraft] = useState('');
  const [message, setMessage] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sticksToBottom = useRef(true);
  const idCounter = useRef(0);
  const layoutGroupId = useId();
  const isInView = useInView(rootRef, { amount: 0.3 });
  const isVisible = useDocumentVisible();
  const shouldReduceMotion = useReducedMotion();
  const layoutSpring = springOf(shouldReduceMotion);
  const streaming = messages.find((item) => item.status === 'streaming');
  const answerWordCount = wordsOf(streaming?.text ?? '').length;
  const isAnswering = streaming !== undefined;
  const isOnScreen = isInView && isVisible;
  const shouldStream = isAnswering && isOnScreen;
  const hasText = draft.trim() !== '';
  const keyLabel = sendLabelOf(isAnswering, hasText);
  const keyGlyph = keyGlyphOf(isAnswering, hasText);
  const isKeyEnabled = isAnswering || hasText;
  const isFinished = !isAnswering && queue.length === 0;
  useAutosize(textareaRef, draft, 120);

  const completeAnswer = useEffectEvent(() => {
    const finished = finishedOf(messages, 'done');
    const [first, ...rest] = queue;
    const canContinue = first !== undefined && !isPaused;
    if (!canContinue) {
      setMessages(finished);
      setMessage('Answer finished');
      return;
    }
    setMessages([...finished, ...promptMessagesOf(first)]);
    setQueue(rest);
    setShownWords(0);
    setMessage(`Answer finished. Sent the next prompt: ${first.text}`);
  });

  useEffect(() => {
    if (!shouldStream) {
      return;
    }
    const isComplete = shownWords >= answerWordCount;
    const timer = setTimeout(() => {
      if (isComplete) {
        completeAnswer();
        return;
      }
      setShownWords((current) => current + 1);
    }, delayOf(isComplete));
    return () => clearTimeout(timer);
  }, [shouldStream, shownWords, answerWordCount]);

  useLayoutEffect(() => {
    const thread = threadRef.current;
    if (!thread) {
      return;
    }
    if (sticksToBottom.current) {
      thread.scrollTop = thread.scrollHeight;
    }
  }, [messages, shownWords]);

  function trackScroll(event: React.UIEvent<HTMLDivElement>) {
    const thread = event.currentTarget;
    const bottom = thread.scrollTop + thread.clientHeight;
    const distance = thread.scrollHeight - bottom;
    sticksToBottom.current = distance < STICK_DISTANCE;
  }

  function nextId() {
    idCounter.current += 1;
    return `typed-${idCounter.current}`;
  }

  function sendNow(item: QueuedPrompt) {
    sticksToBottom.current = true;
    setMessages((current) => [...current, ...promptMessagesOf(item)]);
    setShownWords(0);
  }

  function submit() {
    const text = draft.trim();
    if (text === '') {
      return;
    }
    const item = { id: nextId(), text };
    setDraft('');
    if (isAnswering) {
      setQueue((current) => [...current, item]);
      setMessage(`Queued: ${text}`);
      return;
    }
    sendNow(item);
    setMessage(`Sent: ${text}`);
  }

  function stop() {
    if (!streaming) {
      return;
    }
    const words = wordsOf(streaming.text);
    const shownText = words.slice(0, shownWords).join(' ');
    setMessages((current) => finishedOf(current, 'stopped', shownText));
    const hasQueue = queue.length > 0;
    setIsPaused(hasQueue);
    setMessage(stopMessageOf(queue.length));
  }

  function sendNext() {
    const [first, ...rest] = queue;
    if (!first) {
      return;
    }
    setIsPaused(false);
    setQueue(rest);
    sendNow(first);
    setMessage(`Sent the next prompt: ${first.text}`);
  }

  function pressKey() {
    const isStop = isAnswering && !hasText;
    if (isStop) {
      stop();
      return;
    }
    submit();
  }

  function editQueued(id: string, text: string) {
    setQueue((current) =>
      current.map((item) => {
        if (item.id !== id) {
          return item;
        }
        return { ...item, text };
      })
    );
    setMessage('Queued prompt saved');
  }

  function removeQueued(id: string) {
    const removed = queue.find((item) => item.id === id);
    const rest = queue.filter((item) => item.id !== id);
    setQueue(rest);
    if (rest.length === 0) {
      setIsPaused(false);
    }
    setMessage(`Removed from the queue: ${removed?.text ?? ''}`);
  }

  function reorder(items: QueuedPrompt[]) {
    setQueue(items);
    const first = items[0];
    if (first) {
      setMessage(`Next up: ${first.text}`);
    }
  }

  function handleFieldKeys(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!isSendKey(event)) {
      return;
    }
    event.preventDefault();
    submit();
  }

  function handleEscape(event: React.KeyboardEvent<HTMLDivElement>) {
    const isEscape = event.key === 'Escape';
    const isStoppable = isEscape && isAnswering;
    if (!isStoppable) {
      return;
    }
    if (!isOwnKey(event)) {
      return;
    }
    event.preventDefault();
    stop();
  }

  function replay() {
    setMessages(SEED_MESSAGES);
    setQueue(SEED_QUEUE);
    setShownWords(0);
    setIsPaused(false);
    sticksToBottom.current = true;
    setMessage('The demo starts again');
  }

  return (
    <div ref={rootRef} className='flex w-full max-w-[28rem] flex-col gap-2'>
      <div className='bg-card hairline-ring ring-border flex flex-col rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
        <LayoutGroup id={layoutGroupId}>
          <div
            ref={threadRef}
            onScroll={trackScroll}
            className='flex h-64 flex-col gap-3 overflow-y-auto p-3'
          >
            {messages.map((item) => {
              if (item.role === 'user') {
                return <UserBubble key={item.id} message={item} />;
              }
              return (
                <AssistantText
                  key={item.id}
                  message={item}
                  shownWords={shownWords}
                />
              );
            })}
          </div>
          <div className='flex flex-col px-2 pt-1 pb-2'>
            <PromptQueue
              items={queue}
              onReorder={reorder}
              onEdit={editQueued}
              onRemove={removeQueued}
              isPaused={isPaused}
              onSendNext={sendNext}
            />
            <motion.div
              layout='position'
              transition={layoutSpring}
              onKeyDown={handleEscape}
              className='bg-foreground/[0.03] dark:bg-foreground/[0.05] has-[textarea:focus]:ring-ring/25 flex items-end gap-1.5 rounded-lg p-1.5 has-[textarea:focus]:ring-[3px]'
            >
              <Textarea
                ref={textareaRef}
                rows={1}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleFieldKeys}
                aria-label='Message'
                placeholder={placeholderOf(isAnswering)}
                className='max-h-none min-h-8 border-0 bg-transparent px-1.5 py-1.5 shadow-none ring-0 focus-visible:ring-0 dark:bg-transparent'
              />
              <Button
                type='button'
                size='icon'
                aria-label={keyLabel}
                disabled={!isKeyEnabled}
                focusableWhenDisabled
                onClick={pressKey}
              >
                <Swap swapKey={keyGlyph}>
                  {keyGlyph === 'stop' && (
                    <span
                      aria-hidden='true'
                      className='size-2.5 rounded-[2px] bg-current'
                    />
                  )}
                  {keyGlyph === 'send' && <ArrowUpIcon />}
                </Swap>
              </Button>
            </motion.div>
          </div>
        </LayoutGroup>
      </div>
      <div className='flex h-7 items-center justify-between gap-2 px-1'>
        <p className='text-muted-foreground text-xs'>{hintOf(isAnswering)}</p>
        <ReplayButton
          isShown={isFinished}
          onReplay={replay}
          label='Start over'
        />
      </div>
      <LiveRegion message={message} />
    </div>
  );
}

function placeholderOf(isAnswering: boolean) {
  if (isAnswering) {
    return 'Type the next prompt, it waits in the queue';
  }
  return 'Message Lumen';
}

function hintOf(isAnswering: boolean) {
  if (isAnswering) {
    return 'Escape stops the answer';
  }
  return 'Enter sends';
}

function stopMessageOf(queued: number) {
  if (queued === 0) {
    return 'Answer stopped';
  }
  const prompts = nounOf(queued, 'prompt');
  return `Answer stopped. ${queued} ${prompts} wait in the queue, Send next releases them`;
}
