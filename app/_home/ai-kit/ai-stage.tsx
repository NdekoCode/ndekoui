'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import {
  CONTEXT_RESERVE,
  type ContextBudget,
} from '@/registry/ndeko/components/run/_parts/context';
import { ToolCallGroup } from '@/registry/ndeko/components/run/run-01';
import {
  RunInSentences,
  type RunSentence,
} from '@/registry/ndeko/components/run/run-03';
import { ContextRing } from '@/registry/ndeko/components/run/run-07';
import {
  ApprovalPrompt,
  type ApprovalEntry,
  type ApprovalPhase,
} from '@/registry/ndeko/components/review/review-01';
import { useDemoRun } from '@/registry/ndeko/hooks/use-demo-run';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import {
  formatTokens,
  pendingApprovalsOf,
  type ApprovalRequest,
  type RunSnapshot,
} from '@/registry/ndeko/lib/agent-run';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import {
  INITIAL_STAGE_RUN,
  SCRIPT,
  SEND_PREVIEW,
  STAGE_REQUEST,
  STEP_KINDS,
} from './stage-script';

const APPROVING_MS = 700;

const CONFIRMED_MS = 500;

const STAGE_LIMIT = 100_000;

const SYSTEM_TOKENS = 6_200;

const TOOL_TOKENS = 8_600;

const FILE_TOKENS: Record<string, number> = {
  'page-again': 9_000,
  sheet: 21_000,
};

const WRITER = { name: 'Writer', series: 3 } as const;

const COST_FORMAT: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
};

type Phases = Record<string, ApprovalPhase>;

function isHeld(snapshot: RunSnapshot) {
  const pending = pendingApprovalsOf(snapshot);
  const isWaiting = pending.length > 0;
  const isStopped = snapshot.status === 'cancelled';
  return isWaiting || isStopped;
}

function fileTokensOf(snapshot: RunSnapshot) {
  let total = 0;
  for (const call of snapshot.calls) {
    const tokens = FILE_TOKENS[call.id];
    const isRead = call.status === 'done';
    if (tokens && isRead) {
      total += tokens;
    }
  }
  return total;
}

function budgetOf(snapshot: RunSnapshot): ContextBudget {
  const files = fileTokensOf(snapshot);
  const fixed = SYSTEM_TOKENS + TOOL_TOKENS + files;
  const rest = snapshot.usage.contextTokens - fixed;
  const conversation = Math.max(0, rest);
  return {
    limit: STAGE_LIMIT,
    reserve: CONTEXT_RESERVE,
    parts: [
      { id: 'system', label: 'System', tokens: SYSTEM_TOKENS, items: [] },
      { id: 'tools', label: 'Tools', tokens: TOOL_TOKENS, items: [] },
      { id: 'files', label: 'Files', tokens: files, items: [] },
      {
        id: 'conversation',
        label: 'Conversation',
        tokens: conversation,
        items: [],
      },
    ],
  };
}

function sentencesOf(snapshot: RunSnapshot): RunSentence[] {
  return snapshot.plan.map((step) => {
    const kind = STEP_KINDS[step.id] ?? 'thinking';
    return { step, kind };
  });
}

function phaseOfStatus(request: ApprovalRequest): ApprovalPhase {
  if (request.status === 'approved') {
    return 'approved';
  }
  if (request.status === 'denied') {
    return 'denied';
  }
  return 'waiting';
}

function entriesOf(snapshot: RunSnapshot, phases: Phases): ApprovalEntry[] {
  return snapshot.approvals.map((request) => {
    const phase = phases[request.id] ?? phaseOfStatus(request);
    return {
      request,
      agent: WRITER,
      preview: SEND_PREVIEW,
      outcome: 'Sent',
      phase,
      canUndo: false,
    };
  });
}

function statusWordOf(snapshot: RunSnapshot) {
  if (snapshot.status === 'waiting') {
    return 'Waiting on you';
  }
  if (snapshot.status === 'done') {
    return 'Done';
  }
  if (snapshot.status === 'cancelled') {
    return 'Stopped';
  }
  if (snapshot.status === 'running') {
    return 'Running';
  }
  return 'Starting';
}

type BadgeVariant = 'default' | 'secondary' | 'success' | 'warning';

function statusVariantOf(snapshot: RunSnapshot): BadgeVariant {
  if (snapshot.status === 'waiting') {
    return 'warning';
  }
  if (snapshot.status === 'done') {
    return 'success';
  }
  if (snapshot.status === 'running') {
    return 'default';
  }
  return 'secondary';
}

