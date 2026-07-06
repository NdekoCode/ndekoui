'use client';

import { useEffect, useId } from 'react';

import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import {
  pressedSolidOf,
  spokenUnless,
} from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { Label } from '@/registry/ndeko/ui/label';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Textarea } from '@/registry/ndeko/ui/textarea';

import { HERO_LOOKS, HERO_TAKES, MAKE_LABEL } from './data';
import { MugScene, TakeFrame, type TakeState } from './scenes';
import {
  MAKE_PRESS_KEY,
  READY_DELAYS_MS,
  SESSION,
  TAKE_COUNT,
  type StudioState,
} from './studio-session';

const DEFAULT_READY_MS = 800;

function takeStateOf(state: StudioState, index: number): TakeState {
  if (state.stage === 'typing') {
    return 'idle';
  }
  if (index < state.readyCount) {
    return 'ready';
  }
  return 'developing';
}

function statusOf(state: StudioState) {
  if (state.stage === 'making') {
    const current = state.readyCount + 1;
    return `Developing take ${current} of ${TAKE_COUNT}`;
  }
  if (state.stage === 'done') {
    return `${TAKE_COUNT} takes ready`;
  }
  return `${TAKE_COUNT} takes per brief`;
}

function seedToneOf(isReady: boolean) {
  if (isReady) {
    return 'opacity-100';
  }
  return 'opacity-0';
}

export function StudioCard() {
  const { ref, isInView, isAutoplaying, state, act, pressed } =
    useSession(SESSION);
  const briefId = useId();
  const isMaking = state.stage === 'making';
  const hasBrief = state.brief.trim() !== '';
  const canMake = hasBrief && !isMaking;
  const isMakePressed = pressed === MAKE_PRESS_KEY;
  const status = statusOf(state);
  const message = spokenUnless(isAutoplaying, status);
  useKeptHeight(ref);

  useEffect(() => {
    if (!isMaking || !isInView) {
      return;
    }
    const delay = READY_DELAYS_MS[state.readyCount] ?? DEFAULT_READY_MS;
    const timer = setTimeout(() => act({ type: 'takeReady' }), delay);
    return () => clearTimeout(timer);
  }, [isMaking, isInView, state.readyCount, act]);

  function type(event: React.ChangeEvent<HTMLTextAreaElement>) {
    act({ type: 'typed', text: event.target.value });
  }

  function make() {
    act({ type: 'made' });
  }

  return (
    <div
      ref={ref}
      className='bg-foreground/[0.03] @container/studio min-h-[34rem] rounded-2xl p-2 @sm/studio:p-3'
    >
      <div className='bg-card hairline-ring ring-border dark:bg-foreground/[0.04] flex flex-col gap-4 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
        <div className='flex flex-col gap-2'>
          <Label htmlFor={briefId}>Brief</Label>
          <Textarea
            id={briefId}
            value={state.brief}
            onChange={type}
            placeholder='Describe the shot'
            className='min-h-[5rem]'
          />
        </div>
        <div className='flex flex-wrap items-center gap-3'>
          <Button
            size='lg'
            disabled={!canMake}
            onClick={make}
            className={pressedSolidOf(isMakePressed)}
          >
            {MAKE_LABEL}
          </Button>
          <p className='text-muted-foreground text-xs tabular-nums'>
            <Swap swapKey={status}>{status}</Swap>
          </p>
        </div>
        <ul className='grid grid-cols-2 gap-2'>
          {HERO_TAKES.map((take, index) => {
            const takeState = takeStateOf(state, index);
            const isReady = takeState === 'ready';
            return (
              <li key={take.id} className='flex flex-col gap-1.5'>
                <TakeFrame state={takeState}>
                  <MugScene look={HERO_LOOKS[index]} />
                </TakeFrame>
                <div className='flex items-center justify-between gap-2 text-xs'>
                  <span className='text-muted-foreground'>
                    Take {index + 1}
                  </span>
                  <Badge
                    variant='secondary'
                    className={cn(
                      'tabular-nums transition-opacity duration-300',
                      seedToneOf(isReady)
                    )}
                  >
                    {take.seed}
                  </Badge>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <LiveRegion message={message} />
    </div>
  );
}
