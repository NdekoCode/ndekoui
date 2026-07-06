'use client';

import { AnimatePresence, motion, useInView } from 'motion/react';
import { useRef, useState } from 'react';

import {
  useRunScript,
  type RunScriptStep,
} from '@/registry/ndeko/hooks/use-agent-run';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import {
  emptyRun,
  seriesColorOf,
  type RunSnapshot,
  type SeriesSlot,
} from '@/registry/ndeko/lib/agent-run';
import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';
import {
  GitBranchIcon,
  HistoryIcon,
  UserIcon,
} from '@/registry/ndeko/lib/icons';
import {
  rowPresenceOf,
  slowSpringOf,
} from '@/registry/ndeko/lib/motion-presets';
import { countOf } from '@/registry/ndeko/lib/words';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { Button } from '@/registry/ndeko/ui/button';
import { Chip } from '@/registry/ndeko/ui/chip';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

export type Strategy = 'current' | 'merge' | 'rebase' | 'squash';

export type GraphAgent = {
  name: string;
  series: SeriesSlot;
};

export type GraphCommit = {
  id: string;
  message: string;
  lane: number;
  parents: string[];
  minutesAgo: number;
  agent?: GraphAgent;
  /** The model the agent wrote the commit with, drawn neutral beside the agent colours. */
  modelBrand?: BrandSlug;
  modelName?: string;
  author?: string;
  isCheckpoint?: boolean;
};

export type GraphLane = {
  index: number;
  branch: string;
  color: string;
};

type GraphNode = {
  commit: GraphCommit;
  lane: number;
  row: number;
  isPreview: boolean;
  isGhost: boolean;
};

const ROW_HEIGHT = 40;

const LANE_GAP = 18;

const LANE_PAD = 12;

const DOT_RADIUS = 4.5;

const CODER: GraphAgent = { name: 'Coder', series: 5 };

const WRITER: GraphAgent = { name: 'Writer', series: 3 };

const LANES: GraphLane[] = [
  { index: 0, branch: 'main', color: 'var(--muted-foreground)' },
  { index: 1, branch: 'coder/flat-fee', color: seriesColorOf(5) },
  { index: 2, branch: 'writer/notice', color: seriesColorOf(3) },
];

const FEATURE_LANE = 1;

function laneOf(index: number) {
  return LANES[index] ?? LANES[0];
}

function xOf(lane: number) {
  const offset = lane * LANE_GAP;
  return LANE_PAD + offset;
}

function yOf(row: number) {
  const top = row * ROW_HEIGHT;
  return top + ROW_HEIGHT / 2;
}

function byNewest(first: GraphCommit, second: GraphCommit) {
  return first.minutesAgo - second.minutesAgo;
}

function nodesOf(commits: GraphCommit[], isPreview: (id: string) => boolean) {
  return commits.map((commit, row) => ({
    commit,
    lane: commit.lane,
    row,
    isPreview: isPreview(commit.id),
    isGhost: false,
  }));
}

function neverPreview() {
  return false;
}

function featureCommitsOf(history: GraphCommit[]) {
  const feature = history.filter((commit) => commit.lane === FEATURE_LANE);
  return [...feature].sort(byNewest);
}

function mainTipOf(history: GraphCommit[]) {
  const main = history.filter((commit) => commit.lane === 0);
  const sorted = [...main].sort(byNewest);
  return sorted[0];
}

function mergeCommitOf(history: GraphCommit[]): GraphCommit | null {
  const [featureTip] = featureCommitsOf(history);
  const mainTip = mainTipOf(history);
  if (!featureTip) {
    return null;
  }
  return {
    id: 'merge',
    message: 'Merge coder/flat-fee into main',
    lane: 0,
    parents: [mainTip.id, featureTip.id],
    minutesAgo: -1,
    author: 'You',
  };
}

function squashCommitOf(history: GraphCommit[]): GraphCommit | null {
  const feature = featureCommitsOf(history);
  const mainTip = mainTipOf(history);
  if (feature.length === 0) {
    return null;
  }
  const commits = countOf(feature.length, 'commit');
  return {
    id: 'squash',
    message: `Bill bulk pallets at a flat fee (${commits})`,
    lane: 0,
    parents: [mainTip.id],
    minutesAgo: -1,
    agent: CODER,
    modelBrand: 'claude',
    modelName: 'Claude Sonnet',
  };
}