function announcementOf(snapshot: RunSnapshot) {
  if (snapshot.status === 'waiting') {
    return 'The agent waits for you to approve the email';
  }
  if (snapshot.status === 'done') {
    return 'The run finished and the credit request was sent';
  }
  if (snapshot.status === 'cancelled') {
    return 'You stopped the run before the email was sent';
  }
  return '';
}

type PanelProps = {
  title: string;
  name: string;
  href: string;
  className?: string;
  children: ReactNode;
};

function Panel({ title, name, href, className, children }: PanelProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)}>
      <Link
        href={href}
        className='text-muted-foreground hover:text-foreground focus-visible:ring-ring/25 flex w-fit items-baseline gap-2 rounded-sm text-[13px] outline-none focus-visible:ring-[3px]'
      >
        <span className='text-foreground font-medium'>{title}</span>
        <span className='font-mono text-[11px]'>{name}</span>
      </Link>
      {children}
    </div>
  );
}

export function AiStage() {
  const { ref, isInView, snapshot, store, restart } = useDemoRun(SCRIPT, {
    initial: INITIAL_STAGE_RUN,
    holdWhile: isHeld,
  });
  const [phases, setPhases] = useState<Phases>({});
  const { schedule, clearAll } = useTimeouts();
  const isEnded = snapshot.endedAt !== undefined;
  const entries = entriesOf(snapshot, phases);
  const budget = budgetOf(snapshot);
  const sentences = sentencesOf(snapshot);
  const usedTokens = snapshot.usage.contextTokens;

  function setPhase(requestId: string, phase: ApprovalPhase) {
    setPhases((current) => ({ ...current, [requestId]: phase }));
  }

  function approve(requestId: string) {
    setPhase(requestId, 'approving');
    schedule(() => setPhase(requestId, 'confirmed'), APPROVING_MS);
    const foldDelay = APPROVING_MS + CONFIRMED_MS;
    schedule(() => {
      setPhase(requestId, 'approved');
      store.dispatch({
        type: 'approval.resolved',
        id: requestId,
        decision: 'approved',
      });
      store.dispatch({
        type: 'step.updated',
        id: 'approve',
        patch: { status: 'done', title: 'You approved the email' },
      });
    }, foldDelay);
  }

  function deny(requestId: string) {
    setPhase(requestId, 'denied');
    store.dispatch({
      type: 'approval.resolved',
      id: requestId,
      decision: 'denied',
    });
    store.dispatch({
      type: 'step.updated',
      id: 'approve',
      patch: { status: 'failed', title: 'You kept the email as a draft' },
    });
    store.dispatch({ type: 'run.finished', status: 'cancelled' });
  }

  function replay() {
    clearAll();
    setPhases({});
    restart();
  }

  return (
    <div
      ref={ref}
      className='bg-foreground/[0.025] flex flex-col gap-5 rounded-2xl p-3 sm:p-5'
    >
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <p className='max-w-2xl text-[15px] text-pretty'>
          <span className='text-muted-foreground'>You asked: </span>
          {STAGE_REQUEST}
        </p>
        <div className='flex items-center gap-2'>
          <ReplayButton isShown={isEnded} onReplay={replay} />
          <Badge variant={statusVariantOf(snapshot)}>
            {statusWordOf(snapshot)}
          </Badge>
        </div>
      </div>
      <ClockGate isActive={isInView}>
        <div className='grid gap-5 lg:grid-cols-12'>
          <Panel
            title='Run in sentences'
            name='run-03'
            href='/components/run#run-03'
            className='lg:col-span-7'
          >
            <RunInSentences
              title={snapshot.title}
              run={snapshot}
              sentences={sentences}
            />
          </Panel>
          <div className='flex min-w-0 flex-col gap-5 lg:col-span-5'>
            <Panel
              title='Tool calls'
              name='run-01'
              href='/components/run#run-01'
            >
              <ToolCallGroup calls={snapshot.calls} />
            </Panel>
            <Panel
              title='Approval prompt'
              name='review-01'
              href='/components/review#review-01'
            >
              <ApprovalPrompt
                entries={entries}
                onApprove={approve}
                onDeny={deny}
              />
            </Panel>
            <Panel
              title='Context ring'
              name='run-07'
              href='/components/run#run-07'
            >
              <div className='flex items-center gap-3 text-[13px]'>
                <ContextRing budget={budget} />
                <span className='text-muted-foreground tabular-nums'>
                  {formatTokens(usedTokens)} tokens
                </span>
                <span className='text-muted-foreground ms-auto tabular-nums'>
                  <MotionNumber
                    value={snapshot.usage.costUsd}
                    format={COST_FORMAT}
                  />{' '}
                  spent
                </span>
              </div>
            </Panel>
          </div>
        </div>
      </ClockGate>
      <LiveRegion message={announcementOf(snapshot)} />
    </div>
  );
}
