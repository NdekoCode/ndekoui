'use client';

import { memo } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

import { ApprovalCard } from './approval-card';
import type { PaletteEntry } from './catalog';
import { nodePressKeyOf, placementOf, type Placed } from './flow';
import { InsertButton } from './insert-button';
import { NODE_HEIGHT, NODE_WIDTH, type Box, type InsertPoint } from './layout';
import type { InsertAt, Step, Workflow } from './model';
import { NodeCard } from './node-card';
import type { Decision, StepRun } from './run';
import type { Sample } from './samples';

function askingOf(step: Step, isWaiting: boolean) {
  if (step.kind !== 'approval' || !isWaiting) {
    return null;
  }
  return step;
}

/** The card of a step and what hangs from it take their size from the layout, so the two never disagree. */
type StepStyle = React.CSSProperties & {
  '--step-width': string;
  '--step-height': string;
};

/** The step that waits sits above the ones under it, so its card covers them and not the other way round. */
function layerOf(isWaiting: boolean) {
  if (isWaiting) {
    return 'z-10';
  }
  return 'z-0';
}

export type StepActions = {
  onSelect: (id: string, isFromKeyboard: boolean) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onInsert: (at: InsertAt, entry: PaletteEntry) => void;
  onDecide: (decision: Decision) => void;
};

type FlowStepProps = StepActions & {
  placed: Placed;
  total: number;
  box: Box;
  inserts: InsertPoint[];
  workflow: Workflow;
  /** The mark of this step in the run: a beat that touches another step leaves this one as it is. */
  stepRun: StepRun | undefined;
  sample: Sample;
  isSelected: boolean;
  isArrived: boolean;
  isRenaming: boolean;
  pressed: string | null;
  onReveal: (id: string) => void;
  onStartRename: (id: string) => void;
  onSettleRename: (id: string, name: string | null, isFromKey: boolean) => void;
};

/**
 * One step of the list, with what the keyboard reaches right after it: its card when it waits for
 * a person, then the points where a step can be added before the next one.
 */
export const FlowStep = memo(function FlowStep({
  placed,
  total,
  box,
  inserts,
  workflow,
  stepRun,
  sample,
  isSelected,
  isArrived,
  isRenaming,
  pressed,
  onSelect,
  onRemove,
  onDuplicate,
  onInsert,
  onDecide,
  onReveal,
  onStartRename,
  onSettleRename,
}: FlowStepProps) {
  const { step } = placed;
  const isWaiting = stepRun?.status === 'waiting';
  const asking = askingOf(step, isWaiting);
  const placeStyle: StepStyle = {
    translate: `${box.x}px ${box.y}px`,
    '--step-width': `${NODE_WIDTH}px`,
    '--step-height': `${NODE_HEIGHT}px`,
  };

  return (
    <li
      style={placeStyle}
      className={cn(
        'absolute top-0 left-0 transition-[translate] duration-300 ease-(--ease-out-strong)',
        layerOf(isWaiting)
      )}
    >
      <NodeCard
        step={step}
        position={placed.position}
        total={total}
        branchLabel={placed.branchLabel}
        stepRun={stepRun}
        isSelected={isSelected}
        isArrived={isArrived}
        isPressed={pressed === nodePressKeyOf(step.id)}
        isRenaming={isRenaming}
        onSelect={onSelect}
        onReveal={onReveal}
        onRemove={onRemove}
        onDuplicate={onDuplicate}
        onStartRename={onStartRename}
        onSettleRename={onSettleRename}
      />
      {asking && (
        <ApprovalCard
          step={asking}
          sample={sample}
          workflowName={workflow.name}
          pressed={pressed}
          onDecide={onDecide}
        />
      )}
      {inserts.map((insert) => (
        <InsertButton
          key={insert.id}
          x={insert.x - box.x}
          y={insert.y - box.y}
          placement={placementOf(workflow, insert.at)}
          onPick={(entry) => onInsert(insert.at, entry)}
        />
      ))}
    </li>
  );
});
