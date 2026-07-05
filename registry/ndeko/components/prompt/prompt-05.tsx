'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useId, useRef, useState } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';
import { Kbd, KbdGroup } from '@/registry/ndeko/ui/kbd';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { useAutosize } from './_parts/use-autosize';

/** Both layers share these metrics exactly, so the suggestion wraps where the typed text wraps. */
const TEXT_BOX =
  'border border-transparent px-2.5 py-2 text-base leading-normal md:text-[13px]';

const FIELD_SHELL = [
  'relative rounded-md bg-card shadow-[0_1px_2px_rgb(0_0_0/0.05)] hairline-ring ring-foreground/12',
  'transition-[box-shadow] duration-150 dark:bg-foreground/[0.04] dark:ring-foreground/15',
  'has-[textarea:focus]:ring-[3px] has-[textarea:focus]:ring-ring/25',
].join(' ');

const DEFAULT_DELAY_MS = 300;

const ACCEPTED_MESSAGE = 'Suggestion accepted';

const AVAILABLE_MESSAGE = 'Suggestion available, press Tab to accept';

function appendedPart(previous: string, next: string) {
  const isAppend = next.startsWith(previous);
  if (!isAppend) {
    return null;
  }
  return next.slice(previous.length);
}

/** The next word of a suggestion with the spaces before it, for Ctrl or Cmd plus Right. */
export function firstWordOf(suggestion: string) {
  const match = suggestion.match(/^\s*\S+/);
  return match?.[0] ?? suggestion;
}

function isCaretAtEnd(textarea: HTMLTextAreaElement) {
  const end = textarea.value.length;
  const isCollapsed = textarea.selectionStart === textarea.selectionEnd;
  const isAtEnd = textarea.selectionEnd === end;
  return isCollapsed && isAtEnd;
}

