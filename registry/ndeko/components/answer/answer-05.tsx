'use client';

import { AnimatePresence, motion, useInView, type PanInfo } from 'motion/react';
import { useRef, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll } from '@/components/core/word-roll';
import {
  useRunScript,
  type RunScriptStep,
} from '@/registry/ndeko/hooks/use-agent-run';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  emptyRun,
  formatDuration,
  type RunEvent,
  type RunSnapshot,
  type ToolCall,
} from '@/registry/ndeko/lib/agent-run';
import {
  CheckIcon,
  LoaderIcon,
  RotateCcwIcon,
} from '@/registry/ndeko/lib/icons';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { noiseAt } from '@/registry/ndeko/lib/speech-envelope';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Chip } from '@/registry/ndeko/ui/chip';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { LetterTile } from '@/registry/ndeko/ui/letter-tile';
import { ClockGate, LiveDuration } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';
import { Switch } from '@/registry/ndeko/ui/switch';
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/registry/ndeko/ui/tabs';

import { LabTile } from './_parts/lab-tile';
import type { LabId } from './_parts/labs';
import { StreamedWords } from './_parts/streamed-words';
import { useContainerWidth } from './_parts/use-container-width';
import { countOf, wordsOf } from './_parts/words';

export type ArenaModel = {
  id: string;
  name: string;
  lab: LabId;
  /** How long the model waits before its first word. */
  firstTokenMs: number;
  /** How long each next word takes. */
  wordMs: number;
  /** Dollars per million output tokens. */
  pricePerMillion: number;
  answer: string;
};

export type ContenderCount = 2 | 3;

export type ArenaVote =
  { kind: 'pick'; modelId: string } | { kind: 'tie' } | { kind: 'bad' };

export type Standing = {
  wins: number;
  ties: number;
};

type ColumnStatus = 'waiting' | 'streaming' | 'done';

type WordsOutput = { words: number };

const LETTERS = ['A', 'B', 'C'] as const;

const TOKENS_PER_WORD = 1.33;

/** Two columns need about 480px to read, three about 640px; below that the piece switches to tabs. */
const COLUMNS_MIN_WIDTH: Record<ContenderCount, number> = {
  2: 480,
  3: 640,
};

const SWIPE_DISTANCE = 56;

const SWIPE_SPEED = 400;

const COST = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});

function isWordsOutput(value: unknown): value is WordsOutput {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return typeof (value as WordsOutput).words === 'number';
}

function wordsShownOf(call: ToolCall | undefined) {
  if (!call) {
    return 0;
  }
  if (isWordsOutput(call.output)) {
    return call.output.words;
  }
  return 0;
}

function callOf(run: RunSnapshot, modelId: string) {
  return run.calls.find((call) => call.id === modelId);
}

function statusOf(call: ToolCall | undefined): ColumnStatus {
  if (!call) {
    return 'waiting';
  }
  if (call.status === 'done') {
    return 'done';
  }
  return 'streaming';
}

function tokensOf(words: number) {
  const tokens = words * TOKENS_PER_WORD;
  return Math.round(tokens);
}

function costOf(tokens: number, pricePerMillion: number) {
  const millions = tokens / 1_000_000;
  const cost = millions * pricePerMillion;
  return COST.format(cost);
}

function firstTokenTextOf(run: RunSnapshot, call: ToolCall | undefined) {
  const runStart = run.startedAt ?? 0;
  const callStart = call?.startedAt ?? runStart;
  const wait = callStart - runStart;
  return formatDuration(wait);
}

function letterOf(index: number) {
  return LETTERS[index] ?? 'A';
}

function blindNameOf(index: number) {
  const letter = letterOf(index);
  return `Model ${letter}`;
}

function labelOf(model: ArenaModel, index: number, isRevealed: boolean) {
  if (isRevealed) {
    return model.name;
  }
  return blindNameOf(index);
}

const STATUS_WORD: Record<ColumnStatus, string> = {
  waiting: 'Waiting',
  streaming: 'Answering',
  done: 'Done',
};

