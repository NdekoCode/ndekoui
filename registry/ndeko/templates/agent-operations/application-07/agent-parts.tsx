'use client';

import { MotionNumber } from '@/components/core/motion-number';
import {
  seriesColorOf,
  type AgentStatus,
  type RunAgent,
} from '@/registry/ndeko/lib/agent-run';
import { BookIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { MeshTile, type MeshTileSize } from '@/registry/ndeko/ui/mesh-tile';

import { toolMetaOf } from './data';

export const AGENT_STATUS_WORD: Record<AgentStatus, string> = {
  idle: 'Idle',
  running: 'Running',
  waiting: 'Waiting on you',
  failed: 'Failed',
  done: 'Done',
};

export const AGENT_STATUS_WORDS = Object.values(AGENT_STATUS_WORD);

const DOT_TONE: Record<AgentStatus, string> = {
  idle: 'bg-muted-foreground/45',
  running: 'bg-info',
  waiting: 'bg-warning',
  failed: 'bg-destructive',
  done: 'bg-success',
};

type StatusDotProps = {
  status: AgentStatus;
  isPulsing?: boolean;
  className?: string;
};

/** A dot only breathes while its agent really runs, and the page lets a few of them do it at a time. */
export function StatusDot({
  status,
  isPulsing = false,
  className,
}: StatusDotProps) {
  const isLive = status === 'running' && isPulsing;

  return (
    <span
      aria-hidden='true'
      className={cn(
        'size-1.5 shrink-0 rounded-full transition-colors duration-200',
        DOT_TONE[status],
        isLive && 'animate-pulse',
        className
      )}
    />
  );
}

type AgentTileProps = {
  agent: Pick<RunAgent, 'name' | 'series'>;
  size?: MeshTileSize;
  className?: string;
};

export function AgentTile({ agent, size = 'lg', className }: AgentTileProps) {
  const color = seriesColorOf(agent.series);

  return (
    <MeshTile
      seed={agent.name}
      color={color}
      size={size}
      className={className}
    />
  );
}

type ToolTileProps = {
  toolId: string;
  className?: string;
};

/** A known tool wears its real mark. The ledger has none, so it wears a key cap with a book. */
export function ToolTile({ toolId, className }: ToolTileProps) {
  const tool = toolMetaOf(toolId);
  if (tool.brand) {
    return (
      <BrandTile
        brand={tool.brand}
        size='lg'
        title={tool.name}
        className={className}
      />
    );
  }

  return (
    <span
      title={tool.name}
      className={cn(
        'keycap-3d text-muted-foreground inline-flex size-7 shrink-0 items-center justify-center rounded-md',
        className
      )}
    >
      <BookIcon className='size-3.5' />
      <span className='sr-only'>{tool.name}</span>
    </span>
  );
}

const SMALL_COST: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
};

const LARGE_COST: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

/** Matches `formatCost`: three decimals under a dollar, two above. */
function costFormatOf(usd: number) {
  if (usd < 1) {
    return SMALL_COST;
  }
  return LARGE_COST;
}

type CostFigureProps = {
  usd: number;
  className?: string;
};

export function CostFigure({ usd, className }: CostFigureProps) {
  return (
    <MotionNumber
      value={usd}
      format={costFormatOf(usd)}
      className={cn('tabular-nums', className)}
    />
  );
}