function isAbort(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

function hintOf(suggestion: string) {
  const trimmed = suggestion.trim();
  if (trimmed === '') {
    return '';
  }
  return `Suggestion: ${trimmed}. Tab accepts it, Control or Command with Right accepts one word, Escape dismisses it.`;
}

function WaitingDot() {
  const shouldReduceMotion = useReducedMotion();
  const pulse = pulseOf(shouldReduceMotion);

  return (
    <motion.span
      className='bg-primary ms-1 inline-block size-1.5 rounded-full align-middle'
      initial={{ opacity: 0.35 }}
      animate={pulse}
      transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

function pulseOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return { opacity: [0.35, 0.9, 0.35] };
  }
  return { opacity: [0.35, 1, 0.35], scale: [0.85, 1, 0.85] };
}

export type GhostTextareaProps = Omit<
  React.ComponentProps<'textarea'>,
  'value' | 'onChange' | 'defaultValue'
> & {
  value: string;
  onValueChange: (value: string) => void;
  /** Returns what would follow the text; an empty string means nothing to suggest. */
  suggest: (text: string, signal: AbortSignal) => Promise<string>;
  /** How long typing has to pause before a suggestion is asked for. */
  delay?: number;
  monospace?: boolean;
  /** Enter never adds a line, for a field of one line such as code or a title. */
  singleLine?: boolean;
  maxHeight?: number;
};

export function GhostTextarea({
  value,
  onValueChange,
  suggest,
  delay = DEFAULT_DELAY_MS,
  monospace = false,
  singleLine = false,
  maxHeight = 240,
  className,
  onKeyDown,
  onFocus,
  onBlur,
  onScroll,
  onSelect,
  ...props
}: GhostTextareaProps) {
  const [suggestion, setSuggestion] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const request = useRef<AbortController | null>(null);
  const hintId = useId();
  const hasSuggestion = suggestion !== '';
  const showsSuggestion = hasSuggestion && isFocused;
  const showsWaiting = isWaiting && isFocused;
  const hint = hintOf(suggestion);
  useAutosize(textareaRef, value, maxHeight);

  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
      request.current?.abort();
    };
  }, []);

  function cancelPending() {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    request.current?.abort();
    request.current = null;
    setIsWaiting(false);
  }

  function ask(text: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    if (!isCaretAtEnd(textarea)) {
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setIsWaiting(true);
    suggest(text, controller.signal)
      .then((next) => {
        if (controller.signal.aborted) {
          return;
        }
        setIsWaiting(false);
        setSuggestion(next);
        if (next.trim() !== '') {
          setAnnouncement(AVAILABLE_MESSAGE);
        }
      })
      .catch((error: unknown) => {
        if (isAbort(error)) {
          return;
        }
        setIsWaiting(false);
      });
  }

  function askAfterPause(text: string) {
    cancelPending();
    if (text.trim() === '') {
      return;
    }
    timer.current = setTimeout(() => {
      timer.current = null;
      ask(text);
    }, delay);
  }

  function changeValue(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const next = event.target.value;
    const typed = appendedPart(value, next);
    const isTyping = typed !== null && typed !== '';
    const keepsSuggestion = isTyping && suggestion.startsWith(typed);
    onValueChange(next);
    if (keepsSuggestion) {
      const rest = suggestion.slice(typed.length);
      setSuggestion(rest);
      if (rest === '') {
        askAfterPause(next);
      }
      return;
    }
    setSuggestion('');
    askAfterPause(next);
  }

  function accept(part: string) {
    const next = `${value}${part}`;
    const rest = suggestion.slice(part.length);
    onValueChange(next);
    setSuggestion(rest);
    setAnnouncement(ACCEPTED_MESSAGE);
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) {
        return;
      }
      const end = textarea.value.length;
      textarea.setSelectionRange(end, end);
    });
    if (rest === '') {
      askAfterPause(next);
    }
  }

  function dismiss() {
    cancelPending();
    setSuggestion('');
    setAnnouncement('Suggestion dismissed');
  }

  function handleKeys(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) {
      return;
    }
    const isEnter = event.key === 'Enter';
    const blocksNewLine = isEnter && singleLine;
    if (blocksNewLine) {
      event.preventDefault();
      return;
    }
    if (!hasSuggestion) {
      return;
    }
    const isTab = event.key === 'Tab' && !event.shiftKey;
    if (isTab) {
      event.preventDefault();
      accept(suggestion);
      return;
    }
    const hasWordModifier = event.ctrlKey || event.metaKey;
    const isWordKey = event.key === 'ArrowRight' && hasWordModifier;
    if (isWordKey) {
      event.preventDefault();
      accept(firstWordOf(suggestion));
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      dismiss();
    }
  }

  function handleFocus(event: React.FocusEvent<HTMLTextAreaElement>) {
    onFocus?.(event);
    setIsFocused(true);
    const shouldAsk = !hasSuggestion && !isWaiting;
    if (shouldAsk) {
      askAfterPause(event.currentTarget.value);
    }
  }

  function handleBlur(event: React.FocusEvent<HTMLTextAreaElement>) {
    onBlur?.(event);
    setIsFocused(false);
    cancelPending();
  }

  function followScroll(event: React.UIEvent<HTMLTextAreaElement>) {
    onScroll?.(event);
    const mirror = mirrorRef.current;
    if (mirror) {
      mirror.scrollTop = event.currentTarget.scrollTop;
    }
  }

  function handleSelect(event: React.SyntheticEvent<HTMLTextAreaElement>) {
    onSelect?.(event);
    const isAway = !isCaretAtEnd(event.currentTarget);
    if (!isAway) {
      return;
    }
    if (hasSuggestion) {
      setSuggestion('');
    }
    if (isWaiting) {
      cancelPending();
    }
  }

  return (
    <div className={cn(FIELD_SHELL, className)}>
      <div
        ref={mirrorRef}
        aria-hidden='true'
        className={cn(
          TEXT_BOX,
          'pointer-events-none absolute inset-0 overflow-hidden break-words whitespace-pre-wrap text-transparent',
          monospace && 'font-mono'
        )}
      >
        <span>{value}</span>
        {showsSuggestion && (
          <span className='text-muted-foreground/60'>{suggestion}</span>
        )}
        {showsWaiting && <WaitingDot />}
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={changeValue}
        onKeyDown={handleKeys}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onScroll={followScroll}
        onSelect={handleSelect}
        aria-describedby={hintId}
        spellCheck={!monospace}
        className={cn(
          TEXT_BOX,
          'placeholder:text-muted-foreground/75 relative block w-full resize-none bg-transparent outline-none',
          monospace && 'font-mono'
        )}
        {...props}
      />
      <span id={hintId} className='sr-only'>
        {hint}
      </span>
      <LiveRegion message={announcement} />
    </div>
  );
}

const PAUSE_MS = 420;

function wait(milliseconds: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(resolve, milliseconds);
    signal.addEventListener('abort', () => {
      clearTimeout(timeout);
      reject(new DOMException('The suggestion was cancelled', 'AbortError'));
    });
  });
}

const EMAIL_SENTENCES = [
  'Hi Maren,',
  'Thanks for sending the revised quote so quickly.',
  'I went through it with the team this morning and the new rates work for us.',
  'Could you send the contract by Friday so we can sign before the end of the month?',
  'Happy to jump on a call if anything needs a closer look.',
  'Best,',
  'Jonas',
];

