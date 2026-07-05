'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useId, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll } from '@/components/core/word-roll';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  EllipsisIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  Share2Icon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  TriangleAlertIcon,
  Volume2Icon,
} from '@/registry/ndeko/lib/icons';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import {
  MessageAction,
  MessageActions,
} from '@/registry/ndeko/ui/chat-message';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';
import { LevelBars } from '@/registry/ndeko/ui/level-bars';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from '@/registry/ndeko/ui/popover';
import { Textarea } from '@/registry/ndeko/ui/textarea';
import { Toggle } from '@/registry/ndeko/ui/toggle';

import { CopyAction } from './_parts/copy-action';
import { LabTile } from './_parts/lab-tile';
import { countOf, wordsOf } from './_parts/words';

export type Feedback = 'up' | 'down';

export type ReadState = 'idle' | 'reading';

const ACTION =
  'text-muted-foreground aria-pressed:bg-primary/10 aria-pressed:text-primary-ink';

export const FEEDBACK_REASONS = [
  'Not accurate',
  'Out of date',
  'Too long',
  'Missed the question',
  'Hard to follow',
] as const;

export type FeedbackReason = (typeof FEEDBACK_REASONS)[number];

const SEND_LABELS: Record<MorphState, string> = {
  idle: 'Send',
  busy: 'Sending',
  done: 'Thanks',
};

const SENDING_MS = 600;

const THANKS_MS = 900;

function readLabelOf(state: ReadState) {
  if (state === 'reading') {
    return 'Stop reading';
  }
  return 'Read aloud';
}

function withReason(
  reasons: FeedbackReason[],
  reason: FeedbackReason,
  isOn: boolean
) {
  const others = reasons.filter((candidate) => candidate !== reason);
  if (isOn) {
    return [...others, reason];
  }
  return others;
}

type ReasonPanelProps = {
  onSend: (reasons: FeedbackReason[], note: string) => void;
  onDone: () => void;
};

function ReasonPanel({ onSend, onDone }: ReasonPanelProps) {
  const [reasons, setReasons] = useState<FeedbackReason[]>([]);
  const [note, setNote] = useState('');
  const [sendState, setSendState] = useState<MorphState>('idle');
  const { schedule } = useTimeouts();
  const noteId = useId();
  const hasReason = reasons.length > 0;
  const hasNote = note.trim().length > 0;
  const canSend = hasReason || hasNote;

  function send() {
    if (!canSend) {
      return;
    }
    setSendState('busy');
    schedule(() => {
      setSendState('done');
      onSend(reasons, note.trim());
    }, SENDING_MS);
    const closeAt = SENDING_MS + THANKS_MS;
    schedule(onDone, closeAt);
  }

  return (
    <div className='flex flex-col gap-3'>
      <PopoverTitle>What went wrong?</PopoverTitle>
      <div role='group' aria-label='Reasons' className='flex flex-wrap gap-1.5'>
        {FEEDBACK_REASONS.map((reason) => (
          <Toggle
            key={reason}
            variant='outline'
            size='sm'
            pressed={reasons.includes(reason)}
            onPressedChange={(isOn) =>
              setReasons((current) => withReason(current, reason, isOn))
            }
            className='rounded-full text-xs'
          >
            {reason}
          </Toggle>
        ))}
      </div>
      <div className='flex flex-col gap-1.5'>
        <label htmlFor={noteId} className='text-xs font-medium'>
          Note{' '}
          <span className='text-muted-foreground font-normal'>(optional)</span>
        </label>
        <Textarea
          id={noteId}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder='The fee starts in November, not October'
          className='min-h-14'
        />
      </div>
      <div className='flex items-center justify-between gap-3'>
        <p className='text-muted-foreground text-xs'>
          {!canSend && 'Pick a reason or write a note'}
        </p>
        <MorphButton
          type='button'
          size='sm'
          state={sendState}
          labels={SEND_LABELS}
          disabled={!canSend}
          onClick={send}
        />
      </div>
    </div>
  );
}

type VersionSwitchProps = {
  index: number;
  count: number;
  onPrevious: () => void;
  onNext: () => void;
};