function StatusGlyph({ status }: { status: ColumnStatus }) {
  if (status === 'streaming') {
    return (
      <LoaderIcon className='text-muted-foreground size-3.5 animate-spin' />
    );
  }
  if (status === 'done') {
    return <CheckIcon className='text-success-foreground size-3.5' />;
  }
  return <span className='bg-muted-foreground/50 size-1.5 rounded-full' />;
}

function StatusMark({ status }: { status: ColumnStatus }) {
  return (
    <span className='inline-flex shrink-0'>
      <Swap swapKey={status} className='size-3.5 justify-center'>
        <StatusGlyph status={status} />
      </Swap>
      <span className='sr-only'>{STATUS_WORD[status]}</span>
    </span>
  );
}

function ModelMark({
  model,
  index,
  isRevealed,
}: {
  model: ArenaModel;
  index: number;
  isRevealed: boolean;
}) {
  return (
    <Swap swapKey={String(isRevealed)}>
      {isRevealed && <LabTile lab={model.lab} />}
      {!isRevealed && <LetterTile initial={letterOf(index)} />}
    </Swap>
  );
}

type ColumnMetersProps = {
  model: ArenaModel;
  run: RunSnapshot;
  call: ToolCall | undefined;
  words: number;
};

function ColumnMeters({ model, run, call, words }: ColumnMetersProps) {
  const tokens = tokensOf(words);
  const cost = costOf(tokens, model.pricePerMillion);
  const hasFirstToken = call !== undefined;
  const isRunGoing = run.status === 'running';
  const runSpan = { startedAt: run.startedAt };
  const hasStarted = run.startedAt !== undefined;
  const showsWaitClock = !hasFirstToken && hasStarted;

  return (
    <dl className='text-muted-foreground grid grid-cols-3 gap-1 text-[11px]'>
      <div className='flex min-w-0 flex-col'>
        <dt className='truncate'>First token</dt>
        <dd className='text-foreground tabular-nums'>
          {hasFirstToken && firstTokenTextOf(run, call)}
          {showsWaitClock && (
            <LiveDuration
              item={runSpan}
              isRunning={isRunGoing}
              className='text-muted-foreground'
            />
          )}
          {!hasStarted && '0.0s'}
        </dd>
      </div>
      <div className='flex min-w-0 flex-col'>
        <dt className='truncate'>Tokens</dt>
        <dd className='text-foreground tabular-nums'>{tokens}</dd>
      </div>
      <div className='flex min-w-0 flex-col'>
        <dt className='truncate'>Cost</dt>
        <dd className='text-foreground tabular-nums'>{cost}</dd>
      </div>
    </dl>
  );
}

function verdictOf(vote: ArenaVote | null, modelId: string) {
  if (!vote) {
    return null;
  }
  if (vote.kind === 'tie') {
    return 'Tie';
  }
  if (vote.kind === 'bad') {
    return 'Bad';
  }
  if (vote.modelId === modelId) {
    return 'Your pick';
  }
  return null;
}

function verdictColorOf(verdict: string) {
  if (verdict === 'Your pick') {
    return 'var(--primary)';
  }
  return 'var(--muted-foreground)';
}

function columnSurfaceOf(isPicked: boolean) {
  if (isPicked) {
    return 'bg-primary/[0.05] ring-primary/30';
  }
  return 'bg-foreground/[0.025] dark:bg-foreground/[0.04] ring-transparent';
}

type ArenaColumnProps = {
  model: ArenaModel;
  index: number;
  run: RunSnapshot;
  isRevealed: boolean;
  vote: ArenaVote | null;
  /** In tabs the tab names the model, so the column leaves its header out. */
  showsHeader?: boolean;
};

