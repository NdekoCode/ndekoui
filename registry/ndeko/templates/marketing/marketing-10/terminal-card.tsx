'use client';

import { useRef } from 'react';

import { useFollowBottom } from '@/registry/ndeko/hooks/use-follow-bottom';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Kbd } from '@/registry/ndeko/ui/kbd';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { BentoCard } from './bento-card';
import { PERSON } from './data';
import {
  type Entry,
  INITIAL,
  LOOP_AFTER_MS,
  type OutputTone,
  reducer,
  RESTING,
  SCRIPT,
} from './terminal-session';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

const LINE_STAGGER_MS = 80;

const TONE_CLASS: Record<OutputTone, string> = {
  plain: 'text-foreground',
  muted: 'text-muted-foreground',
  success: 'text-success-foreground',
};

function messageOf(entry: Entry | undefined) {
  if (!entry) {
    return '';
  }
  const lines = entry.output.map((line) => line.text);
  return `${entry.command}: ${lines.join('. ')}`;
}

function EntryView({ entry }: { entry: Entry }) {
  return (
    <div className='flex flex-col'>
      <p className='break-words whitespace-pre-wrap'>
        <span aria-hidden='true' className='text-muted-foreground'>
          ${' '}
        </span>
        {entry.command}
      </p>
      {entry.output.map((line, index) => (
        <p
          key={index}
          style={{ transitionDelay: `${index * LINE_STAGGER_MS}ms` }}
          className={cn(
            'break-words whitespace-pre-wrap transition-opacity duration-300 ease-(--ease-out-strong) starting:opacity-0',
            TONE_CLASS[line.tone]
          )}
        >
          {line.text}
        </p>
      ))}
    </div>
  );
}

export function TerminalCard({ className }: { className?: string }) {
  const { ref, isAutoplaying, state, act } = useSession(SESSION);
  const { scrollerRef, contentRef, updatePinned } = useFollowBottom();
  const inputRef = useRef<HTMLInputElement>(null);
  const lastEntry = state.entries.at(-1);
  const message = spokenUnless(isAutoplaying, messageOf(lastEntry));
  const caretStyle = { left: `${state.typed.length}ch` };

  function edit(event: React.ChangeEvent<HTMLInputElement>) {
    act({ type: 'edit', text: event.target.value });
  }

  function runOnEnter(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      act({ type: 'run' });
    }
  }

  function focusPrompt() {
    inputRef.current?.focus();
  }

  return (
    <BentoCard title='Terminal' className={className}>
      <div ref={ref} className='flex flex-col gap-3'>
        <div className='flex items-center gap-2'>
          <p className='text-muted-foreground min-w-0 flex-1 truncate font-mono text-xs'>
            ~/field-sync
          </p>
          <Badge variant='secondary' className='text-muted-foreground'>
            Sample session
          </Badge>
        </div>
        <div
          ref={scrollerRef}
          onScroll={updatePinned}
          onClick={focusPrompt}
          role='log'
          aria-label={`A terminal session of ${PERSON.name}`}
          className='bg-foreground/[0.04] h-80 cursor-text [scrollbar-width:thin] overflow-y-auto overscroll-contain rounded-xl'
        >
          <div
            ref={contentRef}
            className='flex min-h-full flex-col gap-3 p-4 font-mono text-[13px] leading-5'
          >
            {state.entries.map((entry) => (
              <EntryView key={entry.id} entry={entry} />
            ))}
            <div className='relative flex items-center gap-2'>
              <span aria-hidden='true' className='text-muted-foreground'>
                $
              </span>
              <div className='relative min-w-0 flex-1'>
                <input
                  ref={inputRef}
                  value={state.typed}
                  onChange={edit}
                  onKeyDown={runOnEnter}
                  readOnly={isAutoplaying}
                  aria-label='Type a command'
                  spellCheck={false}
                  autoCapitalize='off'
                  autoComplete='off'
                  autoCorrect='off'
                  className='w-full bg-transparent text-base outline-none md:text-[13px]'
                />
                {isAutoplaying && (
                  <span
                    aria-hidden='true'
                    style={caretStyle}
                    className='bg-foreground/70 pointer-events-none absolute top-1/2 h-[1.15em] w-[0.6ch] -translate-y-1/2 animate-pulse text-base md:text-[13px]'
                  />
                )}
              </div>
            </div>
          </div>
        </div>
        <p className='text-muted-foreground text-xs'>
          Click in and type <Kbd>help</Kbd>
        </p>
      </div>
      <LiveRegion message={message} />
    </BentoCard>
  );
}
