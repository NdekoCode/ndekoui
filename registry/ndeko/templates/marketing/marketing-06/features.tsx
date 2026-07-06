'use client';

import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { BoltIcon } from '@/registry/ndeko/lib/icons';
import { Badge } from '@/registry/ndeko/ui/badge';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { ANCHORS } from './data';
import {
  ApprovalTile,
  ContextTile,
  CostTile,
  PlanTile,
  PromptTile,
  TileFrame,
} from './feature-tiles';
import {
  INITIAL,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  SCRIPT,
  type ApprovalState,
  type Decision,
} from './features-session';
import { SectionFrame, SectionHeader } from './section-frame';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

function spokenLineOf(approval: ApprovalState) {
  if (approval === 'allowed') {
    return '14 journal entries posted';
  }
  if (approval === 'denied') {
    return 'Journal entries not posted';
  }
  return '';
}

export function Features() {
  const { ref, isAutoplaying, state, act, pressed, isFinished, restart } =
    useSession(SESSION);
  const canReplay = isFinished && !isAutoplaying;
  const message = spokenUnless(isAutoplaying, spokenLineOf(state.approval));

  useKeptHeight(ref);

  /** The first touch ends the demonstration, and the tiles rest on their pictures so the next one starts from a whole state. */
  function settle() {
    if (isAutoplaying) {
      act({ type: 'settled' });
    }
  }

  function settleOnKeyboardFocus(event: React.FocusEvent<HTMLElement>) {
    const isFromPerson = event.nativeEvent.isTrusted;
    const isKeyboardFocus = event.target.matches(':focus-visible');
    if (isFromPerson && isKeyboardFocus) {
      settle();
    }
  }

  function decide(decision: Decision) {
    act({ type: 'decided', decision });
  }

  return (
    <SectionFrame
      id={ANCHORS.features}
      ref={ref}
      onPointerDownCapture={settle}
      onKeyDownCapture={settle}
      onFocusCapture={settleOnKeyboardFocus}
    >
      <SectionHeader
        icon={BoltIcon}
        label='What it does'
        title='Every part of a close, working while you read'
        lead='Ask in plain words, read the plan, answer what waits on you. The tiles play in turn: click one to take over.'
      >
        <Badge variant='secondary'>Illustrative</Badge>
        <ReplayButton isShown={canReplay} onReplay={restart} label='Replay' />
      </SectionHeader>
      <div className='grid gap-4 @2xl:grid-cols-2 @4xl:grid-cols-6'>
        <TileFrame
          title='Ask in plain words'
          text='Say which month and which company. The close starts, and a status line says what it is doing.'
          isActive={state.focus === 'prompt'}
          className='@4xl:col-span-3'
        >
          <PromptTile prompt={state.prompt} stage={state.stage} />
        </TileFrame>
        <TileFrame
          title='A plan before any entry'
          text='Every close starts as a plan you can read. Its steps tick off as they finish.'
          isActive={state.focus === 'plan'}
          className='@4xl:col-span-3'
        >
          <PlanTile planStep={state.planStep} />
        </TileFrame>
        <TileFrame
          title='You approve what posts'
          text='Entries wait for Allow or Deny. Nothing reaches your ledger before you answer.'
          isActive={state.focus === 'approval'}
          className='@4xl:col-span-2'
        >
          <ApprovalTile
            approval={state.approval}
            pressed={pressed}
            onDecide={decide}
          />
        </TileFrame>
        <TileFrame
          title='A year of ledger in view'
          text='The history and your chart of accounts sit in one run, so a match is checked against how you booked it before.'
          isActive={state.focus === 'context'}
          className='@4xl:col-span-2'
        >
          <ContextTile percent={state.contextPercent} />
        </TileFrame>
        <TileFrame
          title='A cost you can see'
          text='Each close shows what it cost while it runs, so the bill holds no surprise.'
          isActive={state.focus === 'cost'}
          className='@2xl:col-span-2 @4xl:col-span-2'
        >
          <CostTile cents={state.costCents} />
        </TileFrame>
      </div>
      <LiveRegion message={message} />
    </SectionFrame>
  );
}