export function ArenaColumn({
  model,
  index,
  run,
  isRevealed,
  vote,
  showsHeader = true,
}: ArenaColumnProps) {
  const call = callOf(run, model.id);
  const status = statusOf(call);
  const words = wordsShownOf(call);
  const answerWords = wordsOf(model.answer);
  const isStreaming = status === 'streaming';
  const isWaiting = status === 'waiting';
  const verdict = verdictOf(vote, model.id);
  const isPicked = verdict === 'Your pick';
  const label = labelOf(model, index, isRevealed);

  return (
    <section
      aria-label={label}
      className={cn(
        'hairline-ring flex min-w-0 flex-col gap-3 rounded-xl p-3 transition-[background-color,box-shadow] duration-200',
        columnSurfaceOf(isPicked)
      )}
    >
      {showsHeader && (
        <header className='flex min-h-6 items-center gap-2'>
          <ModelMark model={model} index={index} isRevealed={isRevealed} />
          <span className='min-w-0 flex-1 truncate text-[13px] font-medium'>
            <WordRoll text={label} />
          </span>
          <StatusMark status={status} />
        </header>
      )}
      <ColumnMeters model={model} run={run} call={call} words={words} />
      <p className='min-h-[6lh] text-[13px] leading-relaxed'>
        {isWaiting && (
          <span className='text-muted-foreground'>
            Waiting for the first word
          </span>
        )}
        <StreamedWords
          words={answerWords}
          shown={words}
          isStreaming={isStreaming}
        />
      </p>
      <AnimatePresence initial={false}>
        {verdict && (
          <motion.span
            key={verdict}
            className='flex'
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Chip color={verdictColorOf(verdict)}>{verdict}</Chip>
          </motion.span>
        )}
      </AnimatePresence>
    </section>
  );
}

type VoteOption = {
  key: string;
  label: string;
  vote: ArenaVote;
};

function pickNameOf(model: ArenaModel, index: number, isRevealed: boolean) {
  if (isRevealed) {
    return model.name;
  }
  return letterOf(index);
}

function voteOptionsOf(
  models: ArenaModel[],
  isRevealed: boolean
): VoteOption[] {
  const isPair = models.length === 2;
  const verb = pickVerbOf(isPair);
  const options: VoteOption[] = models.map((model, index) => {
    const name = pickNameOf(model, index, isRevealed);
    return {
      key: model.id,
      label: `${name} ${verb}`,
      vote: { kind: 'pick', modelId: model.id },
    };
  });
  options.push({ key: 'tie', label: 'Tie', vote: { kind: 'tie' } });
  options.push({
    key: 'bad',
    label: badLabelOf(isPair),
    vote: { kind: 'bad' },
  });
  return options;
}

function pickVerbOf(isPair: boolean) {
  if (isPair) {
    return 'is better';
  }
  return 'is best';
}

function badLabelOf(isPair: boolean) {
  if (isPair) {
    return 'Both bad';
  }
  return 'All bad';
}

function resultLineOf(vote: ArenaVote, models: ArenaModel[]) {
  if (vote.kind === 'tie') {
    return 'You called it a tie';
  }
  if (vote.kind === 'bad') {
    return 'You marked every answer as bad';
  }
  const picked = models.find((model) => model.id === vote.modelId);
  return `You picked ${picked?.name ?? 'a model'}`;
}

type StandingRow = {
  model: ArenaModel;
  standing: Standing;
};

function byStanding(first: StandingRow, second: StandingRow) {
  const winGap = second.standing.wins - first.standing.wins;
  if (winGap !== 0) {
    return winGap;
  }
  const tieGap = second.standing.ties - first.standing.ties;
  if (tieGap !== 0) {
    return tieGap;
  }
  return first.model.name.localeCompare(second.model.name);
}

const NO_STANDING: Standing = { wins: 0, ties: 0 };

function standingRowsOf(
  models: ArenaModel[],
  standings: Record<string, Standing>
) {
  const rows = models.map((model) => {
    const standing = standings[model.id] ?? NO_STANDING;
    return { model, standing };
  });
  return rows.sort(byStanding);
}

type LeaderboardProps = {
  models: ArenaModel[];
  standings: Record<string, Standing>;
  rounds: number;
};