const MIN_PREFIX = 3;

function separatorBefore(index: number) {
  const isAfterGreeting = index === 1;
  const isSignOff = index >= EMAIL_SENTENCES.length - 2;
  if (isAfterGreeting) {
    return '\n\n';
  }
  if (isSignOff) {
    return '\n\n';
  }
  return ' ';
}

function restOfSentence(text: string) {
  const lowered = text.toLowerCase();
  let best = '';
  for (const sentence of EMAIL_SENTENCES) {
    const loweredSentence = sentence.toLowerCase();
    for (let length = sentence.length - 1; length >= MIN_PREFIX; length -= 1) {
      const prefix = loweredSentence.slice(0, length);
      const isTyped = lowered.endsWith(prefix);
      const isLonger = length > best.length;
      const isBetter = isTyped && isLonger;
      if (isBetter) {
        best = sentence.slice(0, length);
        break;
      }
    }
  }
  if (best === '') {
    return '';
  }
  const sentence = EMAIL_SENTENCES.find((candidate) =>
    candidate.toLowerCase().startsWith(best.toLowerCase())
  );
  return sentence?.slice(best.length) ?? '';
}

function nextSentence(text: string) {
  const trimmed = text.trimEnd();
  const index = EMAIL_SENTENCES.findIndex((sentence) =>
    trimmed.endsWith(sentence)
  );
  const nextIndex = index + 1;
  const hasNext = index >= 0 && nextIndex < EMAIL_SENTENCES.length;
  if (!hasNext) {
    return '';
  }
  const separator = separatorBefore(nextIndex);
  const trailing = text.slice(trimmed.length);
  const sentence = EMAIL_SENTENCES[nextIndex];
  if (trailing !== '') {
    return sentence;
  }
  return `${separator}${sentence}`;
}

async function suggestEmail(text: string, signal: AbortSignal) {
  await wait(PAUSE_MS, signal);
  const rest = restOfSentence(text);
  if (rest !== '') {
    return rest;
  }
  return nextSentence(text);
}

const CODE_LINES = [
  "const paidOrders = orders.filter((order) => order.status === 'paid');",
  'const lateInvoices = invoices.filter((invoice) => invoice.dueAt < today);',
  'export function formatAmount(cents: number) {',
  'const dueSoon = invoices.filter((invoice) => invoice.daysLeft < 7);',
];

async function suggestCode(text: string, signal: AbortSignal) {
  await wait(PAUSE_MS, signal);
  const isLongEnough = text.trim().length >= 2;
  if (!isLongEnough) {
    return '';
  }
  const line = CODE_LINES.find((candidate) => {
    const isPrefix = candidate.startsWith(text);
    const isLonger = candidate.length > text.length;
    return isPrefix && isLonger;
  });
  return line?.slice(text.length) ?? '';
}

function KeyHints() {
  return (
    <p className='text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs'>
      <span className='inline-flex items-center gap-1'>
        <Kbd>Tab</Kbd> accepts
      </span>
      <span className='inline-flex items-center gap-1'>
        <KbdGroup aria-hidden='true'>
          <Kbd>Ctrl</Kbd>
          <Kbd>→</Kbd>
        </KbdGroup>
        <span className='sr-only'>Control or Command with Right</span>
        one word
      </span>
      <span className='inline-flex items-center gap-1'>
        <Kbd>Esc</Kbd> dismisses
      </span>
    </p>
  );
}

const EMAIL_START = 'Hi Maren,\n\nThanks for sending the revised';

const CODE_START = 'const paidOrders = orders.';

export default function Prompt05() {
  const [email, setEmail] = useState(EMAIL_START);
  const [code, setCode] = useState(CODE_START);
  const emailId = useId();
  const codeId = useId();

  return (
    <div className='flex w-full max-w-[32rem] flex-col gap-5'>
      <div className='flex flex-col gap-1.5'>
        <label htmlFor={emailId} className='text-[13px] font-medium'>
          Reply to Maren
        </label>
        <GhostTextarea
          id={emailId}
          value={email}
          onValueChange={setEmail}
          suggest={suggestEmail}
          rows={5}
          placeholder='Write your reply'
        />
      </div>
      <div className='flex flex-col gap-1.5'>
        <label htmlFor={codeId} className='text-[13px] font-medium'>
          orders.ts, line 18
        </label>
        <GhostTextarea
          id={codeId}
          value={code}
          onValueChange={setCode}
          suggest={suggestCode}
          monospace
          singleLine
          rows={1}
          placeholder='Type a line of code'
        />
      </div>
      <KeyHints />
    </div>
  );
}