/** Rebased commits keep their messages and authors but move onto main, each on the one before it. */
function rebasedOf(history: GraphCommit[]) {
  const feature = featureCommitsOf(history);
  const oldestFirst = [...feature].reverse();
  const mainTip = mainTipOf(history);
  const rebased: GraphCommit[] = [];
  let parentId = mainTip.id;
  for (const commit of oldestFirst) {
    rebased.push({ ...commit, lane: 0, parents: [parentId] });
    parentId = commit.id;
  }
  return rebased.reverse();
}

type GraphView = {
  nodes: GraphNode[];
  ghosts: GraphNode[];
};

function currentViewOf(history: GraphCommit[]): GraphView {
  const sorted = [...history].sort(byNewest);
  return { nodes: nodesOf(sorted, neverPreview), ghosts: [] };
}

function mergeViewOf(history: GraphCommit[]): GraphView {
  const merge = mergeCommitOf(history);
  if (!merge) {
    return currentViewOf(history);
  }
  const sorted = [...history].sort(byNewest);
  const commits = [merge, ...sorted];
  const isMerge = (id: string) => id === merge.id;
  return { nodes: nodesOf(commits, isMerge), ghosts: [] };
}

function rebaseViewOf(history: GraphCommit[]): GraphView {
  const rebased = rebasedOf(history);
  if (rebased.length === 0) {
    return currentViewOf(history);
  }
  const others = history.filter((commit) => commit.lane !== FEATURE_LANE);
  const sortedOthers = [...others].sort(byNewest);
  const commits = [...rebased, ...sortedOthers];
  const rebasedIds = rebased.map((commit) => commit.id);
  const isRebased = (id: string) => rebasedIds.includes(id);
  return { nodes: nodesOf(commits, isRebased), ghosts: [] };
}

function squashViewOf(history: GraphCommit[]): GraphView {
  const squash = squashCommitOf(history);
  if (!squash) {
    return currentViewOf(history);
  }
  const feature = featureCommitsOf(history);
  const others = history.filter((commit) => commit.lane !== FEATURE_LANE);
  const sortedOthers = [...others].sort(byNewest);
  const commits = [squash, ...sortedOthers];
  const isSquash = (id: string) => id === squash.id;
  const ghosts = feature.map((commit) => ({
    commit,
    lane: 0,
    row: 0,
    isPreview: false,
    isGhost: true,
  }));
  return { nodes: nodesOf(commits, isSquash), ghosts };
}

export function viewOf(history: GraphCommit[], strategy: Strategy): GraphView {
  if (strategy === 'merge') {
    return mergeViewOf(history);
  }
  if (strategy === 'rebase') {
    return rebaseViewOf(history);
  }
  if (strategy === 'squash') {
    return squashViewOf(history);
  }
  return currentViewOf(history);
}

function appliedHistoryOf(history: GraphCommit[], strategy: Strategy) {
  if (strategy === 'merge') {
    const merge = mergeCommitOf(history);
    if (!merge) {
      return history;
    }
    return [{ ...merge, minutesAgo: 0 }, ...history];
  }
  if (strategy === 'rebase') {
    const rebased = rebasedOf(history);
    const others = history.filter((commit) => commit.lane !== FEATURE_LANE);
    return [...rebased, ...others];
  }
  if (strategy === 'squash') {
    const squash = squashCommitOf(history);
    const others = history.filter((commit) => commit.lane !== FEATURE_LANE);
    if (!squash) {
      return others;
    }
    return [{ ...squash, minutesAgo: 0 }, ...others];
  }
  return history;
}

/**
 * Every edge has the same shape (move, line, curve, line), so a path can morph into any other:
 * a fork bends just above its parent, a merge just below its child, and a straight edge keeps its bend flat.
 */
function edgePathOf(child: GraphNode, parent: GraphNode) {
  const x1 = xOf(child.lane);
  const y1 = yOf(child.row);
  const x2 = xOf(parent.lane);
  const y2 = yOf(parent.row);
  const halfRow = ROW_HEIGHT / 2;
  const isFork = child.lane > parent.lane;
  const isMerge = child.lane < parent.lane;
  if (isFork) {
    const bendTop = y2 - ROW_HEIGHT;
    const bendMiddle = y2 - halfRow;
    return `M ${x1} ${y1} L ${x1} ${bendTop} C ${x1} ${bendMiddle} ${x2} ${bendMiddle} ${x2} ${y2} L ${x2} ${y2}`;
  }
  if (isMerge) {
    const bendMiddle = y1 + halfRow;
    const bendEnd = y1 + ROW_HEIGHT;
    return `M ${x1} ${y1} L ${x1} ${y1} C ${x1} ${bendMiddle} ${x2} ${bendMiddle} ${x2} ${bendEnd} L ${x2} ${y2}`;
  }
  return `M ${x1} ${y1} L ${x1} ${y1} C ${x1} ${y1} ${x2} ${y2} ${x2} ${y2} L ${x2} ${y2}`;
}