export function Leaderboard({ models, standings, rounds }: LeaderboardProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const rows = standingRowsOf(models, standings);
  const hasRounds = rounds > 0;
  const layoutTransition = layoutTransitionOf(shouldReduceMotion);

  return (
    <section aria-label='Leaderboard' className='flex flex-col gap-2'>
      <header className='flex items-baseline justify-between gap-3'>
        <h3 className='text-[13px] font-medium'>Leaderboard</h3>
        <span className='text-muted-foreground text-xs'>
          <WordRoll text={roundsLineOf(rounds)} />
        </span>
      </header>
      {!hasRounds && (
        <p className='text-muted-foreground text-xs'>
          Vote on a round to start the board
        </p>
      )}
      {hasRounds && (
        <table className='w-full text-xs'>
          <thead className='text-muted-foreground'>
            <tr>
              <th scope='col' className='pb-1 text-start font-normal'>
                Model
              </th>
              <th scope='col' className='w-14 pb-1 text-end font-normal'>
                Wins
              </th>
              <th scope='col' className='w-14 pb-1 text-end font-normal'>
                Ties
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <motion.tr
                key={row.model.id}
                layout='position'
                transition={layoutTransition}
                className='h-8'
              >
                <th scope='row' className='text-start font-normal'>
                  <span className='flex items-center gap-2'>
                    <LabTile lab={row.model.lab} size='sm' />
                    <span className='truncate'>{row.model.name}</span>
                  </span>
                </th>
                <td className='text-end tabular-nums'>
                  <MotionNumber value={row.standing.wins} />
                </td>
                <td className='text-muted-foreground text-end tabular-nums'>
                  <MotionNumber value={row.standing.ties} />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function roundsLineOf(rounds: number) {
  if (rounds === 0) {
    return 'No rounds yet';
  }
  return countOf(rounds, 'round');
}

function layoutTransitionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return { duration: 0 };
  }
  return { type: 'spring' as const, bounce: 0, duration: 0.35 };
}

function stepIndex(current: number, step: number, count: number) {
  const moved = current + step;
  const bounded = Math.min(count - 1, moved);
  return Math.max(0, bounded);
}

type ArenaTabsProps = {
  models: ArenaModel[];
  run: RunSnapshot;
  isRevealed: boolean;
  vote: ArenaVote | null;
  activeId: string;
  onActiveChange: (modelId: string) => void;
};

function ArenaTabs({
  models,
  run,
  isRevealed,
  vote,
  activeId,
  onActiveChange,
}: ArenaTabsProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const activeIndex = models.findIndex((model) => model.id === activeId);

  function swipe(
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) {
    const isFarLeft = info.offset.x < -SWIPE_DISTANCE;
    const isFastLeft = info.velocity.x < -SWIPE_SPEED;
    const isFarRight = info.offset.x > SWIPE_DISTANCE;
    const isFastRight = info.velocity.x > SWIPE_SPEED;
    const goesNext = isFarLeft || isFastLeft;
    const goesPrevious = isFarRight || isFastRight;
    if (goesNext) {
      const nextIndex = stepIndex(activeIndex, 1, models.length);
      onActiveChange(models[nextIndex].id);
      return;
    }
    if (goesPrevious) {
      const previousIndex = stepIndex(activeIndex, -1, models.length);
      onActiveChange(models[previousIndex].id);
    }
  }

  function changeTab(value: unknown) {
    const model = models.find((candidate) => candidate.id === value);
    if (model) {
      onActiveChange(model.id);
    }
  }

  return (
    <Tabs value={activeId} onValueChange={changeTab} className='gap-2'>
      <TabsList variant='segmented' className='w-full'>
        {models.map((model, index) => {
          const call = callOf(run, model.id);
          const status = statusOf(call);
          return (
            <TabsTab
              key={model.id}
              value={model.id}
              className='min-w-0 flex-1 gap-1.5 px-2 text-xs'
            >
              <span className='min-w-0 truncate'>
                <WordRoll text={labelOf(model, index, isRevealed)} />
              </span>
              <StatusMark status={status} />
            </TabsTab>
          );
        })}
      </TabsList>
      {models.map((model, index) => (
        <TabsPanel key={model.id} value={model.id}>
          <motion.div
            drag={dragOf(shouldReduceMotion)}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={swipe}
            style={{ touchAction: 'pan-y' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.18 }}
          >
            <ArenaColumn
              model={model}
              index={index}
              run={run}
              isRevealed={isRevealed}
              vote={vote}
              showsHeader={false}
            />
          </motion.div>
        </TabsPanel>
      ))}
      <p className='text-muted-foreground text-center text-[11px]'>
        Swipe or use the arrow keys to switch answers
      </p>
    </Tabs>
  );
}

function dragOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return false;
  }
  return 'x' as const;
}

