'use client';

import { ActivityFeed } from './activity-feed';
import type { RequestId } from './data';
import { FiguresBand } from './figures-band';
import { NeedsYou } from './needs-you';
import { PageHeader } from './page-header';
import {
  totalSpendOf,
  type ActivityEntry,
  type DashboardState,
  type Decision,
} from './session';
import { UsageCard } from './usage-card';

function isRunning(entry: ActivityEntry) {
  if (entry.kind !== 'run') {
    return false;
  }
  return entry.status === 'running';
}

type OverviewPageProps = {
  state: DashboardState;
  pressed: string | null;
  workspaceName: string;
  canReplay: boolean;
  onReplay: () => void;
  onReview: () => void;
  onDecide: (requestId: RequestId, decision: Decision) => void;
};

export function OverviewPage({
  state,
  pressed,
  workspaceName,
  canReplay,
  onReplay,
  onReview,
  onDecide,
}: OverviewPageProps) {
  const runningNow = state.activity.filter(isRunning).length;
  const spendUsd = totalSpendOf(state.spend);
  const hasRequests = state.pending.length > 0;

  return (
    <>
      <PageHeader
        workspaceName={workspaceName}
        hasRequests={hasRequests}
        canReplay={canReplay}
        onReplay={onReplay}
        onReview={onReview}
      />
      <FiguresBand
        runsToday={state.runsToday}
        runningNow={runningNow}
        pending={state.pending}
        hoursSaved={state.hoursSaved}
        spendUsd={spendUsd}
      />
      <div className='grid items-start gap-4 @4xl/page:grid-cols-[minmax(0,1fr)_19rem]'>
        <div className='flex min-w-0 flex-col gap-4'>
          <NeedsYou
            pending={state.pending}
            pressed={pressed}
            onDecide={onDecide}
          />
          <ActivityFeed activity={state.activity} />
        </div>
        <UsageCard spend={state.spend} />
      </div>
    </>
  );
}