type Edge = {
  key: string;
  path: string;
  color: string;
  isPreview: boolean;
};

function edgesOf(nodes: GraphNode[]) {
  const byId = new Map<string, GraphNode>();
  for (const node of nodes) {
    byId.set(node.commit.id, node);
  }
  const edges: Edge[] = [];
  for (const node of nodes) {
    for (const parentId of node.commit.parents) {
      const parent = byId.get(parentId);
      if (!parent) {
        continue;
      }
      const branchLane = Math.max(node.lane, parent.lane);
      const color = laneOf(branchLane).color;
      edges.push({
        key: `${node.commit.id}-${parentId}`,
        path: edgePathOf(node, parent),
        color,
        isPreview: node.isPreview,
      });
    }
  }
  return edges;
}

function tipsOf(nodes: GraphNode[]) {
  const tips = new Map<number, string>();
  for (const node of nodes) {
    const hasTip = tips.has(node.lane);
    if (!hasTip) {
      tips.set(node.lane, node.commit.id);
    }
  }
  return tips;
}

function graphWidthOf() {
  const lastLane = LANES.length - 1;
  const lanesWidth = xOf(lastLane);
  return lanesWidth + LANE_PAD;
}

function dotStrokeOf(node: GraphNode) {
  if (node.isPreview) {
    return '3 2';
  }
  return undefined;
}

function dotFillOf(node: GraphNode, color: string) {
  const isHollow = node.isPreview || node.commit.isCheckpoint === true;
  if (isHollow) {
    return 'var(--card)';
  }
  return color;
}

type BranchGraphProps = {
  view: GraphView;
};

function BranchGraph({ view }: BranchGraphProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const glide = slowSpringOf(shouldReduceMotion);
  const edges = edgesOf(view.nodes);
  const width = graphWidthOf();
  const height = view.nodes.length * ROW_HEIGHT;
  const dots = [...view.ghosts, ...view.nodes];

  return (
    <svg
      aria-hidden='true'
      width={width}
      height={height}
      className='absolute start-0 top-0 overflow-visible'
    >
      <AnimatePresence initial={false}>
        {edges.map((edge) => (
          <motion.path
            key={edge.key}
            fill='none'
            stroke={edge.color}
            strokeWidth={1.75}
            strokeLinecap='round'
            strokeDasharray={edgeDashOf(edge.isPreview)}
            initial={{ opacity: 0, d: edge.path }}
            animate={{ opacity: 1, d: edge.path }}
            exit={{ opacity: 0 }}
            transition={glide}
          />
        ))}
      </AnimatePresence>
      <AnimatePresence initial={false}>
        {dots.map((node) => {
          const color = laneOf(node.lane).color;
          const isGhost = node.isGhost;
          return (
            <motion.circle
              key={node.commit.id}
              r={DOT_RADIUS}
              fill={dotFillOf(node, color)}
              stroke={color}
              strokeWidth={1.75}
              strokeDasharray={dotStrokeOf(node)}
              initial={{
                opacity: 0,
                cx: xOf(node.lane),
                cy: yOf(node.row),
              }}
              animate={{
                opacity: ghostOpacityOf(isGhost),
                cx: xOf(node.lane),
                cy: yOf(node.row),
              }}
              exit={{ opacity: 0 }}
              transition={glide}
            />
          );
        })}
      </AnimatePresence>
    </svg>
  );
}

function edgeDashOf(isPreview: boolean) {
  if (isPreview) {
    return '3 3';
  }
  return undefined;
}

function ghostOpacityOf(isGhost: boolean) {
  if (isGhost) {
    return 0;
  }
  return 1;
}

function timeLabelOf(minutesAgo: number) {
  if (minutesAgo <= 0) {
    return 'now';
  }
  if (minutesAgo < 60) {
    return `${minutesAgo} min`;
  }
  const hours = Math.floor(minutesAgo / 60);
  return `${hours} h`;
}