const PROMPT =
  'Write a two-sentence note telling customers about the new pallet fee.';

const LUMEN: ArenaModel = {
  id: 'claude-sonnet',
  name: 'Claude Sonnet',
  lab: 'anthropic',
  firstTokenMs: 450,
  wordMs: 75,
  pricePerMillion: 15,
  answer:
    'From 1 October, orders of 40 pallets or more are billed a flat 18.40 EUR per pallet. Smaller orders keep the tiered rate they have today, so nothing changes for most of you.',
};

const QUARRY: ArenaModel = {
  id: 'gpt',
  name: 'GPT',
  lab: 'openai',
  firstTokenMs: 1100,
  wordMs: 45,
  pricePerMillion: 24,
  answer:
    'Bulk orders of 40 pallets and up move to one flat fee of 18.40 EUR per pallet on 1 October. If you order fewer pallets, your current rates stay exactly as they are.',
};

const HALDEN: ArenaModel = {
  id: 'gemini-pro',
  name: 'Gemini Pro',
  lab: 'google',
  firstTokenMs: 300,
  wordMs: 110,
  pricePerMillion: 6,
  answer:
    'We are simplifying pallet pricing. Starting 1 October, every order of 40 pallets or more costs 18.40 EUR per pallet, and smaller orders keep their tiers.',
};

const CONTENDERS: Record<ContenderCount, ArenaModel[]> = {
  2: [LUMEN, QUARRY],
  3: [LUMEN, QUARRY, HALDEN],
};

type Timed = { at: number; event: RunEvent };

function timelineOf(model: ArenaModel): Timed[] {
  const words = wordsOf(model.answer);
  const timed: Timed[] = [
    {
      at: model.firstTokenMs,
      event: {
        type: 'call.started',
        call: {
          id: model.id,
          tool: 'generate',
          label: model.name,
          status: 'running',
          output: { words: 1 },
        },
      },
    },
  ];
  let at = model.firstTokenMs;
  for (let shown = 2; shown <= words.length; shown += 1) {
    at += model.wordMs;
    timed.push({
      at,
      event: {
        type: 'call.updated',
        id: model.id,
        patch: { output: { words: shown } },
      },
    });
  }
  at += model.wordMs;
  timed.push({
    at,
    event: { type: 'call.updated', id: model.id, patch: { status: 'done' } },
  });
  return timed;
}

function byTime(first: Timed, second: Timed) {
  return first.at - second.at;
}

/** Every model streams on its own clock; the script interleaves them in the order a backend would send them. */
function roundScriptOf(models: ArenaModel[]): RunScriptStep[] {
  const timed: Timed[] = [];
  for (const model of models) {
    const modelTimeline = timelineOf(model);
    timed.push(...modelTimeline);
  }
  const ordered = [...timed].sort(byTime);
  const steps: RunScriptStep[] = [
    { after: 500, event: { type: 'run.started' } },
  ];
  let previousAt = 0;
  for (const item of ordered) {
    const gap = item.at - previousAt;
    steps.push({ after: gap, event: item.event });
    previousAt = item.at;
  }
  steps.push({ after: 0, event: { type: 'run.finished', status: 'done' } });
  return steps;
}

