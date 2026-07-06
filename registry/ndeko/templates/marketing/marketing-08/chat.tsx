'use client';

import { useEffect } from 'react';

import { useDocumentVisible } from '@/registry/ndeko/hooks/use-agent-run';
import { useFollowBottom } from '@/registry/ndeko/hooks/use-follow-bottom';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import {
  AssistantTurn,
  Composer,
  EmptyThread,
  PersonMessage,
  Suggestions,
} from './chat-parts';
import {
  INITIAL,
  isAnswering,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  SCRIPT,
  tickDelayOf,
} from './chat-session';
import {
  ASSISTANT,
  CHAT_ANCHOR,
  CHAT_SECTION,
  EXCHANGES,
  SUGGESTIONS,
  type Suggestion,
} from './data';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

const THREAD =
  'bg-foreground/[0.03] flex h-80 flex-col overflow-y-auto overscroll-contain rounded-xl [scrollbar-width:thin] sm:h-96';

const THREAD_MASK =
  '[mask-image:linear-gradient(to_bottom,transparent,black_1.75rem)]';

export function Chat() {
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
  const isVisible = useDocumentVisible();
  const shouldReduceMotion = usePrefersReducedMotion();
  const { scrollerRef, contentRef, updatePinned } = useFollowBottom();
  const isActive = isInView && isVisible;
  const lastTurn = state.turns.at(-1);
  const delay = tickDelayOf(state);
  const isIdleOrDone = !isAnswering(state.phase);
  const hasDraft = state.draft.trim() !== '';
  const hasTurns = state.turns.length > 0;
  const canSend = isIdleOrDone && hasDraft;
  const isHandedOver = !isAutoplaying;
  const canPlayAgain = !shouldReduceMotion;
  const canReplay = isFinished && isHandedOver && canPlayAgain;
  let answerLine = '';
  if (lastTurn && state.phase === 'done') {
    answerLine = EXCHANGES[lastTurn.exchangeId].answer;
  }
  const message = spokenUnless(isAutoplaying, answerLine);

  useEffect(() => {
    if (!isActive || delay === null) {
      return;
    }
    let wait = delay;
    if (shouldReduceMotion) {
      wait = 0;
    }
    const timer = setTimeout(() => act({ type: 'tick' }), wait);
    return () => clearTimeout(timer);
  }, [isActive, delay, state.phase, state.toolsShown, shouldReduceMotion, act]);

  function changeDraft(text: string) {
    act({ type: 'typed', text });
  }

  function send() {
    act({ type: 'sent' });
  }

  function ask(suggestion: Suggestion) {
    const exchange = EXCHANGES[suggestion.exchangeId];
    const question = exchange.prompt;
    act({ type: 'asked', exchangeId: suggestion.exchangeId, question });
  }

  return (
    <section id={CHAT_ANCHOR} className='px-4 py-16 sm:px-6 sm:py-24 lg:px-8'>
      <div className='mx-auto flex max-w-2xl flex-col items-center gap-10'>
        <div className='flex flex-col items-center gap-3 text-center'>
          <h2 className='text-2xl font-semibold text-balance sm:text-3xl'>
            {CHAT_SECTION.title}
          </h2>
          <p className='text-muted-foreground max-w-lg text-base text-pretty'>
            {CHAT_SECTION.description}
          </p>
        </div>
        <div
          id='chat-card'
          ref={ref}
          className='bg-card hairline-ring ring-border flex w-full flex-col gap-3 rounded-2xl p-3 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_16px_40px_-20px_rgb(0_0_0/0.18)] sm:p-4'
        >
          <header className='flex flex-wrap items-center gap-x-2.5 gap-y-1 px-1 pt-1'>
            <MeshTile seed={ASSISTANT.name} size='lg' />
            <h3 className='text-sm font-medium'>{ASSISTANT.name}</h3>
            <Badge variant='secondary' className='text-muted-foreground'>
              Sample conversation
            </Badge>
            <div className='ms-auto'>
              <ReplayButton
                isShown={canReplay}
                onReplay={restart}
                label='Replay the sample'
              />
            </div>
          </header>
          <div
            ref={scrollerRef}
            onScroll={updatePinned}
            className={cn(THREAD, hasTurns && THREAD_MASK)}
          >
            <div
              ref={contentRef}
              className='flex min-h-full flex-col gap-5 p-3 sm:p-4'
            >
              {!hasTurns && <EmptyThread />}
              {state.turns.map((turn, index) => {
                const isLast = index === state.turns.length - 1;
                let phase = state.phase;
                let toolsShown = state.toolsShown;
                if (!isLast) {
                  phase = 'done';
                  toolsShown = EXCHANGES[turn.exchangeId].tools.length;
                }

                return (
                  <div key={turn.id} className='flex flex-col gap-4'>
                    <PersonMessage text={turn.question} />
                    <AssistantTurn
                      turn={turn}
                      phase={phase}
                      toolsShown={toolsShown}
                      isActive={isActive}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          <Suggestions
            suggestions={SUGGESTIONS}
            phase={state.phase}
            onAsk={ask}
          />
          <Composer
            draft={state.draft}
            canSend={canSend}
            isDemonstrating={isAutoplaying}
            pressed={pressed}
            onDraftChange={changeDraft}
            onSend={send}
          />
        </div>
      </div>
      <LiveRegion message={message} />
    </section>
  );
}