function AuthorMark({ commit }: { commit: GraphCommit }) {
  const agent = commit.agent;
  if (agent) {
    return <MeshTile seed={agent.name} color={seriesColorOf(agent.series)} />;
  }
  return (
    <span className='keycap-3d text-muted-foreground inline-flex size-5 shrink-0 items-center justify-center rounded-[5px]'>
      <UserIcon className='size-3' />
    </span>
  );
}

function authorWordsOf(commit: GraphCommit) {
  const agent = commit.agent;
  if (!agent) {
    return `by ${commit.author ?? 'a person'}`;
  }
  const model = commit.modelName;
  if (!model) {
    return `by ${agent.name}`;
  }
  return `by ${agent.name} with ${model}`;
}

type CommitRowProps = {
  node: GraphNode;
  tipBranch: string | null;
  canRestore: boolean;
  onRestore: (commitId: string) => void;
};

function CommitRow({ node, tipBranch, canRestore, onRestore }: CommitRowProps) {
  const { commit } = node;
  const tipLane = laneOf(node.lane);
  const showsRestore = commit.isCheckpoint === true && canRestore;

  return (
    <div className='flex h-10 min-w-0 items-center gap-2'>
      <AuthorMark commit={commit} />
      {tipBranch && (
        <Chip color={tipLane.color} className='hidden max-w-32 @md:inline-flex'>
          <GitBranchIcon />
          <span className='truncate'>{tipBranch}</span>
        </Chip>
      )}
      <span className='min-w-0 flex-1 truncate text-[13px]'>
        {commit.message}
        <span className='sr-only'>, {authorWordsOf(commit)}</span>
        {commit.isCheckpoint && <span className='sr-only'>, checkpoint</span>}
      </span>
      {node.isPreview && (
        <span className='text-muted-foreground hairline-border border-foreground/25 shrink-0 rounded-md border-dashed px-1.5 text-[11px]'>
          Preview
        </span>
      )}
      {commit.modelBrand && <BrandTile brand={commit.modelBrand} size='sm' />}
      {showsRestore && (
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={() => onRestore(commit.id)}
          className='text-muted-foreground h-7 px-2'
          aria-label={`Restore to the checkpoint ${commit.message}`}
        >
          <HistoryIcon className='size-3.5' />
          <span className='hidden @sm:inline'>Restore</span>
        </Button>
      )}
      <span className='text-muted-foreground hidden w-12 shrink-0 text-end text-xs tabular-nums @sm:inline'>
        {timeLabelOf(commit.minutesAgo)}
      </span>
    </div>
  );
}

const STRATEGIES: Segment<Strategy>[] = [
  { value: 'current', label: 'Now' },
  { value: 'merge', label: 'Merge' },
  { value: 'rebase', label: 'Rebase' },
  { value: 'squash', label: 'Squash' },
];

const STRATEGY_VERB: Record<Strategy, string> = {
  current: '',
  merge: 'merge',
  rebase: 'rebase',
  squash: 'squash',
};

function applyLabelsOf(strategy: Strategy): Record<MorphState, string> {
  const verb = STRATEGY_VERB[strategy];
  return {
    idle: `Apply ${verb}`,
    busy: 'Applying',
    done: 'Applied',
  };
}

function previewLineOf(strategy: Strategy, featureCount: number) {
  const commits = countOf(featureCount, 'commit');
  if (strategy === 'merge') {
    return `A merge commit joins ${commits} of coder/flat-fee to main`;
  }
  if (strategy === 'rebase') {
    return `${commits} move onto the tip of main, one after the other`;
  }
  if (strategy === 'squash') {
    return `${commits} fold into one commit on main`;
  }
  return 'Pick a strategy to preview it';
}

const BASE_HISTORY: GraphCommit[] = [
  {
    id: 'm1',
    message: 'Set up the billing module',
    lane: 0,
    parents: [],
    minutesAgo: 180,
    author: 'Dana Reyes',
  },
  {
    id: 'm2',
    message: 'Add tiered pallet rates',
    lane: 0,
    parents: ['m1'],
    minutesAgo: 95,
    author: 'Dana Reyes',
  },
  {
    id: 'c1',
    message: 'Add the flat fee constant',
    lane: 1,
    parents: ['m2'],
    minutesAgo: 42,
    agent: CODER,
    modelBrand: 'claude',
    modelName: 'Claude Sonnet',
  },
  {
    id: 'm3',
    message: 'Bill shipping by pallet count',
    lane: 0,
    parents: ['m2'],
    minutesAgo: 30,
    author: 'Tomás Ferreira',
  },
  {
    id: 'c2',
    message: 'Bill bulk orders at the flat fee',
    lane: 1,
    parents: ['c1'],
    minutesAgo: 21,
    agent: CODER,
    modelBrand: 'claude',
    modelName: 'Claude Sonnet',
    isCheckpoint: true,
  },
  {
    id: 'w1',
    message: 'Draft the customer notice',
    lane: 2,
    parents: ['m3'],
    minutesAgo: 14,
    agent: WRITER,
    modelBrand: 'openai',
    modelName: 'GPT mini',
  },
  {
    id: 'c3',
    message: 'Cover the flat fee with tests',
    lane: 1,
    parents: ['c2'],
    minutesAgo: 8,
    agent: CODER,
    modelBrand: 'claude',
    modelName: 'Claude Sonnet',
  },
  {
    id: 'w2',
    message: 'Add the announcement date',
    lane: 2,
    parents: ['w1'],
    minutesAgo: 4,
    agent: WRITER,
    modelBrand: 'openai',
    modelName: 'GPT mini',
  },
];