function VersionSwitch({
  index,
  count,
  onPrevious,
  onNext,
}: VersionSwitchProps) {
  const isFirst = index === 0;
  const isLast = index === count - 1;
  const position = index + 1;

  return (
    <span className='text-muted-foreground flex items-center text-xs'>
      <MessageAction tooltip='Previous version'>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label='Previous version'
          disabled={isFirst}
          onClick={onPrevious}
          className='text-muted-foreground size-6'
        >
          <ChevronLeftIcon className='size-3.5' />
        </Button>
      </MessageAction>
      <span className='inline-flex min-w-9 justify-center tabular-nums'>
        <MotionNumber value={position} />
        <span aria-hidden='true' className='px-0.5'>
          /
        </span>
        <span className='sr-only'> of </span>
        <MotionNumber value={count} />
      </span>
      <MessageAction tooltip='Next version'>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label='Next version'
          disabled={isLast}
          onClick={onNext}
          className='text-muted-foreground size-6'
        >
          <ChevronRightIcon className='size-3.5' />
        </Button>
      </MessageAction>
    </span>
  );
}

export type MessageActionBarProps = {
  copyText: string;
  versionIndex: number;
  versionCount: number;
  isRegenerating: boolean;
  /** Left out, Regenerate stays available. */
  canRegenerate?: boolean;
  onRegenerate: () => void;
  onPrevious: () => void;
  onNext: () => void;
  feedback: Feedback | null;
  onFeedback: (feedback: Feedback | null) => void;
  onSendReasons: (reasons: FeedbackReason[], note: string) => void;
  readState: ReadState;
  onToggleRead: () => void;
  onShare: () => void;
  onCopyMarkdown: () => void;
  onReport: () => void;
  onCopied?: () => void;
};

