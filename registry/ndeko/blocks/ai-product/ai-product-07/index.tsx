'use client';

import { useCallback } from 'react';

import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { SwatchBookIcon } from '@/registry/ndeko/lib/icons';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { BriefPanel } from './brief-panel';
import { SECTION } from './data';
import { DirectionTiles } from './direction-tiles';
import { INITIAL, LOOP_AFTER_MS, reducer, RESTING, SCRIPT } from './session';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

export default function AiProduct07() {
  const { ref, isAutoplaying, state, act, pressed, isFinished, restart } =
    useSession(SESSION);
  useKeptHeight(ref);
  const message = spokenUnless(isAutoplaying, state.spoken);
  const canReplay = isFinished && !isAutoplaying;

  const focusLater = useCallback(
    (selector: string) => {
      requestAnimationFrame(() => {
        const target = ref.current?.querySelector<HTMLElement>(selector);
        target?.focus();
      });
    },
    [ref]
  );

  /** The button leaves with the results, so the focus goes back to the first direction. */
  function startOver() {
    act({ type: 'startedOver' });
    focusLater('[data-direction-tile]');
  }

  return (
    <section ref={ref} className='@container min-h-[96rem] @3xl:min-h-[52rem]'>
      <div className='mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 @2xl:px-6 @2xl:py-24 @5xl:px-8'>
        <header className='flex flex-wrap items-end justify-between gap-x-6 gap-y-4'>
          <div className='flex max-w-2xl flex-col gap-3'>
            <p className='text-primary-ink flex items-center gap-1.5 text-[13px] font-medium'>
              <SwatchBookIcon className='size-4' />
              {SECTION.label}
            </p>
            <h2 className='text-2xl font-semibold text-balance @2xl:text-3xl'>
              {SECTION.title}
            </h2>
            <p className='text-muted-foreground text-base text-pretty'>
              {SECTION.lead}
            </p>
          </div>
          <ReplayButton isShown={canReplay} onReplay={restart} label='Replay' />
        </header>
        <div className='grid gap-6 @3xl:grid-cols-[22rem_minmax(0,1fr)] @3xl:items-start'>
          <DirectionTiles
            pickedId={state.pickedId}
            pressed={pressed}
            onPick={(id) => act({ type: 'picked', id })}
          />
          <BriefPanel
            state={state}
            pressed={pressed}
            onKeyword={(index, text) =>
              act({ type: 'keywordEdited', index, text })
            }
            onGenerate={() => act({ type: 'generateStarted' })}
            onStartOver={startOver}
          />
        </div>
      </div>
      <LiveRegion message={message} />
    </section>
  );
}