const LIVE_COMMIT: GraphCommit = {
  id: 'c4',
  message: 'Rename tiers to pallet tiers',
  lane: 1,
  parents: ['c3'],
  minutesAgo: 0,
  agent: CODER,
  modelBrand: 'claude',
  modelName: 'Claude Sonnet',
};

const SCRIPT: RunScriptStep[] = [
  { after: 2600, event: { type: 'run.started' } },
  {
    after: 0,
    event: {
      type: 'call.started',
      call: {
        id: LIVE_COMMIT.id,
        tool: 'git_commit',
        label: LIVE_COMMIT.message,
        status: 'done',
      },
    },
  },
  { after: 0, event: { type: 'run.finished', status: 'done' } },
];

const INITIAL_RUN = emptyRun({ id: 'branch-graph', title: 'coder/flat-fee' });

function hasLiveCommit(run: RunSnapshot) {
  return run.calls.some((call) => call.id === LIVE_COMMIT.id);
}

function historyWithLive(history: GraphCommit[], run: RunSnapshot) {
  const isLive = hasLiveCommit(run);
  if (!isLive) {
    return history;
  }
  return [...history, LIVE_COMMIT];
}

function laterCommitsOf(history: GraphCommit[], checkpointId: string) {
  const feature = featureCommitsOf(history);
  const checkpoint = feature.find((commit) => commit.id === checkpointId);
  if (!checkpoint) {
    return [];
  }
  return feature.filter((commit) => commit.minutesAgo < checkpoint.minutesAgo);
}

const APPLYING_MS = 700;