export function MessageActionBar({
  copyText,
  versionIndex,
  versionCount,
  isRegenerating,
  canRegenerate = true,
  onRegenerate,
  onPrevious,
  onNext,
  feedback,
  onFeedback,
  onSendReasons,
  readState,
  onToggleRead,
  onShare,
  onCopyMarkdown,
  onReport,
  onCopied,
}: MessageActionBarProps) {
  const [isReasonOpen, setIsReasonOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const isUp = feedback === 'up';
  const isDown = feedback === 'down';
  const isReading = readState === 'reading';
  const hasVersions = versionCount > 1;
  const isRegenerateOff = !canRegenerate || isRegenerating;
  const readLabel = readLabelOf(readState);
  const versionMotion = versionMotionOf(shouldReduceMotion);

  function pressUp() {
    setIsReasonOpen(false);
    if (isUp) {
      onFeedback(null);
      return;
    }
    onFeedback('up');
  }

  function changeReasonOpen(nextOpen: boolean) {
    if (!nextOpen) {
      setIsReasonOpen(false);
      return;
    }
    if (isDown) {
      onFeedback(null);
      return;
    }
    onFeedback('down');
    setIsReasonOpen(true);
  }

  return (
    <MessageActions className='-ms-1.5 flex-wrap'>
      <MessageAction tooltip='Copy'>
        <CopyAction
          text={copyText}
          label='Copy the answer'
          onCopied={onCopied}
        />
      </MessageAction>
      <MessageAction tooltip={regenerateTooltipOf(canRegenerate)}>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label='Regenerate the answer'
          disabled={isRegenerateOff}
          focusableWhenDisabled
          onClick={onRegenerate}
          className={ACTION}
        >
          <RefreshCwIcon
            className={cn('size-3.5', isRegenerating && 'animate-spin')}
          />
        </Button>
      </MessageAction>
      <AnimatePresence initial={false}>
        {hasVersions && (
          <motion.span
            key='versions'
            className='inline-flex overflow-hidden'
            {...versionMotion}
          >
            <VersionSwitch
              index={versionIndex}
              count={versionCount}
              onPrevious={onPrevious}
              onNext={onNext}
            />
          </motion.span>
        )}
      </AnimatePresence>
      <MessageAction tooltip='Good answer'>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label='Good answer'
          aria-pressed={isUp}
          onClick={pressUp}
          className={ACTION}
        >
          <Swap swapKey={String(isUp)}>
            <ThumbsUpIcon className='size-3.5' />
          </Swap>
        </Button>
      </MessageAction>
      <Popover open={isReasonOpen} onOpenChange={changeReasonOpen}>
        <MessageAction tooltip='Bad answer'>
          <PopoverTrigger
            render={
              <Button
                type='button'
                variant='ghost'
                size='icon-sm'
                aria-label='Bad answer'
                aria-pressed={isDown}
                className={ACTION}
              />
            }
          >
            <Swap swapKey={String(isDown)}>
              <ThumbsDownIcon className='size-3.5' />
            </Swap>
          </PopoverTrigger>
        </MessageAction>
        <PopoverContent
          side='bottom'
          align='start'
          className='w-80 max-w-[calc(100vw-2rem)]'
        >
          <ReasonPanel
            onSend={onSendReasons}
            onDone={() => setIsReasonOpen(false)}
          />
        </PopoverContent>
      </Popover>
      <MessageAction tooltip={readLabel}>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          aria-label={readLabel}
          onClick={onToggleRead}
          className={cn(
            'text-muted-foreground h-7 min-w-7 px-1.5',
            isReading && 'bg-primary/10 text-primary-ink'
          )}
        >
          <AnimatedSize
            as='span'
            axis='width'
            contentClassName='flex items-center justify-center'
          >
            <Swap swapKey={readState}>
              {isReading && (
                <span className='flex items-center gap-1.5'>
                  <LevelBars
                    isActive
                    count={4}
                    seed={1.7}
                    className='h-3.5 gap-[2px]'
                    barClassName='w-[2px]'
                  />
                  <span className='text-xs'>Stop</span>
                </span>
              )}
              {!isReading && <Volume2Icon className='size-3.5' />}
            </Swap>
          </AnimatedSize>
        </Button>
      </MessageAction>
      <DropdownMenu>
        <MessageAction tooltip='More'>
          <DropdownMenuTrigger
            render={
              <Button
                type='button'
                variant='ghost'
                size='icon-sm'
                aria-label='More actions'
                className={ACTION}
              />
            }
          >
            <EllipsisIcon className='size-3.5' />
          </DropdownMenuTrigger>
        </MessageAction>
        <DropdownMenuContent align='end' className='min-w-48'>
          <DropdownMenuItem onClick={onShare}>
            <Share2Icon />
            Share
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onCopyMarkdown}>
            <CopyIcon />
            Copy as Markdown
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant='destructive' onClick={onReport}>
            <TriangleAlertIcon />
            Report
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </MessageActions>
  );
}

function regenerateTooltipOf(canRegenerate: boolean) {
  if (canRegenerate) {
    return 'Regenerate';
  }
  return 'This demo keeps four versions';
}

const VERSION_ENTER = {
  initial: { opacity: 0, width: 0 },
  animate: { opacity: 1, width: 'auto' },
  exit: { opacity: 0, width: 0 },
  transition: { type: 'spring', bounce: 0, duration: 0.3 },
} as const;

const VERSION_FADE = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 },
} as const;

function versionMotionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return VERSION_FADE;
  }
  return VERSION_ENTER;
}

type Version = {
  id: string;
  sentences: string[];
};

const VERSION_TEXTS: string[][] = [
  [
    'The flat fee of 18.40 EUR per pallet starts on 1 October and only covers orders of 40 pallets or more.',
    'Smaller orders keep the tiered rate, which starts at 15.90 EUR.',
    'If most of your orders stay under 40 pallets, your price does not change until the contract renews.',
  ],
  [
    'From 1 October, Brightmoor bills 18.40 EUR per pallet on orders of 40 pallets and up.',
    'Below that, the tiers stay, from 15.90 EUR.',
    'A quick check: if your usual order is under 40 pallets, nothing changes for you.',
  ],
  [
    'In short, 40 pallets or more now costs a flat 18.40 EUR each, starting 1 October.',
    'Under 40, the old tiers from 15.90 EUR still apply.',
    'Most small buyers will not see a difference on their invoices.',
  ],
  [
    'Nothing changes for small orders.',
    'The new flat fee of 18.40 EUR per pallet only applies from 40 pallets, from 1 October.',
    'Orders under that keep the tiered rate starting at 15.90 EUR.',
  ],
];

