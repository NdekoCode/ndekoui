'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

import { useNow } from '@/registry/ndeko/hooks/use-agent-run';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import {
  CheckIcon,
  CircleAlertIcon,
  LoaderIcon,
  MicIcon,
  RotateCcwIcon,
} from '@/registry/ndeko/lib/icons';
import { risePresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { TextLoader } from '@/registry/ndeko/ui/chat-loader';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Textarea } from '@/registry/ndeko/ui/textarea';

import { formatClock } from '@/registry/ndeko/lib/media-clock';
import { LevelBars } from '@/registry/ndeko/ui/level-bars';

export type DictationTake = {
  /** How long the person spoke, in milliseconds. */
  durationMs: number;
};

type Phase = 'idle' | 'recording' | 'transcribing' | 'writing' | 'failed';

type Failure = 'short' | 'error';

type Range = {
  start: number;
  end: number;
};

const MIN_TAKE_MS = 1000;

const WORD_GAP_MS = 75;

const BAR_COUNT = 24;

const MAX_FIELD_HEIGHT = 220;

const FAILURE_TEXT: Record<Failure, string> = {
  short: 'That was under a second. Record a little longer',
  error: 'The words could not be transcribed. Try again',
};

type KeyLook = {
  key: string;
  label: string;
  glyph: React.ReactNode;
};

function keyLookOf(phase: Phase): KeyLook {
  if (phase === 'recording') {
    return {
      key: 'done',
      label: 'Stop and transcribe',
      glyph: <CheckIcon />,
    };
  }
  const isBusy = phase === 'transcribing' || phase === 'writing';
  if (isBusy) {
    return {
      key: 'busy',
      label: 'Transcribing',
      glyph: <LoaderIcon className='animate-spin' />,
    };
  }
  return { key: 'mic', label: 'Start dictation', glyph: <MicIcon /> };
}

function needsSpaceBetween(before: string, after: string) {
  if (before === '') {
    return false;
  }
  if (after === '') {
    return false;
  }
  const endsWithSpace = /\s$/.test(before);
  const startsWithSpace = /^\s/.test(after);
  return !endsWithSpace && !startsWithSpace;
}

function spaceIf(isNeeded: boolean) {
  if (isNeeded) {
    return ' ';
  }
  return '';
}

function wordsIn(text: string) {
  const trimmed = text.trim();
  if (trimmed === '') {
    return [];
  }
  return trimmed.split(/\s+/);
}

function Elapsed({ since }: { since: number }) {
  const now = useNow(250, true);
  const elapsed = now - since;
  const text = formatClock(elapsed);

  return (
    <span className='text-muted-foreground w-9 shrink-0 text-end text-xs tabular-nums'>
      {text}
    </span>
  );
}

