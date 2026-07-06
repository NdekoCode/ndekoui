'use client';

import { type CallStatus } from '@/registry/ndeko/lib/agent-run';
import { pressedSolidOf } from '@/registry/ndeko/lib/demonstration';
import { ArrowUpIcon, MessageCircleIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { wordsOf } from '@/registry/ndeko/lib/words';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { Button } from '@/registry/ndeko/ui/button';
import { CallStatusMark } from '@/registry/ndeko/ui/call-status';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';
import {
  shownCountOf,
  StreamedWords,
  useRevealedCount,
} from '@/registry/ndeko/ui/streamed-text';

import {
  ASSISTANT,
  EXCHANGES,
  PERSON,
  type Suggestion,
  type ToolLine,
} from './data';
import { isAnswering, WORD_MS, type Phase, type Turn } from './chat-session';

const FIELD_SHELL =
  'bg-card hairline-ring ring-foreground/12 rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.05)] dark:bg-foreground/[0.04] dark:ring-foreground/15';

const TOOL_ARRIVAL =
  'transition-[opacity] duration-300 ease-(--ease-out-strong) starting:opacity-0 motion-safe:starting:translate-y-1';

function statusWordOf(phase: Phase) {
  if (phase === 'thinking') {
    return 'Thinking';
  }
  if (phase === 'reading') {
    return 'Reading your apps';
  }
  return null;
}

function toolStatusOf(index: number, toolsShown: number): CallStatus {
  if (index < toolsShown) {
    return 'done';
  }
  return 'running';
}

export function EmptyThread() {
  return (
    <div className='text-muted-foreground m-auto flex flex-col items-center gap-3 p-6 text-center text-[13px]'>
      <span className='keycap-3d flex size-9 items-center justify-center rounded-lg'>
        <MessageCircleIcon />
      </span>
      <p className='max-w-56 text-pretty'>
        Ask about your calendar, your mail or your notes
      </p>
    </div>
  );
}

export function PersonMessage({ text }: { text: string }) {
  return (
    <div className='flex items-end justify-end gap-2'>
      <p className='bg-foreground/[0.06] max-w-[85%] rounded-2xl rounded-ee-md px-3.5 py-2 text-sm leading-relaxed text-pretty'>
        {text}
      </p>
      <Avatar
        className='size-7 shrink-0'
        seed={PERSON.name}
        role='img'
        aria-label={PERSON.name}
      />
    </div>
  );
}

function StatusLine({ word }: { word: string }) {
  return (
    <p className='text-muted-foreground flex h-6 items-center gap-2 text-[13px]'>
      <span
        aria-hidden='true'
        className='bg-primary size-1.5 animate-pulse rounded-full'
      />
      <Swap swapKey={word}>{word}</Swap>
    </p>
  );
}

function ToolRow({ tool, status }: { tool: ToolLine; status: CallStatus }) {
  return (
    <li
      className={cn(
        'bg-foreground/[0.04] flex h-9 items-center gap-2 rounded-lg ps-1 pe-2.5 text-xs',
        TOOL_ARRIVAL
      )}
    >
      <BrandTile brand={tool.brand} size='lg' />
      <span className='min-w-0 flex-1 truncate'>{tool.label}</span>
      <CallStatusMark status={status} />
    </li>
  );
}

type ToolListProps = {
  tools: ToolLine[];
  toolsShown: number;
  phase: Phase;
};

function ToolList({ tools, toolsShown, phase }: ToolListProps) {
  const hasTools = tools.length > 0;
  if (!hasTools) {
    return null;
  }
  const isReading = phase === 'reading';
  let shownTools = tools;
  if (isReading) {
    shownTools = tools.slice(0, toolsShown + 1);
  }

  return (
    <ul aria-label='Apps read' className='flex flex-col gap-1.5'>
      {shownTools.map((tool, index) => (
        <ToolRow
          key={tool.label}
          tool={tool}
          status={toolStatusOf(index, toolsShown)}
        />
      ))}
    </ul>
  );
}

type AnswerProps = {
  text: string;
  phase: Phase;
  isActive: boolean;
};

function Answer({ text, phase, isActive }: AnswerProps) {
  const words = wordsOf(text);
  const isStreaming = phase === 'streaming';
  const isRunning = isStreaming && isActive;
  const count = useRevealedCount(words.length, isRunning, WORD_MS);
  const shown = shownCountOf(isStreaming, count, words.length);

  return (
    <p className='text-sm leading-relaxed text-pretty'>
      <StreamedWords words={words} shown={shown} isStreaming={isStreaming} />
    </p>
  );
}

type AssistantTurnProps = {
  turn: Turn;
  phase: Phase;
  toolsShown: number;
  isActive: boolean;
};

export function AssistantTurn({
  turn,
  phase,
  toolsShown,
  isActive,
}: AssistantTurnProps) {
  const exchange = EXCHANGES[turn.exchangeId];
  const statusWord = statusWordOf(phase);
  const hasAnswer = phase === 'streaming' || phase === 'done';

  return (
    <div className='flex items-start gap-2.5'>
      <MeshTile seed={ASSISTANT.name} size='lg' className='mt-0.5' />
      <div className='flex min-w-0 flex-1 flex-col gap-2'>
        <p className='text-xs font-medium'>{ASSISTANT.name}</p>
        {statusWord && <StatusLine word={statusWord} />}
        <ToolList
          tools={exchange.tools}
          toolsShown={toolsShown}
          phase={phase}
        />
        {hasAnswer && (
          <Answer text={exchange.answer} phase={phase} isActive={isActive} />
        )}
      </div>
    </div>
  );
}

type SuggestionsProps = {
  suggestions: Suggestion[];
  phase: Phase;
  onAsk: (suggestion: Suggestion) => void;
};

export function Suggestions({ suggestions, phase, onAsk }: SuggestionsProps) {
  const isBusy = isAnswering(phase);

  return (
    <ul aria-label='Questions to try' className='flex flex-wrap gap-1.5'>
      {suggestions.map((suggestion) => (
        <li key={suggestion.exchangeId}>
          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={isBusy}
            focusableWhenDisabled
            onClick={() => onAsk(suggestion)}
            className='h-7 text-xs'
          >
            {suggestion.label}
          </Button>
        </li>
      ))}
    </ul>
  );
}

function isSendKey(event: React.KeyboardEvent<HTMLTextAreaElement>) {
  const isPlainEnter = event.key === 'Enter' && !event.shiftKey;
  return isPlainEnter && !event.nativeEvent.isComposing;
}

type ComposerProps = {
  draft: string;
  canSend: boolean;
  isDemonstrating: boolean;
  pressed: string | null;
  onDraftChange: (text: string) => void;
  onSend: () => void;
};

export function Composer({
  draft,
  canSend,
  isDemonstrating,
  pressed,
  onDraftChange,
  onSend,
}: ComposerProps) {
  function handleKeys(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!isSendKey(event)) {
      return;
    }
    event.preventDefault();
    if (canSend) {
      onSend();
    }
  }

  return (
    <div
      className={cn(
        FIELD_SHELL,
        'has-[textarea:focus-visible]:ring-ring/25 flex items-end gap-2 p-2 transition-[box-shadow] duration-150 has-[textarea:focus-visible]:ring-[3px]'
      )}
    >
      <textarea
        value={draft}
        rows={2}
        readOnly={isDemonstrating}
        aria-label='Message to Murmura'
        placeholder='Ask about your day'
        onChange={(event) => onDraftChange(event.target.value)}
        onKeyDown={handleKeys}
        className='placeholder:text-muted-foreground/75 min-h-12 flex-1 resize-none bg-transparent px-1.5 py-1 text-base leading-normal outline-none md:text-[13px]'
      />
      <Button
        type='button'
        size='icon'
        aria-label='Send the message'
        disabled={!canSend}
        onClick={onSend}
        className={pressedSolidOf(pressed === 'send')}
      >
        <ArrowUpIcon />
      </Button>
    </div>
  );
}
