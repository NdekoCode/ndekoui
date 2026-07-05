'use client';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll } from '@/components/core/word-roll';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import {
  pressedSolidOf,
  spokenUnless,
} from '@/registry/ndeko/lib/demonstration';
import { BotIcon, RocketIcon } from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Chip } from '@/registry/ndeko/ui/chip';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

import { Configure } from './configure';
import { ReviewPanel } from './review-panel';
import {
  ANSWER_MS,
  changesOf,
  INITIAL,
  LOOP_AFTER_MS,
  nextSampleFileOf,
  PUBLISH_MS,
  reducer,
  RESTING,
  SAMPLE_MS,
  SAMPLE_TICKS,
  SCRIPT,
  UPLOAD_STEP_MS,
  UPLOAD_STEPS,
  type BuilderState,
  type View,
} from './session';
import { TestChat } from './test-chat';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

const VIEWS: Segment<View>[] = [
  { value: 'configure', label: 'Configure' },
  { value: 'test', label: 'Test' },
];

function draftLineOf(changeCount: number) {
  if (changeCount === 0) {
    return 'No change to publish';
  }
  if (changeCount === 1) {
    return '1 change in the draft';
  }
  return `${changeCount} changes in the draft`;
}

function publishLineOf(state: BuilderState, draftLine: string) {
  if (state.publish === 'done') {
    return `Version ${state.liveVersion} is live`;
  }
  if (state.publish === 'failed') {
    return 'Publishing failed. Nothing changed';
  }
  if (state.publish === 'pending') {
    return 'Publishing';
  }
  return draftLine;
}

function viewClassOf(isShown: boolean) {
  if (isShown) {
    return 'block';
  }
  return 'hidden';
}

export default function AgentOps07() {
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
  const { schedule } = useTimeouts();
  const shouldReduceMotion = usePrefersReducedMotion();
  const changeCount = changesOf(state).length;
  const draftLine = draftLineOf(changeCount);
  const publishLine = publishLineOf(state, draftLine);
  const message = spokenUnless(isAutoplaying, publishLine);
  const canReplay = isFinished && !isAutoplaying;
  const isConfiguring = state.view === 'configure';

  function focusLater(selector: string) {
    requestAnimationFrame(() => {
      const target = ref.current?.querySelector<HTMLElement>(selector);
      target?.focus();
    });
  }

  function addFile() {
    const file = nextSampleFileOf(state);
    if (!file) {
      return;
    }
    act({ type: 'fileAdded' });
    UPLOAD_STEPS.forEach((progress, index) => {
      const step = index + 1;
      const report = () => act({ type: 'fileProgress', id: file.id, progress });
      schedule(report, UPLOAD_STEP_MS * step);
    });
  }

  function send() {
    act({ type: 'chatSent' });
    schedule(() => act({ type: 'answered' }), ANSWER_MS);
  }

  function openReview() {
    act({ type: 'reviewOpened' });
    for (let tick = 1; tick <= SAMPLE_TICKS; tick += 1) {
      schedule(() => act({ type: 'sampleRan' }), SAMPLE_MS * tick);
    }
    focusLater('[data-review-first]');
  }

  function closeReview() {
    act({ type: 'reviewClosed' });
    focusLater('[data-review]');
  }

  function publish() {
    act({ type: 'publish' });
    schedule(() => {
      act({ type: 'publishSettled' });
      focusLater('[data-review-first]');
    }, PUBLISH_MS);
  }

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-background text-foreground @container relative h-dvh min-h-[44rem] w-full overflow-hidden'
      >
        <div inert={state.isReviewOpen} className='h-full overflow-y-auto'>
          <div className='mx-auto flex max-w-2xl flex-col gap-3 p-4 @3xl:p-8'>
            <section
              aria-label='Agent'
              className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] flex flex-col gap-5 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] @xl:p-5'
            >
              <header className='flex flex-wrap items-center gap-x-3 gap-y-3'>
                <span
                  aria-hidden='true'
                  className='gem-plate inline-flex size-9 shrink-0 items-center justify-center rounded-lg [--gem:var(--primary)]'
                >
                  <BotIcon className='size-5' />
                </span>
                <div className='flex min-w-40 flex-1 flex-col gap-1'>
                  <input
                    value={state.name}
                    aria-label='Agent name'
                    autoComplete='off'
                    spellCheck={false}
                    onChange={(event) =>
                      act({ type: 'named', text: event.target.value })
                    }
                    className='hover:bg-foreground/[0.04] focus-visible:ring-ring/25 -mx-1 field-sizing-content max-w-full min-w-24 rounded-md bg-transparent px-1 text-lg leading-7 font-semibold transition-colors duration-150 outline-none focus-visible:ring-[3px]'
                  />
                  <p className='text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs'>
                    <Chip color='var(--success)'>
                      <MotionNumber value={state.liveVersion} prefix='v' />
                      live
                    </Chip>
                    <WordRoll text={draftLine} />
                  </p>
                </div>
                <ReplayButton
                  isShown={canReplay}
                  onReplay={restart}
                  label='Replay the setup'
                />
                <Button
                  type='button'
                  data-review
                  onClick={openReview}
                  className={pressedSolidOf(pressed === 'review')}
                >
                  <RocketIcon />
                  Publish
                </Button>
              </header>

              <Segments
                value={state.view}
                segments={VIEWS}
                onValueChange={(view) => act({ type: 'view', view })}
                label='View'
                className='w-full @sm:w-56'
              />

              <AnimatedSize>
                <div className={viewClassOf(isConfiguring)}>
                  <Configure
                    state={state}
                    pressed={pressed}
                    onAction={act}
                    onAddFile={addFile}
                  />
                </div>
                <div className={viewClassOf(!isConfiguring)}>
                  <TestChat
                    agentName={state.name}
                    turns={state.turns}
                    draft={state.draft}
                    isAnswering={state.isAnswering}
                    isActive={isInView}
                    shouldReduceMotion={shouldReduceMotion}
                    pressed={pressed}
                    onDraftChange={(text) => act({ type: 'chatTyped', text })}
                    onSend={send}
                  />
                </div>
              </AnimatedSize>
            </section>
          </div>
        </div>

        <ReviewPanel
          state={state}
          pressed={pressed}
          onPublish={publish}
          onClose={closeReview}
        />
        <LiveRegion message={message} />
      </div>
    </ClockGate>
  );
}
