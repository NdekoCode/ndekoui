'use client';

import { useState } from 'react';

import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import type { CallStatus } from '@/registry/ndeko/lib/agent-run';
import { Button } from '@/registry/ndeko/ui/button';
import {
  CALL_STATUS_WORD,
  CallStatusMark,
} from '@/registry/ndeko/ui/call-status';
import { CopyButton } from '@/registry/ndeko/ui/copy-button';
import { JsonView } from '@/registry/ndeko/ui/json-view';
import { LetterTile } from '@/registry/ndeko/ui/letter-tile';
import { LevelBars } from '@/registry/ndeko/ui/level-bars';
import { ClockGate, LiveDuration } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

const INSTALL_COMMAND =
  'npx shadcn@latest add https://ui.ndekocode.dev/r/run-01.json';

export function CopyButtonDemo() {
  return (
    <div className='bg-foreground/[0.04] flex w-full max-w-xs items-center gap-2 rounded-md py-1 ps-3 pe-1'>
      <code className='text-muted-foreground min-w-0 flex-1 truncate font-mono text-xs'>
        {INSTALL_COMMAND}
      </code>
      <CopyButton text={INSTALL_COMMAND} label='Copy the install command' />
    </div>
  );
}

const SAVE_LABELS: Record<MorphState, string> = {
  idle: 'Publish version',
  busy: 'Publishing',
  done: 'Published',
};

const BUSY_MS = 900;

const DONE_MS = 1400;

export function MorphButtonDemo() {
  const [state, setState] = useState<MorphState>('idle');
  const { schedule } = useTimeouts();

  function publish() {
    setState('busy');
    schedule(() => setState('done'), BUSY_MS);
    const resetDelay = BUSY_MS + DONE_MS;
    schedule(() => setState('idle'), resetDelay);
  }

  return <MorphButton state={state} labels={SAVE_LABELS} onClick={publish} />;
}

type Timing = { startedAt?: number; endedAt?: number };

function actionLabelOf(isRunning: boolean) {
  if (isRunning) {
    return 'Stop';
  }
  return 'Run the tests';
}

export function LiveDurationDemo() {
  const [timing, setTiming] = useState<Timing>({});
  const isRunning =
    timing.startedAt !== undefined && timing.endedAt === undefined;

  function toggle() {
    const now = Date.now();
    if (isRunning) {
      setTiming((current) => ({ ...current, endedAt: now }));
      return;
    }
    setTiming({ startedAt: now });
  }

  return (
    <ClockGate isActive>
      <div className='flex items-center gap-3 text-[13px]'>
        <Button type='button' variant='outline' size='sm' onClick={toggle}>
          {actionLabelOf(isRunning)}
        </Button>
        <LiveDuration
          item={timing}
          isRunning={isRunning}
          className='text-muted-foreground'
        />
      </div>
    </ClockGate>
  );
}

type View = 'list' | 'bars' | 'change';

const VIEWS: Segment<View>[] = [
  { value: 'list', label: 'List' },
  { value: 'bars', label: 'Bars' },
  { value: 'change', label: 'Change' },
];

export function SegmentsDemo() {
  const [view, setView] = useState<View>('list');
  return (
    <Segments
      value={view}
      segments={VIEWS}
      onValueChange={setView}
      label='View'
    />
  );
}

const SAMPLE_RESULT = {
  vendor: 'Brightmoor Supply',
  lines: 1284,
  aboveList: 6,
  credit: 1840.2,
  sent: true,
};

export function JsonViewDemo() {
  return <JsonView value={SAMPLE_RESULT} className='w-full max-w-xs' />;
}

const STATUSES: CallStatus[] = [
  'queued',
  'running',
  'waiting',
  'done',
  'failed',
];

function nextStatusOf(status: CallStatus) {
  const index = STATUSES.indexOf(status);
  const next = index + 1;
  const wrapped = next % STATUSES.length;
  return STATUSES[wrapped];
}

export function CallStatusDemo() {
  const [status, setStatus] = useState<CallStatus>('queued');

  function advance() {
    setStatus((current) => nextStatusOf(current));
  }

  return (
    <div className='flex items-center gap-3 text-[13px]'>
      <CallStatusMark status={status} />
      <span className='w-24'>{CALL_STATUS_WORD[status]}</span>
      <Button type='button' variant='outline' size='sm' onClick={advance}>
        Next state
      </Button>
    </div>
  );
}

export function ReplayButtonDemo() {
  const [round, setRound] = useState(1);

  function replay() {
    setRound((current) => current + 1);
  }

  return (
    <div className='flex items-center gap-3 text-[13px]'>
      <span className='text-muted-foreground tabular-nums'>Round {round}</span>
      <ReplayButton isShown onReplay={replay} />
    </div>
  );
}

function listenLabelOf(isListening: boolean) {
  if (isListening) {
    return 'Stop';
  }
  return 'Speak';
}

export function LevelBarsDemo() {
  const [isListening, setIsListening] = useState(false);

  function toggle() {
    setIsListening((current) => !current);
  }

  return (
    <div className='flex items-center gap-3 text-[13px]'>
      <LevelBars isActive={isListening} intensity={1} count={20} />
      <Button
        type='button'
        variant='outline'
        size='sm'
        aria-pressed={isListening}
        onClick={toggle}
      >
        {listenLabelOf(isListening)}
      </Button>
    </div>
  );
}

const LAB_TILES = [
  { name: 'Lumen', initial: 'L', series: 1 },
  { name: 'Quarry', initial: 'Q', series: 2 },
  { name: 'Halden', initial: 'H', series: 3 },
] as const;

export function LetterTileDemo() {
  return (
    <ul className='flex flex-col gap-2 text-[13px]'>
      {LAB_TILES.map((lab) => (
        <li key={lab.name} className='flex items-center gap-2'>
          <LetterTile initial={lab.initial} series={lab.series} />
          {lab.name}
        </li>
      ))}
      <li className='text-muted-foreground flex items-center gap-2'>
        <LetterTile initial='D' />
        docs.halden.example, neutral beside agents
      </li>
    </ul>
  );
}

const ANNOUNCEMENTS = [
  'Approved: send the credit request',
  'The run finished in 9.4s',
  'Two requests wait for you',
];

export function LiveRegionDemo() {
  const [index, setIndex] = useState(-1);
  const hasMessage = index >= 0;
  const message = ANNOUNCEMENTS[index] ?? '';

  function announce() {
    setIndex((current) => {
      const next = current + 1;
      return next % ANNOUNCEMENTS.length;
    });
  }

  return (
    <div className='flex flex-col items-start gap-2 text-[13px]'>
      <Button type='button' variant='outline' size='sm' onClick={announce}>
        Announce a change
      </Button>
      {hasMessage && (
        <p className='text-muted-foreground'>Screen readers hear: {message}</p>
      )}
      <LiveRegion message={message} />
    </div>
  );
}
