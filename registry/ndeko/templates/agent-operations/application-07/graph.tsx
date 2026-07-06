'use client';

import type { CSSProperties } from 'react';

import type { RunSnapshot, ToolCall } from '@/registry/ndeko/lib/agent-run';
import {
  CircleCheckIcon,
  CircleXIcon,
  HandIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { countOf } from '@/registry/ndeko/lib/words';

import { AGENT_STATUS_WORD, AgentTile, ToolTile } from './agent-parts';
import {
  AGENT_ORDER,
  AGENT_PLACE,
  BUS_Y,
  TOOL_META,
  TOOL_OWNER,
  TOOL_PLACE,
  toolMetaOf,
  type AgentId,
  type NodePlace,
  type ToolId,
} from './data';
import { callsOfAgent } from './model';
import { Panel } from './panel';

type Axis = 'vertical' | 'horizontal';

type EdgeSpec = {
  axis: Axis;
  style: CSSProperties;
};

const LEAD: AgentId = 'coordinator';

const WORKERS = AGENT_ORDER.filter((id) => id !== LEAD);

const LEFTMOST = AGENT_PLACE[WORKERS[0]].x;

const RIGHTMOST = AGENT_PLACE[WORKERS[WORKERS.length - 1]].x;

function percent(value: number) {
  return `${value}%`;
}

function verticalEdge(x: number, from: number, to: number): EdgeSpec {
  return {
    axis: 'vertical',
    style: { left: percent(x), top: percent(from), height: percent(to - from) },
  };
}

function horizontalEdge(y: number, from: number, to: number): EdgeSpec {
  return {
    axis: 'horizontal',
    style: { top: percent(y), left: percent(from), width: percent(to - from) },
  };
}

const LEAD_PLACE = AGENT_PLACE[LEAD];

const SPINE = verticalEdge(LEAD_PLACE.x, LEAD_PLACE.y, BUS_Y);

const BUS = horizontalEdge(BUS_Y, LEFTMOST, RIGHTMOST);

const DROPS = WORKERS.map((id) => {
  const place = AGENT_PLACE[id];
  return verticalEdge(place.x, BUS_Y, place.y);
});

function branchOf(toolId: ToolId): EdgeSpec {
  const from = AGENT_PLACE[TOOL_OWNER[toolId]];
  const to = TOOL_PLACE[toolId];
  if (from.x === to.x) {
    return verticalEdge(from.x, from.y, to.y);
  }
  return horizontalEdge(from.y, from.x, to.x);
}

const EDGE_AXIS: Record<Axis, string> = {
  vertical: 'w-px origin-top -translate-x-1/2',
  horizontal: 'h-px origin-left -translate-y-1/2',
};

const EDGE_HIDDEN: Record<Axis, string> = {
  vertical: 'scale-y-0',
  horizontal: 'scale-x-0',
};

function edgeScaleOf(axis: Axis, isShown: boolean) {
  if (isShown) {
    return 'scale-100';
  }
  return EDGE_HIDDEN[axis];
}

function edgeToneOf(isActive: boolean) {
  if (isActive) {
    return 'bg-foreground/35';
  }
  return 'bg-border';
}

type EdgeProps = {
  spec: EdgeSpec;
  isShown: boolean;
  isActive?: boolean;
};

function Edge({ spec, isShown, isActive = false }: EdgeProps) {
  return (
    <span
      aria-hidden='true'
      style={spec.style}
      className={cn(
        'absolute transition-[scale,background-color] duration-500 ease-(--ease-out-strong)',
        EDGE_AXIS[spec.axis],
        edgeScaleOf(spec.axis, isShown),
        edgeToneOf(isActive)
      )}
    />
  );
}

function isLiveCall(call: ToolCall) {
  return call.status === 'running' || call.status === 'waiting';
}

function callsOfTool(run: RunSnapshot, toolId: ToolId) {
  return run.calls.filter((call) => call.tool === toolId);
}

/** Calls to the same tool that start together leave one after the other, not on top of each other. */
function orderOf(run: RunSnapshot, call: ToolCall, toolId: ToolId) {
  const sameTool = callsOfTool(run, toolId);
  return sameTool.findIndex((candidate) => candidate.id === call.id);
}

type DotStyle = CSSProperties & { '--dx': string; '--dy': string };

type DotWay = 'out' | 'back';

const DOT =
  'bg-primary pointer-events-none absolute -ml-0.75 -mt-0.75 size-1.5 rounded-full transition-[translate] duration-700 ease-linear';

const DOT_WAY: Record<DotWay, string> = {
  out: '[translate:var(--dx)_var(--dy)] starting:[translate:0_0]',
  back: '[translate:0_0] starting:[translate:var(--dx)_var(--dy)]',
};

function dotStyleOf(toolId: ToolId, order: number): DotStyle {
  const from = AGENT_PLACE[TOOL_OWNER[toolId]];
  const to = TOOL_PLACE[toolId];
  const delay = `${order * 120}ms`;
  return {
    left: percent(from.x),
    top: percent(from.y),
    '--dx': `${to.x - from.x}cqw`,
    '--dy': `${to.y - from.y}cqh`,
    transitionDelay: delay,
  };
}

type CallDotProps = {
  toolId: ToolId;
  order: number;
  way: DotWay;
};

/** A dot goes out along the edge when a call starts and comes back when it ends. Both stop under a node, so nothing is left to clean. */
function CallDot({ toolId, order, way }: CallDotProps) {
  return (
    <span
      aria-hidden='true'
      style={dotStyleOf(toolId, order)}
      className={cn(DOT, DOT_WAY[way])}
    />
  );
}

function StatusMark({ status }: { status: string }) {
  const corner = 'bg-card absolute -end-1 -bottom-1 rounded-full';
  if (status === 'done') {
    return (
      <span className={corner}>
        <CircleCheckIcon className='text-success-foreground size-3.5' />
      </span>
    );
  }
  if (status === 'waiting') {
    return (
      <span className={corner}>
        <HandIcon className='text-warning-foreground size-3.5' />
      </span>
    );
  }
  if (status === 'failed') {
    return (
      <span className={corner}>
        <CircleXIcon className='text-destructive-ink size-3.5' />
      </span>
    );
  }
  return null;
}

function ringOf(status: string) {
  if (status === 'running') {
    return 'ring-info/40 ring-2';
  }
  if (status === 'waiting') {
    return 'ring-warning/60 ring-2';
  }
  return undefined;
}

function dimOf(isDimmed: boolean) {
  if (isDimmed) {
    return 'opacity-40';
  }
  return undefined;
}

function pickedRingOf(isPicked: boolean) {
  if (isPicked) {
    return 'ring-primary/50 ring-2';
  }
  return undefined;
}

const NODE =
  'absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 rounded-lg outline-none transition-opacity duration-200';

function placeStyleOf(place: NodePlace): CSSProperties {
  return { left: percent(place.x), top: percent(place.y) };
}

type AgentNodeProps = {
  id: AgentId;
  run: RunSnapshot;
  focusAgentId: string | null;
  onFocusAgent: (id: string) => void;
};

function AgentNode({ id, run, focusAgentId, onFocusAgent }: AgentNodeProps) {
  const agent = run.agents.find((candidate) => candidate.id === id);
  if (!agent) {
    return null;
  }
  const isPicked = focusAgentId === id;
  const hasPick = focusAgentId !== null;
  const isOtherPicked = hasPick && !isPicked;
  const isIdleRun = run.status === 'idle';
  const isDimmed = isOtherPicked || isIdleRun;
  const calls = countOf(callsOfAgent(run, id).length, 'call');
  const word = AGENT_STATUS_WORD[agent.status];

  function pick() {
    onFocusAgent(id);
  }

  return (
    <button
      type='button'
      aria-pressed={isPicked}
      aria-label={`${agent.name}, ${word}, ${calls}`}
      onClick={pick}
      style={placeStyleOf(AGENT_PLACE[id])}
      className={cn(
        NODE,
        'focus-visible:ring-ring/25 cursor-pointer focus-visible:ring-[3px]',
        dimOf(isDimmed)
      )}
    >
      <span className='relative'>
        <AgentTile
          agent={agent}
          className={cn(
            'transition-shadow duration-200',
            ringOf(agent.status),
            pickedRingOf(isPicked)
          )}
        />
        <StatusMark status={agent.status} />
      </span>
      <span className='bg-card rounded px-1 text-xs font-medium'>
        {agent.name}
      </span>
    </button>
  );
}

type ToolNodeProps = {
  toolId: ToolId;
  isDimmed: boolean;
};

function ToolNode({ toolId, isDimmed }: ToolNodeProps) {
  const tool = toolMetaOf(toolId);

  return (
    <div
      style={placeStyleOf(TOOL_PLACE[toolId])}
      className={cn(
        NODE,
        'transition-[opacity,scale] duration-300 starting:scale-90 starting:opacity-0',
        dimOf(isDimmed)
      )}
    >
      <ToolTile toolId={toolId} />
      <span className='bg-card text-muted-foreground rounded px-1 text-xs'>
        {tool.name}
      </span>
    </div>
  );
}

type GraphProps = {
  run: RunSnapshot;
  focusAgentId: string | null;
  onFocusAgent: (id: string) => void;
  className?: string;
};

/**
 * The agents and the tools they call, placed by shares of the stage, so nothing is measured and the
 * graph follows the width of its panel. An edge draws itself when it is first used.
 */
export function Graph({
  run,
  focusAgentId,
  onFocusAgent,
  className,
}: GraphProps) {
  const hasStarted = run.status !== 'idle';
  const liveCount = run.calls.filter(isLiveCall).length;
  const total = countOf(run.calls.length, 'call');

  return (
    <Panel
      panel='graph'
      title='Live graph'
      className={className}
      meta={
        <span className='text-muted-foreground text-xs tabular-nums'>
          {total}, {liveCount} live
        </span>
      }
    >
      <div className='[container-type:size] relative h-80'>
        <Edge spec={SPINE} isShown={hasStarted} />
        <Edge spec={BUS} isShown={hasStarted} />
        {DROPS.map((spec, index) => (
          <Edge key={WORKERS[index]} spec={spec} isShown={hasStarted} />
        ))}
        {TOOL_META.map((tool) => {
          const calls = callsOfTool(run, tool.id);
          const isUsed = calls.length > 0;
          const isLive = calls.some(isLiveCall);
          return (
            <Edge
              key={tool.id}
              spec={branchOf(tool.id)}
              isShown={isUsed}
              isActive={isLive}
            />
          );
        })}
        {run.calls.map((call) => {
          const toolId = toolMetaOf(call.tool).id;
          const order = orderOf(run, call, toolId);
          const isLive = isLiveCall(call);
          const isDone = call.status === 'done';
          return (
            <span key={call.id}>
              {isLive && <CallDot toolId={toolId} order={order} way='out' />}
              {isDone && <CallDot toolId={toolId} order={order} way='back' />}
            </span>
          );
        })}
        {AGENT_ORDER.map((id) => (
          <AgentNode
            key={id}
            id={id}
            run={run}
            focusAgentId={focusAgentId}
            onFocusAgent={onFocusAgent}
          />
        ))}
        {TOOL_META.map((tool) => {
          const isUsed = callsOfTool(run, tool.id).length > 0;
          if (!isUsed) {
            return null;
          }
          const owner = TOOL_OWNER[tool.id];
          const isOtherPicked = focusAgentId !== null && focusAgentId !== owner;
          return (
            <ToolNode key={tool.id} toolId={tool.id} isDimmed={isOtherPicked} />
          );
        })}
      </div>
      <p className='text-muted-foreground text-xs leading-5'>
        A dot goes out along an edge for each call and comes back with its
        result. Pick an agent to follow it on every panel.
      </p>
    </Panel>
  );
}
