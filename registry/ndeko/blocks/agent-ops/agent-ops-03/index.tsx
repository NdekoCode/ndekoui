'use client';

import { useSession } from '@/registry/ndeko/hooks/use-session';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { StatusOrb } from '@/registry/ndeko/ui/status-orb';

import { MODELS_DURING_FAULT, PRODUCT_NAME, serviceOf, SERVICES } from './data';
import { Incidents } from './incidents';
import { LatencyChart } from './latency-chart';
import { ServiceList } from './services';
import {
  CONFIRM_MS,
  hasIncidentToday,
  INITIAL,
  isFaultOpen,
  isSlowNow,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  SCRIPT,
  type Reading,
  type StatusState,
} from './session';
import { Subscribe } from './subscribe';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

function headlineOf(isDegraded: boolean) {
  if (isDegraded) {
    return 'Model endpoints are slower than usual';
  }
  return 'All systems operational';
}

function orbToneOf(isDegraded: boolean) {
  if (isDegraded) {
    return 'warning';
  }
  return 'success';
}

/** While the fault slows the model endpoints, their chart shows the end of both lines lifted. */
function chartServiceOf(state: StatusState) {
  const isModels = state.selected === 'models';
  if (isModels && isSlowNow(state)) {
    return MODELS_DURING_FAULT;
  }
  return serviceOf(state.selected);
}

/** The day the demonstration reads leaves with the demonstration. */
function demoReadingOf(isDemonstrating: boolean, reading: Reading | null) {
  if (isDemonstrating) {
    return reading;
  }
  return null;
}

function spokenUnless(isDemonstrating: boolean, message: string) {
  if (isDemonstrating) {
    return '';
  }
  return message;
}

export default function AgentOps03() {
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
  const isDegraded = isFaultOpen(state);
  const headline = headlineOf(isDegraded);
  const chartService = chartServiceOf(state);
  const demoReading = demoReadingOf(isAutoplaying, state.reading);
  const message = spokenUnless(isAutoplaying, headline);
  const canReplay = isFinished && !isAutoplaying;

  function subscribe() {
    act({ type: 'subscribe' });
    schedule(() => act({ type: 'subscribed' }), CONFIRM_MS);
  }

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-background text-foreground @container min-h-dvh w-full'
      >
        <div className='mx-auto flex max-w-5xl flex-col gap-5 p-4 @3xl:gap-6 @3xl:p-8'>
          <header className='flex flex-wrap items-center gap-x-4 gap-y-3'>
            <StatusOrb tone={orbToneOf(isDegraded)} />
            <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
              <h1 className='text-xl font-semibold text-balance'>
                <Swap swapKey={headline}>{headline}</Swap>
              </h1>
              <p className='text-muted-foreground text-xs'>
                {PRODUCT_NAME} status · {SERVICES.length} services ·
                Illustrative figures
              </p>
            </div>
            <ReplayButton
              isShown={canReplay}
              onReplay={restart}
              label='Replay the incident'
            />
          </header>

          <div className='flex flex-col gap-4 @4xl:grid @4xl:grid-cols-2 @4xl:items-start @4xl:gap-5'>
            <div className='min-w-0 @4xl:order-2'>
              <LatencyChart service={chartService} />
            </div>
            <div className='min-w-0 @4xl:order-1'>
              <ServiceList
                selected={state.selected}
                hasFaultToday={hasIncidentToday(state)}
                isFaultOpen={isDegraded}
                demoReading={demoReading}
                pressed={pressed}
                onSelect={(id) => act({ type: 'selected', id })}
              />
            </div>
          </div>

          <div className='flex flex-col gap-5 @4xl:grid @4xl:grid-cols-[minmax(0,1fr)_22rem] @4xl:items-start @4xl:gap-8'>
            <Incidents liveUpdatesOut={state.updatesOut} />
            <Subscribe
              email={state.email}
              subscription={state.subscription}
              isPressed={pressed === 'subscribe'}
              onEmailChange={(text) => act({ type: 'typed', text })}
              onSubscribe={subscribe}
              onUnsubscribe={() => act({ type: 'unsubscribed' })}
            />
          </div>
        </div>
        <LiveRegion message={message} />
      </div>
    </ClockGate>
  );
}