export default function Review07() {
  const [ownHistory, setOwnHistory] = useState<GraphCommit[] | null>(null);
  const [strategy, setStrategy] = useState<Strategy>('current');
  const [applyState, setApplyState] = useState<MorphState>('idle');
  const [restoreId, setRestoreId] = useState<string | null>(null);
  const [isIntegrated, setIsIntegrated] = useState(false);
  const [notice, setNotice] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(rootRef, { amount: 0.3 });
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const layoutTransition = slowSpringOf(shouldReduceMotion);
  const { schedule, clearAll } = useTimeouts();
  const isFrozen = ownHistory !== null;
  const isScriptActive = isInView && !isFrozen;
  const { snapshot, restart } = useRunScript(SCRIPT, {
    initial: INITIAL_RUN,
    isActive: isScriptActive,
  });
  const liveHistory = historyWithLive(BASE_HISTORY, snapshot);
  const history = ownHistory ?? liveHistory;
  const canReplay = isFrozen;
  const restoreTarget = history.find((commit) => commit.id === restoreId);
  const view = viewOf(history, strategy);
  const tips = tipsOf(view.nodes);
  const featureCount = featureCommitsOf(history).length;
  const isPreviewing = strategy !== 'current';
  const canIntegrate = featureCount > 0;
  const showsStrategies = canIntegrate && !isIntegrated;
  const canRestore = !isPreviewing && !isIntegrated;
  const laterCommits = laterCommitsOf(history, restoreId ?? '');
  const previewLine = previewLineOf(strategy, featureCount);
  const graphHeight = view.nodes.length * ROW_HEIGHT;
  const graphWidth = graphWidthOf();

  function changeStrategy(next: Strategy) {
    setStrategy(next);
    setRestoreId(null);
    setApplyState('idle');
    const line = previewLineOf(next, featureCount);
    setNotice(line);
  }

  function apply() {
    if (!isPreviewing) {
      return;
    }
    setApplyState('busy');
    schedule(() => {
      const applied = appliedHistoryOf(history, strategy);
      setOwnHistory(applied);
      setApplyState('done');
      setIsIntegrated(true);
      setStrategy('current');
      setNotice(
        `Applied the ${STRATEGY_VERB[strategy]}: coder/flat-fee is in main`
      );
    }, APPLYING_MS);
  }

  function askRestore(commitId: string) {
    setRestoreId(commitId);
  }

  function confirmRestore() {
    if (!restoreId) {
      return;
    }
    const laterIds = laterCommits.map((commit) => commit.id);
    const kept = history.filter((commit) => !laterIds.includes(commit.id));
    setOwnHistory(kept);
    setRestoreId(null);
    const moved = countOf(laterIds.length, 'commit');
    setNotice(`Restored coder/flat-fee. ${moved} kept on backup/flat-fee`);
  }

  function replay() {
    clearAll();
    setOwnHistory(null);
    setStrategy('current');
    setApplyState('idle');
    setRestoreId(null);
    setIsIntegrated(false);
    setNotice('');
    restart();
  }

  useKeptHeight(rootRef);

  return (
    <div
      ref={rootRef}
      className='bg-card hairline-ring ring-border @container flex w-full max-w-[44rem] flex-col gap-3 rounded-xl p-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <header className='flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-1'>
        <span className='flex items-center gap-2 text-[13px] font-medium'>
          <GitBranchIcon className='text-muted-foreground size-4' />
          coder/flat-fee into main
        </span>
        <AnimatePresence initial={false}>
          {showsStrategies && (
            <motion.span
              key='strategies'
              className='flex'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Segments
                value={strategy}
                segments={STRATEGIES}
                onValueChange={changeStrategy}
                label='Preview a strategy'
                className='w-64 max-w-full'
              />
            </motion.span>
          )}
        </AnimatePresence>
      </header>

      <div className='relative' style={{ paddingInlineStart: graphWidth }}>
        <BranchGraph view={view} />
        <ul
          aria-label='Commits'
          className='flex flex-col'
          style={{ minHeight: graphHeight }}
        >
          <AnimatePresence initial={false}>
            {view.nodes.map((node) => {
              const tipBranch = tipBranchOf(tips, node);
              return (
                <motion.li
                  key={node.commit.id}
                  layout='position'
                  className='overflow-hidden ps-2'
                  {...rowPresence}
                  transition={{
                    ...rowPresence.transition,
                    layout: layoutTransition,
                  }}
                >
                  <CommitRow
                    node={node}
                    tipBranch={tipBranch}
                    canRestore={canRestore}
                    onRestore={askRestore}
                  />
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      </div>

      <AnimatedSize>
        {restoreTarget && (
          <div className='bg-warning/10 flex flex-col gap-2 rounded-lg p-3 @md:flex-row @md:items-center'>
            <p className='text-warning-foreground min-w-0 flex-1 text-xs leading-5'>
              Restore coder/flat-fee to &ldquo;{restoreTarget.message}&rdquo;?{' '}
              {countOf(laterCommits.length, 'later commit')} move to
              backup/flat-fee.
            </p>
            <span className='flex shrink-0 items-center gap-2'>
              <Button
                type='button'
                size='sm'
                variant='outline'
                onClick={confirmRestore}
              >
                <HistoryIcon />
                Restore
              </Button>
              <Button
                type='button'
                size='sm'
                variant='ghost'
                onClick={() => setRestoreId(null)}
              >
                Cancel
              </Button>
            </span>
          </div>
        )}
        {!restoreTarget && (
          <div className='flex flex-wrap items-center gap-x-3 gap-y-2 px-1'>
            <p className='text-muted-foreground min-w-0 flex-1 text-xs'>
              {isIntegrated && 'coder/flat-fee is in main'}
              {!isIntegrated && previewLine}
            </p>
            <ReplayButton
              isShown={canReplay}
              onReplay={replay}
              label='Start over'
            />
            {isPreviewing && (
              <MorphButton
                type='button'
                size='sm'
                state={applyState}
                labels={applyLabelsOf(strategy)}
                onClick={apply}
              />
            )}
          </div>
        )}
      </AnimatedSize>
      <LiveRegion message={notice} />
    </div>
  );
}

function tipBranchOf(tips: Map<number, string>, node: GraphNode) {
  const tipId = tips.get(node.lane);
  const isTip = tipId === node.commit.id;
  if (!isTip) {
    return null;
  }
  return laneOf(node.lane).branch;
}
