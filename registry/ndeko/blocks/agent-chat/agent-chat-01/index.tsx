'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  pendingApprovalsOf,
  type RunSnapshot,
} from '@/registry/ndeko/lib/agent-run';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { FeatherIcon, ListChecksIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { Composer, type EmailPreview } from './composer';
import {
  ANSWER,
  CALL_BRAND,
  CONVERSATION_TITLE,
  DENIED_LINE,
  EMAIL,
  FOLLOW_UP_REPLY,
  person,
  PROMPT,
  SENT_LINE,
  SOURCES,
} from './data';
import { doneStepsOf, RunPanel } from './run-panel';
import {
  INITIAL,
  isOver,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  SCRIPT,
  type Decision,
  type Phase,
} from './session';

const ANSWER_WORDS = ANSWER.split(' ');

const WORD_MS = 48;

const PHASE_ORDER: Phase[] = [
  'idle',
  'thinking',
  'reading',
  'streaming',
  'waiting',
  'sending',
  'done',
  'stopped',
];

function hasReached(phase: Phase, target: Phase) {
  const position = PHASE_ORDER.indexOf(phase);
  const targetPosition = PHASE_ORDER.indexOf(target);
  return position >= targetPosition;
}

function statusWordOf(phase: Phase) {
  if (phase === 'thinking') {
    return 'Thinking';
  }
  if (phase === 'reading') {
    return 'Reading your sources';
  }
  if (phase === 'sending') {
    return 'Sending the email';
  }
  return null;
}

function closingLineOf(phase: Phase) {
  if (phase === 'done') {
    return SENT_LINE;
  }
  if (phase === 'stopped') {
    return DENIED_LINE;
  }
  return null;
}

function announcementOf(phase: Phase) {
  if (phase === 'waiting') {
    return 'The assistant asks to send an email. Allow or deny it.';
  }
  return closingLineOf(phase) ?? '';
}

function useRevealedCount(total: number, isStreaming: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isStreaming) {
      return;
    }
    const timer = setInterval(() => {
      setCount((current) => Math.min(total, current + 1));
    }, WORD_MS);
    return () => clearInterval(timer);
  }, [isStreaming, total]);

  return count;
}

function shownWordsOf(isComplete: boolean, count: number, total: number) {
  if (isComplete) {
    return total;
  }
  return count;
}

/** Only this text re-renders while the answer streams. */
function StreamedAnswer({
  phase,
  isActive,
}: {
  phase: Phase;
  isActive: boolean;
}) {
  const isStreaming = phase === 'streaming';
  const count = useRevealedCount(ANSWER_WORDS.length, isStreaming && isActive);
  const shown = shownWordsOf(!isStreaming, count, ANSWER_WORDS.length);
  const words = ANSWER_WORDS.slice(0, shown);

  return (
    <p className='text-sm leading-relaxed'>
      {words.map((word, index) => (
        <span
          key={index}
          className='transition-opacity duration-300 ease-(--ease-out-strong) starting:opacity-0'
        >
          {word}{' '}
        </span>
      ))}
    </p>
  );
}

function AssistantTile() {
  return (
    <span
      aria-hidden='true'
      className='gem-plate inline-flex size-7 shrink-0 items-center justify-center rounded-lg [--gem:var(--primary)]'
    >
      <FeatherIcon className='size-4' />
    </span>
  );
}

function StatusLine({ word }: { word: string }) {
  return (
    <p className='text-muted-foreground flex h-7 items-center gap-2 text-[13px]'>
      <span
        aria-hidden='true'
        className='bg-primary size-1.5 animate-pulse rounded-full'
      />
      <Swap swapKey={word}>{word}</Swap>
    </p>
  );
}