function RecordingDot() {
  return (
    <motion.span
      aria-hidden='true'
      className='bg-destructive size-2 shrink-0 rounded-full'
      animate={{ opacity: [1, 0.35, 1] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

function announcementOf(phase: Phase, failure: Failure | null, added: string) {
  if (phase === 'recording') {
    return 'Recording. Press the key again or Space to stop, Escape to cancel';
  }
  if (phase === 'transcribing') {
    return 'Transcribing';
  }
  if (phase === 'failed') {
    return FAILURE_TEXT[failure ?? 'error'];
  }
  return added;
}

export type DictationFieldProps = {
  value: string;
  onValueChange: (value: string) => void;
  /** Turns a finished take into text; plug a speech service in here. It is called once Done is pressed. */
  transcribe: (take: DictationTake, signal: AbortSignal) => Promise<string>;
  /** The live microphone level between 0 and 1; left out, the bars follow a simulated voice. */
  level?: () => number;
  label: string;
  placeholder?: string;
  className?: string;
};

export function DictationField({
  value,
  onValueChange,
  transcribe,
  level,
  label,
  placeholder,
  className,
}: DictationFieldProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [failure, setFailure] = useState<Failure | null>(null);
  const [recordingSince, setRecordingSince] = useState(0);
  const [added, setAdded] = useState('');
  const { schedule, clearAll } = useTimeouts();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const keyRef = useRef<HTMLButtonElement>(null);
  const selection = useRef<Range | null>(null);
  const insertAt = useRef<Range>({ start: 0, end: 0 });
  const lastTake = useRef<DictationTake | null>(null);
  const request = useRef<AbortController | null>(null);
  const fieldId = useId();
  const shouldReduceMotion = useReducedMotion();
  const presence = risePresenceOf(shouldReduceMotion);
  const keyLook = keyLookOf(phase);
  const isRecording = phase === 'recording';
  const isTranscribing = phase === 'transcribing';
  const isWriting = phase === 'writing';
  const isFailed = phase === 'failed';
  const isBusy = isTranscribing || isWriting;
  const canCancel = isRecording || isTranscribing;
  const isLocked = isRecording || isBusy;
  const canRetry = isFailed && failure === 'error';
  const announcement = announcementOf(phase, failure, added);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    textarea.style.height = 'auto';
    const height = Math.min(textarea.scrollHeight, MAX_FIELD_HEIGHT);
    textarea.style.height = `${height}px`;
  }, [value]);

  useEffect(() => {
    return () => request.current?.abort();
  }, []);

  function rememberSelection(event: React.SyntheticEvent<HTMLTextAreaElement>) {
    const textarea = event.currentTarget;
    selection.current = {
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
    };
  }

  function caretRange(): Range {
    const saved = selection.current;
    if (saved) {
      return saved;
    }
    const end = value.length;
    return { start: end, end };
  }

  function startRecording() {
    clearAll();
    request.current?.abort();
    insertAt.current = caretRange();
    setFailure(null);
    setAdded('');
    setRecordingSince(Date.now());
    setPhase('recording');
  }

  function cancel() {
    clearAll();
    request.current?.abort();
    setPhase('idle');
    setAdded('Dictation cancelled');
    keyRef.current?.focus();
  }

  function writeWords(text: string) {
    const range = insertAt.current;
    const before = value.slice(0, range.start);
    const after = value.slice(range.end);
    const leading = spaceIf(needsSpaceBetween(before, text));
    const trailing = spaceIf(needsSpaceBetween(text, after));
    const words = wordsIn(text);
    const trimmedText = text.trim();
    setPhase('writing');
    words.forEach((_, index) => {
      const count = index + 1;
      const isLast = count === words.length;
      const shownWords = words.slice(0, count);
      const shown = shownWords.join(' ');
      const tail = trailingIf(isLast, trailing);
      const next = `${before}${leading}${shown}${tail}${after}`;
      const delay = count * WORD_GAP_MS;
      schedule(() => onValueChange(next), delay);
    });
    const caret = before.length + leading.length + trimmedText.length;
    const doneAt = (words.length + 1) * WORD_GAP_MS;
    schedule(() => {
      setPhase('idle');
      setAdded(`Added: ${trimmedText}`);
      const textarea = textareaRef.current;
      textarea?.focus();
      textarea?.setSelectionRange(caret, caret);
      selection.current = { start: caret, end: caret };
    }, doneAt);
  }

  function runTranscription(take: DictationTake) {
    const controller = new AbortController();
    request.current = controller;
    setPhase('transcribing');
    transcribe(take, controller.signal)
      .then((text) => {
        if (controller.signal.aborted) {
          return;
        }
        writeWords(text);
      })
      .catch(() => {
        if (controller.signal.aborted) {
          return;
        }
        setFailure('error');
        setPhase('failed');
      });
  }

  function finishRecording() {
    const durationMs = Date.now() - recordingSince;
    const take = { durationMs };
    const isTooShort = durationMs < MIN_TAKE_MS;
    if (isTooShort) {
      setFailure('short');
      setPhase('failed');
      return;
    }
    lastTake.current = take;
    runTranscription(take);
  }

  function retry() {
    const take = lastTake.current;
    if (!take) {
      return;
    }
    runTranscription(take);
  }

  function dismiss() {
    setPhase('idle');
    setFailure(null);
    keyRef.current?.focus();
  }

  function pressKey() {
    if (isRecording) {
      finishRecording();
      return;
    }
    if (isBusy) {
      return;
    }
    startRecording();
  }

  function handleEscape(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Escape') {
      return;
    }
    if (!canCancel) {
      return;
    }
    event.preventDefault();
    cancel();
  }

  return (
    <div
      onKeyDown={handleEscape}
      className={cn(
        'bg-card hairline-ring ring-foreground/12 dark:ring-foreground/15 has-[textarea:focus]:ring-ring/25 flex flex-col rounded-xl p-1.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-shadow duration-150 has-[textarea:focus]:ring-[3px]',
        className
      )}
    >
      <label htmlFor={fieldId} className='sr-only'>
        {label}
      </label>
      <Textarea
        ref={textareaRef}
        id={fieldId}
        rows={2}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onSelect={rememberSelection}
        readOnly={isLocked}
        placeholder={placeholder}
        className='max-h-none min-h-14 border-0 bg-transparent px-2 py-1.5 shadow-none ring-0 focus-visible:ring-0 dark:bg-transparent'
      />
      <div className='flex min-h-8 items-center gap-2 ps-1.5'>
        <div className='relative flex min-w-0 flex-1 items-center'>
          <AnimatePresence initial={false} mode='popLayout'>
            {isRecording && (
              <motion.div
                key='recording'
                className='flex min-w-0 flex-1 items-center gap-2.5'
                {...presence}
              >
                <RecordingDot />
                <LevelBars
                  isActive
                  level={level}
                  count={BAR_COUNT}
                  seed={0.8}
                  className='min-w-0 flex-1 justify-end overflow-hidden'
                />
                <Elapsed since={recordingSince} />
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={cancel}
                  className='text-muted-foreground'
                >
                  Cancel
                </Button>
              </motion.div>
            )}
            {isTranscribing && (
              <motion.div
                key='transcribing'
                className='flex min-w-0 flex-1 items-center justify-between gap-2'
                {...presence}
              >
                <TextLoader text='Transcribing' size='sm' />
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={cancel}
                  className='text-muted-foreground'
                >
                  Cancel
                </Button>
              </motion.div>
            )}
            {isWriting && (
              <motion.p
                key='writing'
                className='text-muted-foreground flex-1 text-xs'
                {...presence}
              >
                Adding the words at the caret
              </motion.p>
            )}
            {isFailed && (
              <motion.div
                key='failed'
                className='flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1'
                {...presence}
              >
                <p className='text-destructive-ink flex min-w-0 flex-1 items-start gap-1.5 text-xs leading-5'>
                  <CircleAlertIcon className='mt-0.5 size-3.5 shrink-0' />
                  {FAILURE_TEXT[failure ?? 'error']}
                </p>
                <span className='flex items-center gap-1'>
                  {canRetry && (
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={retry}
                    >
                      <RotateCcwIcon />
                      Retry
                    </Button>
                  )}
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={dismiss}
                    className='text-muted-foreground'
                  >
                    Dismiss
                  </Button>
                </span>
              </motion.div>
            )}
            {phase === 'idle' && (
              <motion.p
                key='idle'
                className='text-muted-foreground flex-1 truncate text-xs'
                {...presence}
              >
                Press the microphone, or Space on it, to dictate
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <Button
          ref={keyRef}
          type='button'
          size='icon'
          aria-label={keyLook.label}
          disabled={isBusy}
          focusableWhenDisabled
          onClick={pressKey}
          className={busyClassOf(isBusy)}
        >
          <AnimatedSize as='span' axis='width'>
            <Swap swapKey={keyLook.key}>{keyLook.glyph}</Swap>
          </AnimatedSize>
        </Button>
      </div>
      <LiveRegion message={announcement} />
    </div>
  );
}

function trailingIf(isLast: boolean, trailing: string) {
  if (isLast) {
    return trailing;
  }
  return '';
}

/** While it transcribes, the key keeps its colour: it is working, not unavailable. */
function busyClassOf(isBusy: boolean) {
  if (isBusy) {
    return 'data-disabled:opacity-100 disabled:opacity-100';
  }
  return undefined;
}

const SHORT_TAKE_MS = 3500;

const SHORT_PHRASE = 'Move the launch review to Thursday at ten';

const LONG_PHRASE =
  'Move the launch review to Thursday at ten and ask Priya to bring the rollout numbers for the three pilot teams';

const TRANSCRIBE_MS = 1100;

function wait(milliseconds: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(resolve, milliseconds);
    signal.addEventListener('abort', () => {
      clearTimeout(timeout);
      reject(new DOMException('The transcription was cancelled', 'AbortError'));
    });
  });
}

/** A longer take gives a longer sentence, the way a real speech service would. */
async function demoTranscribe(take: DictationTake, signal: AbortSignal) {
  await wait(TRANSCRIBE_MS, signal);
  const isShort = take.durationMs < SHORT_TAKE_MS;
  if (isShort) {
    return SHORT_PHRASE;
  }
  return LONG_PHRASE;
}

const START_TEXT = 'Notes for Monday: ';

export default function Voice03() {
  const [notes, setNotes] = useState(START_TEXT);

  return (
    <div className='flex w-full max-w-[26rem] flex-col gap-2'>
      <p className='px-1 text-[13px] font-medium'>Meeting notes</p>
      <DictationField
        value={notes}
        onValueChange={setNotes}
        transcribe={demoTranscribe}
        label='Meeting notes'
        placeholder='Type or dictate your notes'
      />
      <p className='text-muted-foreground px-1 text-[11px]'>
        Illustrative: the levels and the words are simulated, no microphone is
        used
      </p>
    </div>
  );
}