const ROUND_SCRIPTS: Record<ContenderCount, RunScriptStep[]> = {
  2: roundScriptOf(CONTENDERS[2]),
  3: roundScriptOf(CONTENDERS[3]),
};

const ROUND_RUN = emptyRun({ id: 'arena-round', title: 'Arena round' });

function permutationsOf(models: ArenaModel[]): ArenaModel[][] {
  if (models.length <= 1) {
    return [models];
  }
  const permutations: ArenaModel[][] = [];
  models.forEach((model, index) => {
    const before = models.slice(0, index);
    const after = models.slice(index + 1);
    const rest = [...before, ...after];
    for (const tail of permutationsOf(rest)) {
      permutations.push([model, ...tail]);
    }
  });
  return permutations;
}

/** A steady shuffle, so the server and the browser draw the same order for a round. */
function orderOf(count: ContenderCount, round: number) {
  const contenders = CONTENDERS[count];
  const permutations = permutationsOf(contenders);
  const draw = noiseAt(round, count);
  const scaled = draw * permutations.length;
  const index = Math.floor(scaled);
  const permutation = permutations[index] ?? contenders;
  return permutation;
}

function emptyStandings(count: ContenderCount) {
  const standings: Record<string, Standing> = {};
  for (const model of CONTENDERS[count]) {
    standings[model.id] = NO_STANDING;
  }
  return standings;
}

function withVote(
  standings: Record<string, Standing>,
  vote: ArenaVote,
  models: ArenaModel[]
) {
  const next = { ...standings };
  for (const model of models) {
    const current = next[model.id] ?? NO_STANDING;
    const isWinner = isWinnerOf(vote, model.id);
    const isTie = vote.kind === 'tie';
    const wins = winsAfter(current.wins, isWinner);
    const ties = winsAfter(current.ties, isTie);
    next[model.id] = { wins, ties };
  }
  return next;
}

function isWinnerOf(vote: ArenaVote, modelId: string) {
  if (vote.kind !== 'pick') {
    return false;
  }
  return vote.modelId === modelId;
}

function winsAfter(count: number, isCounted: boolean) {
  if (isCounted) {
    return count + 1;
  }
  return count;
}

function isRoundDone(run: RunSnapshot, models: ArenaModel[]) {
  return models.every((model) => {
    const call = callOf(run, model.id);
    return call?.status === 'done';
  });
}

function announcementOf(
  run: RunSnapshot,
  isDone: boolean,
  vote: ArenaVote | null,
  models: ArenaModel[]
) {
  if (vote) {
    const result = resultLineOf(vote, models);
    return `${result}. The leaderboard is updated`;
  }
  if (isDone) {
    return 'Every answer is in. Vote for the better one';
  }
  if (run.status === 'running') {
    return 'The models are answering';
  }
  return '';
}

const COUNTS: Segment<'2' | '3'>[] = [
  { value: '2', label: '2 models' },
  { value: '3', label: '3 models' },
];

function countFrom(value: '2' | '3'): ContenderCount {
  if (value === '3') {
    return 3;
  }
  return 2;
}

function countValueOf(count: ContenderCount) {
  if (count === 3) {
    return '3';
  }
  return '2';
}

function columnsClassOf(count: ContenderCount) {
  if (count === 3) {
    return 'grid-cols-3';
  }
  return 'grid-cols-2';
}

