import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import {
  GitBranchIcon,
  HourglassIcon,
  RepeatIcon,
  ShieldCheckIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';

import type { LogicKind } from './catalog';
import { isProductStep, type Step } from './model';
import { toolOf, type ToolMark } from './tools';

export type TileSize = 'md' | 'lg';

const KEYCAP_CLASS: Record<TileSize, string> = {
  md: 'size-5 rounded-[5px]',
  lg: 'size-7 rounded-md',
};

const GLYPH_CLASS: Record<TileSize, string> = {
  md: 'size-3',
  lg: 'size-4',
};

const LOGIC_ICON: Record<LogicKind, Icon> = {
  branch: GitBranchIcon,
  approval: ShieldCheckIcon,
  wait: HourglassIcon,
  loop: RepeatIcon,
};

type LogicTileProps = {
  logic: LogicKind;
  size?: TileSize;
};

/** A step of logic belongs to no product, so it wears a key cap with the icon of what it does. */
export function LogicTile({ logic, size = 'lg' }: LogicTileProps) {
  const Glyph = LOGIC_ICON[logic];

  return (
    <span
      aria-hidden='true'
      className={cn(
        'keycap-3d text-muted-foreground inline-flex shrink-0 items-center justify-center',
        KEYCAP_CLASS[size]
      )}
    >
      <Glyph className={GLYPH_CLASS[size]} />
    </span>
  );
}

type MarkTileProps = {
  mark: ToolMark;
  size?: TileSize;
};

export function MarkTile({ mark, size = 'lg' }: MarkTileProps) {
  if (mark.kind === 'brand') {
    return <BrandTile brand={mark.brand} size={size} />;
  }
  return <CompanyMark seed={mark.seed} size={size} />;
}

type StepTileProps = {
  step: Step;
  size?: TileSize;
};

/** An agent wears a picture in its series colour, a step of a product the mark of the product. */
export function StepTile({ step, size = 'lg' }: StepTileProps) {
  if (step.kind === 'agent') {
    const color = seriesColorOf(step.series);
    return <MeshTile seed={step.seed} color={color} size={size} />;
  }
  if (isProductStep(step)) {
    const tool = toolOf(step.tool.toolId);
    return <MarkTile mark={tool.mark} size={size} />;
  }
  return <LogicTile logic={step.kind} size={size} />;
}