function SourceTiles({ shown }: { shown: number }) {
  const sources = SOURCES.slice(0, shown);

  return (
    <ul aria-label='Sources read' className='flex flex-wrap gap-1.5'>
      {sources.map((source) => (
        <li
          key={source.id}
          className='bg-foreground/[0.04] flex h-9 items-center gap-2 rounded-lg ps-1 pe-2.5 text-xs transition-[opacity,scale] duration-300 ease-(--ease-out-strong) starting:scale-90 starting:opacity-0'
        >
          <BrandTile brand={source.brand} size='lg' />
          <span className='flex flex-col leading-tight'>
            <span className='font-medium'>{source.title}</span>
            <span className='text-muted-foreground'>{source.product}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function PersonMessage({ text }: { text: string }) {
  return (
    <div className='flex items-end justify-end gap-2'>
      <p className='bg-foreground/[0.06] max-w-[85%] rounded-2xl rounded-ee-md px-3.5 py-2 text-sm leading-relaxed'>
        {text}
      </p>
      <Avatar className='hidden size-7 @md:inline-flex'>
        <AvatarImage src={person.avatar} alt={person.name} />
        <AvatarFallback>{person.initials}</AvatarFallback>
      </Avatar>
    </div>
  );
}

function sheetBackdropOf(isOpen: boolean) {
  if (isOpen) {
    return 'opacity-100';
  }
  return 'opacity-0';
}

function sheetPanelOf(isOpen: boolean) {
  if (isOpen) {
    return 'translate-y-0';
  }
  return 'translate-y-[calc(100%+1rem)]';
}

function sheetLayerOf(isOpen: boolean) {
  if (isOpen) {
    return undefined;
  }
  return 'pointer-events-none';
}

type RunSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

/** Drawn inside the block, so the run never opens a layer over the rest of the page. */
function RunSheet({ isOpen, onClose, children }: RunSheetProps) {
  function closeOnEscape(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      onClose();
    }
  }

  return (
    <div
      inert={!isOpen}
      onKeyDown={closeOnEscape}
      className={cn('absolute inset-0 z-10 @3xl:hidden', sheetLayerOf(isOpen))}
    >
      <button
        type='button'
        aria-label='Close the run'
        onClick={onClose}
        className={cn(
          'absolute inset-0 cursor-default bg-black/40 transition-opacity duration-200',
          sheetBackdropOf(isOpen)
        )}
      />
      <div
        role='dialog'
        aria-label='Run'
        className={cn(
          'bg-card hairline-ring ring-border absolute inset-x-2 bottom-2 flex max-h-[80%] flex-col gap-3 overflow-y-auto rounded-2xl p-4 shadow-xl shadow-black/8 transition-[translate] duration-300 ease-(--ease-drawer)',
          sheetPanelOf(isOpen)
        )}
      >
        <div className='flex items-center justify-between'>
          <h2 className='text-sm font-medium'>Run</h2>
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            aria-label='Close the run'
            onClick={onClose}
            className='text-muted-foreground'
          >
            <XIcon />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

export type AgentChatProps = {
  /** The run drawn beside the conversation: feed it from any backend that emits run events. */
  run: RunSnapshot;
  question: string | null;
  phase: Phase;
  sourcesShown: number;
  followUps: string[];
  draft: string;
  email: EmailPreview;
  pressed?: string | null;
  /** False while the block is off screen: the answer stops streaming until it is back. */
  isActive?: boolean;
  header?: React.ReactNode;
  onDraftChange: (text: string) => void;
  onSend: (text: string) => void;
  onDecide: (decision: Decision) => void;
};

export function AgentChat({
  run,
  question,
  phase,
  sourcesShown,
  followUps,
  draft,
  email,
  pressed = null,
  isActive = true,
  header,
  onDraftChange,
  onSend,
  onDecide,
}: AgentChatProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const [pendingApproval] = pendingApprovalsOf(run);
  const approval = pendingApproval ?? null;
  const hasAsked = question !== null;
  const isRunning = hasAsked && !isOver(phase);
  const canSend = !isRunning;
  const statusWord = statusWordOf(phase);
  const closingLine = closingLineOf(phase);
  const showsAnswer = hasReached(phase, 'streaming');
  const doneSteps = doneStepsOf(run);
  const totalSteps = run.plan.length;
  const followUpCount = followUps.length;

  useEffect(() => {
    const list = listRef.current;
    if (list) {
      list.scrollTop = list.scrollHeight;
    }
  }, [phase, sourcesShown, followUpCount]);

  function send() {
    onSend(draft);
  }

  function fillSuggestion() {
    onDraftChange(PROMPT);
  }

  return (
    <div className='mx-auto flex h-full max-w-6xl gap-3 p-3 @3xl:p-4'>
      <section
        aria-label='Conversation'
        className='flex min-w-0 flex-1 flex-col gap-3'
      >
        <header className='flex h-9 shrink-0 items-center gap-2.5'>
          <AssistantTile />
          <div className='flex min-w-0 flex-1 flex-col leading-tight'>
            <h2 className='truncate text-sm font-medium'>
              {CONVERSATION_TITLE}
            </h2>
            <span className='text-muted-foreground text-xs'>Assistant</span>
          </div>
          {header}
          <Button
            type='button'
            variant='outline'
            size='sm'
            aria-expanded={isSheetOpen}
            onClick={() => setIsSheetOpen(true)}
            className='@3xl:hidden'
          >
            <ListChecksIcon />
            Run
            <span className='text-muted-foreground tabular-nums'>
              {doneSteps}/{totalSteps}
            </span>
          </Button>
        </header>

        <div
          ref={listRef}
          className='flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto py-2'
        >
          {!hasAsked && (
            <div className='m-auto flex max-w-sm flex-col items-center gap-3 text-center'>
              <p className='text-muted-foreground text-[13px]'>
                Ask about your accounts. The assistant reads your tools and asks
                before it sends anything.
              </p>
              <Button
                type='button'
                variant='outline'
                onClick={fillSuggestion}
                className='h-auto max-w-full rounded-xl px-3 py-2 text-start whitespace-normal'
              >
                {PROMPT}
              </Button>
            </div>
          )}

          {hasAsked && <PersonMessage text={question} />}

          {hasAsked && (
            <div className='flex items-start gap-2.5'>
              <AssistantTile />
              <div className='flex min-w-0 flex-1 flex-col gap-3'>
                <AnimatePresence initial={false}>
                  {statusWord && (
                    <motion.div
                      key='status'
                      className='overflow-hidden'
                      {...rowPresence}
                    >
                      <StatusLine word={statusWord} />
                    </motion.div>
                  )}
                </AnimatePresence>
                <SourceTiles shown={sourcesShown} />
                {showsAnswer && (
                  <StreamedAnswer phase={phase} isActive={isActive} />
                )}
                <AnimatePresence initial={false}>
                  {closingLine && (
                    <motion.p
                      key='closing'
                      className='overflow-hidden text-sm leading-relaxed'
                      {...rowPresence}
                    >
                      {closingLine}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {followUps.map((text, index) => (
            <div key={index} className='flex flex-col gap-4'>
              <PersonMessage text={text} />
              <div className='flex items-start gap-2.5'>
                <AssistantTile />
                <p className='pt-1 text-sm leading-relaxed'>
                  {FOLLOW_UP_REPLY}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Composer
          approval={approval}
          email={email}
          draft={draft}
          placeholder='Ask about your accounts'
          canSend={canSend}
          pressed={pressed}
          onDraftChange={onDraftChange}
          onSend={send}
          onDecide={onDecide}
        />
      </section>

      <aside
        aria-label='Run'
        className='bg-card hairline-ring ring-border hidden w-80 shrink-0 overflow-y-auto rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] @3xl:flex'
      >
        <RunPanel run={run} brands={CALL_BRAND} className='w-full' />
      </aside>

      <RunSheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)}>
        <RunPanel run={run} brands={CALL_BRAND} />
      </RunSheet>
    </div>
  );
}

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

export default function AgentChat01() {
  const {
    ref,
    isInView,
    isAutoplaying,
    state,
    act,
    pressed,
    isFinished,
    restart,
  } = useSession(SESSION);
  const announcement = announcementOf(state.phase);
  const message = spokenUnless(isAutoplaying, announcement);
  const canReplay = isFinished && !isAutoplaying;

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-background text-foreground @container relative h-dvh min-h-[36rem] w-full overflow-hidden'
      >
        <AgentChat
          run={state.run}
          question={state.question}
          phase={state.phase}
          sourcesShown={state.sourcesShown}
          followUps={state.followUps}
          draft={state.draft}
          email={EMAIL}
          pressed={pressed}
          isActive={isInView}
          header={<ReplayButton isShown={canReplay} onReplay={restart} />}
          onDraftChange={(text) => act({ type: 'typed', text })}
          onSend={() => act({ type: 'sent' })}
          onDecide={(decision) => act({ type: 'decided', decision })}
        />
        <LiveRegion message={message} />
      </div>
    </ClockGate>
  );
}