export default function Answer05() {
  const [count, setCount] = useState<ContenderCount>(2);
  const [round, setRound] = useState(1);
  const [isBlind, setIsBlind] = useState(true);
  const [vote, setVote] = useState<ArenaVote | null>(null);
  const [standings, setStandings] = useState(() => emptyStandings(2));
  const [votedRounds, setVotedRounds] = useState(0);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(rootRef, { amount: 0.3 });
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const width = useContainerWidth(frame, 720);
  const { snapshot, restart } = useRunScript(ROUND_SCRIPTS[count], {
    initial: ROUND_RUN,
    isActive: isInView,
  });
  const models = orderOf(count, round);
  const contenders = CONTENDERS[count];
  const isTabs = width < COLUMNS_MIN_WIDTH[count];
  const isDone = isRoundDone(snapshot, models);
  const hasVoted = vote !== null;
  const isRevealed = !isBlind || hasVoted;
  const canVote = isDone && !hasVoted;
  const options = voteOptionsOf(models, isRevealed);
  const tabId = activeTabId ?? models[0].id;
  const announcement = announcementOf(snapshot, isDone, vote, contenders);

  function runAgain() {
    setRound((current) => current + 1);
    setVote(null);
    setActiveTabId(null);
    restart();
  }

  function castVote(next: ArenaVote) {
    if (!canVote) {
      return;
    }
    setVote(next);
    setStandings((current) => withVote(current, next, contenders));
    setVotedRounds((current) => current + 1);
  }

  function changeCount(value: '2' | '3') {
    const next = countFrom(value);
    setCount(next);
    setRound(1);
    setVote(null);
    setStandings(emptyStandings(next));
    setVotedRounds(0);
    setActiveTabId(null);
    restart();
  }

  useKeptHeight(rootRef);

  return (
    <div
      ref={rootRef}
      className='bg-card hairline-ring ring-border flex w-full max-w-[52rem] flex-col gap-4 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <div className='bg-foreground/[0.04] dark:bg-foreground/[0.06] flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl py-2 ps-3.5 pe-2'>
        <p className='min-w-0 flex-1 basis-56 text-[13px] leading-snug'>
          {PROMPT}
        </p>
        <label className='text-muted-foreground flex cursor-pointer items-center gap-2 text-xs'>
          Blind
          <Switch
            checked={isBlind}
            onCheckedChange={(checked) => setIsBlind(checked)}
          />
        </label>
        <Button type='button' variant='outline' size='sm' onClick={runAgain}>
          <RotateCcwIcon />
          Run again
        </Button>
      </div>

      <div ref={setFrame}>
        <ClockGate isActive={isInView}>
          {isTabs && (
            <ArenaTabs
              models={models}
              run={snapshot}
              isRevealed={isRevealed}
              vote={vote}
              activeId={tabId}
              onActiveChange={setActiveTabId}
            />
          )}
          {!isTabs && (
            <div className={cn('grid gap-3', columnsClassOf(count))}>
              {models.map((model, index) => (
                <ArenaColumn
                  key={model.id}
                  model={model}
                  index={index}
                  run={snapshot}
                  isRevealed={isRevealed}
                  vote={vote}
                />
              ))}
            </div>
          )}
        </ClockGate>
      </div>

      <AnimatedSize>
        <AnimatePresence initial={false} mode='wait'>
          {canVote && (
            <motion.div
              key='vote'
              className='flex flex-col gap-2'
              {...rowPresence}
            >
              <p className='text-[13px] font-medium'>Which answer is better?</p>
              <div className='flex flex-wrap gap-1.5'>
                {options.map((option) => (
                  <Button
                    key={option.key}
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => castVote(option.vote)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
          {vote && (
            <motion.div
              key='result'
              className='flex flex-wrap items-center justify-between gap-2'
              {...rowPresence}
            >
              <p className='text-[13px]'>{resultLineOf(vote, contenders)}</p>
              <Button type='button' size='sm' onClick={runAgain}>
                <RotateCcwIcon />
                Next round
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </AnimatedSize>

      <div className='bg-foreground/[0.025] dark:bg-foreground/[0.04] rounded-xl p-3'>
        <Leaderboard
          models={contenders}
          standings={standings}
          rounds={votedRounds}
        />
      </div>

      <div className='flex flex-wrap items-center justify-between gap-3'>
        <p className='text-muted-foreground text-[11px]'>
          Illustrative: speeds, tokens and prices are made up for this demo
        </p>
        <Segments
          value={countValueOf(count)}
          segments={COUNTS}
          onValueChange={changeCount}
          label='Models in the arena'
          className='w-44'
        />
      </div>
      <LiveRegion message={announcement} />
    </div>
  );
}
