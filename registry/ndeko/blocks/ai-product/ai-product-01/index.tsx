'use client';

import { MotionNumber } from '@/components/core/motion-number';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import {
  pressedQuietOf,
  spokenUnless,
} from '@/registry/ndeko/lib/demonstration';
import { GaugeIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold, Swap } from '@/registry/ndeko/ui/chat-motion';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { Tabs, TabsList, TabsTab } from '@/registry/ndeko/ui/tabs';

import { DayChart } from './day-chart';
import {
  isNearLimit,
  PERIODS,
  percentOf,
  periodOf,
  shareOf,
  USAGE,
  usedOf,
  WORKSPACE,
} from './data';
import { LimitRows } from './limit-rows';
import { INITIAL, LOOP_AFTER_MS, reducer, RESTING, SCRIPT } from './session';
import { ModelLegend, UsageBar } from './usage-bar';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

const SURFACE =
  'bg-card hairline-ring ring-border dark:bg-foreground/[0.03] rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]';

type Standing = {
  variant: 'warning' | 'success';
  label: string;
};

const NEAR_LIMIT: Standing = { variant: 'warning', label: 'Near the limit' };

const WITHIN_PLAN: Standing = { variant: 'success', label: 'Within the plan' };

function standingOf(isNear: boolean) {
  if (isNear) {
    return NEAR_LIMIT;
  }
  return WITHIN_PLAN;
}

export default function AiProduct01() {
  const { ref, isAutoplaying, state, act, pressed, isFinished, restart } =
    useSession(SESSION);
  useKeptHeight(ref);
  const { period, hasChanged } = state;
  const usage = USAGE[period];
  const used = usedOf(usage);
  const share = shareOf(used, usage.limit);
  const isNear = isNearLimit(share);
  const standing = standingOf(isNear);
  const shown = periodOf(period);
  const hasUpgrade = usage.upgrade !== null;
  const upgradeLine = usage.upgrade ?? USAGE.month.upgrade ?? '';
  const message = spokenUnless(isAutoplaying, state.spoken);
  const canReplay = isFinished && !isAutoplaying;

  function pickPeriod(value: unknown) {
    const picked = PERIODS.find((candidate) => candidate.id === value);
    if (picked) {
      act({ type: 'periodPicked', period: picked.id });
    }
  }

  return (
    <div
      ref={ref}
      className='bg-background text-foreground @container min-h-[46rem] w-full @3xl:min-h-[40rem]'
    >
      <div className='mx-auto flex max-w-4xl flex-col gap-5 px-4 py-8 @2xl:px-6 @2xl:py-12'>
        <header className='flex flex-wrap items-center justify-between gap-x-4 gap-y-3'>
          <div className='flex min-w-0 items-center gap-2.5'>
            <CompanyMark seed={WORKSPACE.name} size='lg' />
            <div className='flex min-w-0 flex-col'>
              <h2 className='truncate text-sm font-medium'>Usage and limits</h2>
              <p className='text-muted-foreground flex items-center gap-1.5 text-xs'>
                {WORKSPACE.name}, {WORKSPACE.plan}
                <Badge variant='secondary'>Illustrative</Badge>
              </p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <ReplayButton
              isShown={canReplay}
              onReplay={restart}
              label='Replay'
            />
            <Tabs value={period} onValueChange={pickPeriod}>
              <TabsList variant='segmented' aria-label='Period'>
                {PERIODS.map((candidate) => (
                  <TabsTab
                    key={candidate.id}
                    value={candidate.id}
                    className={cn(
                      'text-xs transition-[color,background-color,scale]',
                      pressedQuietOf(pressed === `period-${candidate.id}`)
                    )}
                  >
                    {candidate.label}
                  </TabsTab>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </header>

        <section
          aria-label='Credits used'
          className={cn(SURFACE, 'flex flex-col gap-5 p-5 @2xl:p-6')}
        >
          <div className='flex flex-wrap items-end justify-between gap-x-4 gap-y-2'>
            <div className='flex flex-col gap-1'>
              <p className='text-muted-foreground flex items-center gap-1.5 text-[13px] font-medium'>
                <GaugeIcon className='size-4' />
                Credits used {shown.spoken}
              </p>
              <p className='flex items-baseline gap-2'>
                <MotionNumber
                  value={used}
                  className='text-3xl font-semibold @2xl:text-4xl'
                />
                <span className='text-muted-foreground flex items-baseline gap-1 text-[13px]'>
                  of
                  <MotionNumber value={usage.limit} />
                </span>
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <span className='flex items-baseline text-[13px] tabular-nums'>
                <MotionNumber value={percentOf(share)} suffix='%' />
              </span>
              <Swap swapKey={standing.label}>
                <Badge variant={standing.variant}>{standing.label}</Badge>
              </Swap>
            </div>
          </div>
          <UsageBar
            periodId={period}
            limit={usage.limit}
            used={used}
            byModel={usage.byModel}
            hasChanged={hasChanged}
          />
          <ModelLegend byModel={usage.byModel} />
          <Fold open={hasUpgrade}>
            <div className='bg-foreground/[0.04] flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg p-3'>
              <p className='min-w-0 flex-1 text-[13px] text-pretty'>
                {upgradeLine}
              </p>
              <Button type='button' size='sm' variant='outline'>
                Compare plans
              </Button>
            </div>
          </Fold>
        </section>

        <div className='grid gap-5 @3xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]'>
          <section
            aria-label={shown.chartTitle}
            className={cn(SURFACE, 'flex flex-col gap-4 p-5 @2xl:p-6')}
          >
            <h3 className='text-sm font-medium'>
              <Swap swapKey={shown.chartTitle}>{shown.chartTitle}</Swap>
            </h3>
            <DayChart
              periodId={period}
              values={usage.chart}
              labels={shown.chartLabels}
              caption={`${shown.chartTitle}, illustrative`}
              hasChanged={hasChanged}
            />
          </section>
          <section
            aria-label='Plan limits'
            className={cn(SURFACE, 'flex flex-col gap-4 p-5 @2xl:p-6')}
          >
            <h3 className='text-sm font-medium'>Plan limits</h3>
            <LimitRows />
          </section>
        </div>
      </div>
      <LiveRegion message={message} />
    </div>
  );
}