const MAX_VERSIONS = VERSION_TEXTS.length;

const REGENERATE_MS = 1100;

const WORD_READ_MS = 330;

const SHARE_LINK = 'https://chat.lumen.example/s/7fq2-pallet-fee';

const QUESTION = 'Does the new pallet fee change anything for small orders?';

function versionOf(index: number): Version {
  const sentences = VERSION_TEXTS[index] ?? VERSION_TEXTS[0];
  const number = index + 1;
  return { id: `v${number}`, sentences };
}

function versionLineOf(index: number, count: number) {
  const number = index + 1;
  return `Version ${number} of ${count}`;
}

function leadingSpaceOf(index: number) {
  if (index === 0) {
    return '';
  }
  return ' ';
}

function textOf(version: Version) {
  return version.sentences.join(' ');
}

function markdownOf(version: Version) {
  const body = textOf(version);
  return `**Lumen**\n\n${body}`;
}

function readTimesOf(sentences: string[]) {
  const times: number[] = [];
  let elapsed = 0;
  for (const sentence of sentences) {
    times.push(elapsed);
    const wordCount = wordsOf(sentence).length;
    elapsed += wordCount * WORD_READ_MS;
  }
  return { starts: times, total: elapsed };
}

function sentenceToneOf(isRead: boolean) {
  if (isRead) {
    return 'bg-primary/10';
  }
  return 'bg-transparent';
}

function bodyToneOf(isRegenerating: boolean) {
  if (isRegenerating) {
    return 'opacity-45';
  }
  return 'opacity-100';
}

const BODY_SWAP = {
  initial: { opacity: 0, filter: 'blur(2px)' },
  animate: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(2px)' },
  transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] },
} as const;

const BODY_FADE = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 },
} as const;

function bodyMotionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return BODY_FADE;
  }
  return BODY_SWAP;
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    return false;
  }
  return true;
}

function feedbackLineOf(feedback: Feedback | null) {
  if (feedback === 'up') {
    return 'Marked as a good answer';
  }
  if (feedback === 'down') {
    return 'Marked as a bad answer';
  }
  return 'Feedback removed';
}

