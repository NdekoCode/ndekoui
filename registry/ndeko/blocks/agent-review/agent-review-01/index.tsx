'use client';

import { WordRoll } from '@/components/core/word-roll';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { GitBranchIcon, GitMergeIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { Chip } from '@/registry/ndeko/ui/chip';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { ChecksBox } from './checks';
import { CODER, ISSUE } from './data';
import {
  allChecksPassed,
  INITIAL,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  SCRIPT,
  type IssueStatus,
  type MergeStatus,
  type PlanStatus,
} from './session';
import { CoderTile, Timeline } from './timeline';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

const STATUS_WORD: Record<IssueStatus, string> = {
  planned: 'Planned',
  progress: 'In progress',
  review: 'In review',
  merged: 'Merged',
};

const STATUS_LABELS = Object.values(STATUS_WORD);

const STATUS_COLOR: Record<IssueStatus, string> = {
  planned: 'var(--muted-foreground)',
  progress: 'var(--info)',
  review: 'var(--warning)',
  merged: 'var(--success)',
};

const MERGE_LABELS: Record<MorphState, string> = {
  idle: 'Merge pull request',
  busy: 'Merging',
  done: 'Merged',
};

function mergeHintOf(plan: PlanStatus, canMerge: boolean, merge: MergeStatus) {
  if (merge === 'done') {
    return 'Merged into main';
  }
  if (plan === 'pending') {
    return 'Starts with your approval of the plan';
  }
  if (plan === 'changes') {
    return 'Stopped: the plan needs a new brief';
  }
  if (canMerge) {
    return 'Every check passed';
  }
  return 'Available once every check passes';
}

function branchWordOf(isDeleted: boolean) {
  if (isDeleted) {
    return 'Deleted';
  }
  return 'Open';
}

function spokenUnless(isDemonstrating: boolean, message: string) {
  if (isDemonstrating) {
    return '';
  }
  return message;
}

function pressedSolidOf(isPressed: boolean) {
  if (isPressed) {
    return 'scale-[0.94] bg-primary/85';
  }
  return undefined;
}

function StatusChip({ status }: { status: IssueStatus }) {
  return (
    <Chip
      color={STATUS_COLOR[status]}
      className='transition-colors duration-300'
    >
      <WordRoll text={STATUS_WORD[status]} labels={STATUS_LABELS} />
    </Chip>
  );
}

function PropertyRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className='flex min-h-8 items-center gap-3 text-[13px]'>
      <dt className='text-muted-foreground w-20 shrink-0'>{label}</dt>
      <dd className='flex min-w-0 flex-1 items-center gap-2'>{children}</dd>
    </div>
  );
}

export default function AgentReview01() {
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
  const canMerge = allChecksPassed(state.checks);
  const mergeHint = mergeHintOf(state.plan, canMerge, state.merge);
  const hasStopped = state.plan === 'changes';
  const isOver = isFinished || hasStopped;
  const canReplay = isOver && !isAutoplaying;
  const hasActivity = state.events.length > 0;
  const branchWord = branchWordOf(state.isBranchDeleted);
  const announcement = `${ISSUE.id} is ${STATUS_WORD[state.status]}. ${mergeHint}`;
  const message = spokenUnless(isAutoplaying, announcement);

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-background text-foreground @container min-h-dvh w-full p-4 @3xl:p-8'
      >
        <div className='mx-auto flex max-w-5xl flex-col gap-6'>
          <header className='flex flex-col gap-2'>
            <div className='flex flex-wrap items-center gap-2'>
              <span className='text-muted-foreground font-mono text-xs'>
                {ISSUE.id}
              </span>
              <StatusChip status={state.status} />
              <span className='ms-auto'>
                <ReplayButton
                  isShown={canReplay}
                  onReplay={restart}
                  label='Replay the task'
                />
              </span>
            </div>
            <h1 className='text-2xl font-semibold text-balance'>
              {ISSUE.title}
            </h1>
          </header>

          <div className='flex flex-col gap-6 @3xl:flex-row @3xl:items-start'>
            <main className='flex min-w-0 flex-1 flex-col gap-6'>
              <section aria-label='Request' className='flex flex-col gap-1.5'>
                <h2 className='text-muted-foreground text-xs'>Request</h2>
                <p className='text-sm leading-relaxed'>{ISSUE.request}</p>
              </section>
              <section className='flex flex-col gap-3'>
                <h2 className='text-muted-foreground text-xs'>Activity</h2>
                {!hasActivity && (
                  <p className='text-muted-foreground text-[13px]'>
                    Nothing yet. Coder starts with a plan for you to approve.
                  </p>
                )}
                <Timeline
                  events={state.events}
                  plan={state.plan}
                  pressed={pressed}
                  onDecide={(decision) =>
                    act({ type: 'planDecided', decision })
                  }
                />
              </section>
            </main>

            <aside className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] flex flex-col gap-5 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] @3xl:w-80 @3xl:shrink-0'>
              <dl className='flex flex-col'>
                <PropertyRow label='Assignee'>
                  <CoderTile />
                  {CODER.name}
                </PropertyRow>
                <PropertyRow label='Branch'>
                  <GitBranchIcon className='text-muted-foreground size-3.5 shrink-0' />
                  <code className='min-w-0 truncate font-mono text-xs'>
                    {ISSUE.branch}
                  </code>
                </PropertyRow>
                <PropertyRow label='State'>
                  <Swap swapKey={branchWord}>{branchWord}</Swap>
                  {state.isBranchDeleted && (
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => act({ type: 'branch', isDeleted: false })}
                      className='text-primary-ink -my-1 transition-opacity duration-300 starting:opacity-0'
                    >
                      Restore
                    </Button>
                  )}
                </PropertyRow>
              </dl>

              <ChecksBox checks={state.checks} />

              <div className='flex flex-col gap-2'>
                <MorphButton
                  type='button'
                  size='lg'
                  state={state.merge}
                  labels={MERGE_LABELS}
                  idleIcon={<GitMergeIcon />}
                  disabled={!canMerge}
                  onClick={() => act({ type: 'merge' })}
                  className={pressedSolidOf(pressed === 'merge')}
                />
                <p className='text-muted-foreground text-center text-xs'>
                  <Swap swapKey={mergeHint}>{mergeHint}</Swap>
                </p>
              </div>
            </aside>
          </div>
        </div>
        <LiveRegion message={message} />
      </div>
    </ClockGate>
  );
}