export default function Answer03() {
  const [versions, setVersions] = useState<Version[]>(() => [versionOf(0)]);
  const [versionIndex, setVersionIndex] = useState(0);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [readState, setReadState] = useState<ReadState>('idle');
  const [readIndex, setReadIndex] = useState<number | null>(null);
  const [isReported, setIsReported] = useState(false);
  const [notice, setNotice] = useState('');
  const regenerateTimers = useTimeouts();
  const readTimers = useTimeouts();
  const shouldReduceMotion = useReducedMotion();
  const bodyMotion = bodyMotionOf(shouldReduceMotion);
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const version = versions[versionIndex];
  const canRegenerate = versions.length < MAX_VERSIONS;
  const versionWords = versionLineOf(versionIndex, versions.length);

  function stopReading() {
    readTimers.clearAll();
    setReadState('idle');
    setReadIndex(null);
  }

  function startReading() {
    const { starts, total } = readTimesOf(version.sentences);
    setReadState('reading');
    setReadIndex(0);
    setNotice('Reading the answer aloud');
    starts.forEach((start, index) => {
      readTimers.schedule(() => setReadIndex(index), start);
    });
    readTimers.schedule(() => {
      setReadState('idle');
      setReadIndex(null);
      setNotice('Finished reading');
    }, total);
  }

  function toggleRead() {
    if (readState === 'reading') {
      stopReading();
      setNotice('Stopped reading');
      return;
    }
    startReading();
  }

  function regenerate() {
    const isFull = !canRegenerate;
    if (isFull || isRegenerating) {
      return;
    }
    stopReading();
    setIsRegenerating(true);
    setNotice('Writing a new version');
    const nextIndex = versions.length;
    const nextCount = nextIndex + 1;
    regenerateTimers.schedule(() => {
      setVersions((current) => [...current, versionOf(nextIndex)]);
      setVersionIndex(nextIndex);
      setIsRegenerating(false);
      setNotice(versionLineOf(nextIndex, nextCount));
    }, REGENERATE_MS);
  }

  function showVersion(index: number) {
    stopReading();
    setVersionIndex(index);
    setNotice(versionLineOf(index, versions.length));
  }

  function showPrevious() {
    const previous = versionIndex - 1;
    showVersion(previous);
  }

  function showNext() {
    const next = versionIndex + 1;
    showVersion(next);
  }

  function changeFeedback(next: Feedback | null) {
    setFeedback(next);
    setNotice(feedbackLineOf(next));
  }

  function sendReasons(reasons: string[], note: string) {
    const hasNote = note !== '';
    if (hasNote) {
      setNotice('Thanks, your note was sent');
      return;
    }
    const sent = countOf(reasons.length, 'reason');
    setNotice(`Thanks, ${sent} sent`);
  }

  async function share() {
    const isCopied = await copyToClipboard(SHARE_LINK);
    if (isCopied) {
      setNotice('Share link copied');
    }
  }

  async function copyMarkdown() {
    const isCopied = await copyToClipboard(markdownOf(version));
    if (isCopied) {
      setNotice('Copied as Markdown');
    }
  }

  function report() {
    setIsReported(true);
    setNotice('Answer reported');
  }

  function undoReport() {
    setIsReported(false);
    setNotice('Report withdrawn');
  }

  return (
    <div className='bg-card hairline-ring ring-border flex w-full max-w-[32rem] flex-col gap-4 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <div className='flex justify-end'>
        <p className='bg-foreground/[0.05] dark:bg-foreground/[0.07] max-w-[85%] rounded-xl px-3.5 py-2 text-sm leading-relaxed text-balance'>
          {QUESTION}
        </p>
      </div>
      <div className='flex items-start gap-2.5'>
        <LabTile lab='lumen' className='mt-0.5' />
        <div className='flex min-w-0 flex-1 flex-col gap-2'>
          <p className='text-muted-foreground flex items-center gap-1.5 text-xs'>
            <span className='text-foreground font-medium'>Lumen</span>
            <span aria-hidden='true'>·</span>
            <WordRoll text={versionWords} />
          </p>
          <AnimatedSize>
            <div className='relative'>
              <AnimatePresence initial={false} mode='popLayout'>
                <motion.p
                  key={version.id}
                  className={cn(
                    'text-sm leading-relaxed transition-opacity duration-200',
                    bodyToneOf(isRegenerating)
                  )}
                  {...bodyMotion}
                >
                  {version.sentences.map((sentence, index) => {
                    const isRead = readIndex === index;
                    return (
                      <span key={index}>
                        {leadingSpaceOf(index)}
                        <span
                          className={cn(
                            'rounded-[4px] box-decoration-clone transition-colors duration-200',
                            sentenceToneOf(isRead)
                          )}
                        >
                          {sentence}
                        </span>
                      </span>
                    );
                  })}
                </motion.p>
              </AnimatePresence>
            </div>
          </AnimatedSize>
          <MessageActionBar
            copyText={textOf(version)}
            versionIndex={versionIndex}
            versionCount={versions.length}
            isRegenerating={isRegenerating}
            canRegenerate={canRegenerate}
            onRegenerate={regenerate}
            onPrevious={showPrevious}
            onNext={showNext}
            feedback={feedback}
            onFeedback={changeFeedback}
            onSendReasons={sendReasons}
            readState={readState}
            onToggleRead={toggleRead}
            onShare={share}
            onCopyMarkdown={copyMarkdown}
            onReport={report}
            onCopied={() => setNotice('Answer copied')}
          />
          <AnimatePresence initial={false}>
            {isReported && (
              <motion.div
                key='reported'
                className='overflow-hidden'
                {...rowPresence}
              >
                <div className='bg-destructive/10 text-destructive-ink flex items-center gap-2 rounded-lg py-1.5 ps-2.5 pe-1.5 text-xs'>
                  <TriangleAlertIcon className='size-3.5 shrink-0' />
                  <span className='min-w-0 flex-1'>
                    Reported. Someone will review this answer.
                  </span>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={undoReport}
                    className='h-6 px-2'
                  >
                    <RotateCcwIcon className='size-3.5' />
                    Undo
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <LiveRegion message={notice} />
    </div>
  );
}
