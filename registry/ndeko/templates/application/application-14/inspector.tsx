'use client';

import { useId } from 'react';

import { MousePointerClickIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/registry/ndeko/ui/tabs';

import { stepOf } from './flow';
import {
  AgentFields,
  ApprovalFields,
  LoopFields,
  ProductFields,
  WaitFields,
} from './inspector-fields';
import { BranchFields } from './inspector-outputs';
import { LastRunPanel } from './inspector-run';
import { VariablesPanel } from './inspector-variables';
import { isEscapeInside } from './keys';
import { isProductStep, KIND_WORD, type Step, type Workflow } from './model';
import { StepTile } from './node-tile';
import type { Run } from './run';
import type { BuilderAction, InspectorTab } from './session';
import { differsFromSaved } from './session-setup';

const TABS: InspectorTab[] = ['setup', 'variables', 'run'];

/** The panel is positioned: a word kept for screen readers inside it would widen the page otherwise. */
const PANEL = 'relative -mx-1 flex min-h-0 flex-col overflow-y-auto px-1 pb-1';

type SetupPanelProps = {
  step: Step;
  onAct: (action: BuilderAction) => void;
  onMintId: () => string;
};

/** Each kind of step has its own setup. Every change applies at once, and the flow reads as unsaved until it is saved. */
function SetupPanel({ step, onAct, onMintId }: SetupPanelProps) {
  const { id } = step;

  if (step.kind === 'agent') {
    return (
      <AgentFields
        step={step}
        onChange={(patch) => onAct({ type: 'agentChanged', id, patch })}
      />
    );
  }
  function addOutput() {
    const outputId = onMintId();
    onAct({ type: 'outputAdded', id, outputId });
  }

  if (step.kind === 'branch') {
    return (
      <BranchFields
        step={step}
        onAdd={addOutput}
        onRename={(outputId, label) =>
          onAct({ type: 'outputRenamed', id, outputId, label })
        }
        onRemove={(outputId) => onAct({ type: 'outputRemoved', id, outputId })}
      />
    );
  }
  if (step.kind === 'approval') {
    return (
      <ApprovalFields
        step={step}
        onChange={(patch) => onAct({ type: 'approvalChanged', id, patch })}
      />
    );
  }
  if (step.kind === 'wait') {
    return (
      <WaitFields
        step={step}
        onChange={(duration) => onAct({ type: 'waitChanged', id, duration })}
      />
    );
  }
  if (step.kind === 'loop') {
    return (
      <LoopFields
        step={step}
        onChange={(rounds) => onAct({ type: 'loopChanged', id, rounds })}
      />
    );
  }
  if (isProductStep(step)) {
    return (
      <ProductFields
        step={step}
        onPickAction={(actionId) =>
          onAct({ type: 'actionPicked', id, actionId })
        }
        onChangeField={(fieldId, value) =>
          onAct({ type: 'fieldChanged', id, fieldId, value })
        }
      />
    );
  }
  return null;
}

/** The dot beside Last run tells the step has something to show there. */
function hasRunMark(run: Run, step: Step) {
  const status = run.steps[step.id]?.status;
  return status !== undefined && status !== 'skipped';
}

type InspectorProps = {
  workflow: Workflow;
  savedWorkflow: Workflow;
  selectedId: string | null;
  tab: InspectorTab;
  run: Run;
  /** False off screen: a text that streams holds its place. */
  isActive: boolean;
  onAct: (action: BuilderAction) => void;
  onMintId: () => string;
  /** Escape gives the focus back to the step on the canvas. */
  onLeave: () => void;
  className?: string;
};

export function Inspector({
  workflow,
  savedWorkflow,
  selectedId,
  tab,
  run,
  isActive,
  onAct,
  onMintId,
  onLeave,
  className,
}: InspectorProps) {
  const headingId = useId();
  const step = stepOf(workflow, selectedId);

  function leaveOnEscape(event: React.KeyboardEvent<HTMLElement>) {
    if (isEscapeInside(event)) {
      onLeave();
    }
  }

  function changeTab(next: unknown) {
    const found = TABS.find((candidate) => candidate === next);
    if (found) {
      onAct({ type: 'tabPicked', tab: found });
    }
  }

  if (!step) {
    return (
      <section
        aria-labelledby={headingId}
        onKeyDown={leaveOnEscape}
        className={cn('flex min-h-0 flex-col', className)}
      >
        <div className='m-auto flex max-w-56 flex-col items-center gap-3 py-6 text-center'>
          <span
            aria-hidden='true'
            className='keycap-3d text-muted-foreground inline-flex size-9 items-center justify-center rounded-lg'
          >
            <MousePointerClickIcon className='size-4' />
          </span>
          <h2
            id={headingId}
            tabIndex={-1}
            data-inspector-heading
            className='text-sm font-medium outline-none'
          >
            No step selected
          </h2>
          <p className='text-muted-foreground text-[13px] leading-relaxed'>
            Pick a step on the canvas to set it up, see what it can read and
            what it did in the last run
          </p>
        </div>
      </section>
    );
  }

  const savedStep = stepOf(savedWorkflow, step.id);
  const canReset = differsFromSaved(step, savedStep);
  const showsRunMark = hasRunMark(run, step);

  return (
    <section
      aria-labelledby={headingId}
      onKeyDown={leaveOnEscape}
      className={cn('flex min-h-0 flex-col gap-3', className)}
    >
      <header className='flex min-h-9 shrink-0 items-center gap-2.5'>
        <StepTile step={step} />
        <div className='flex min-w-0 flex-1 flex-col leading-tight'>
          <span className='text-muted-foreground text-[11px]'>
            {KIND_WORD[step.kind]}
          </span>
          <h2
            id={headingId}
            tabIndex={-1}
            data-inspector-heading
            className='focus-visible:ring-ring/25 truncate rounded-sm text-sm font-medium outline-none focus-visible:ring-[3px]'
          >
            {step.name}
          </h2>
        </div>
        {canReset && (
          <Button
            type='button'
            variant='link'
            size='sm'
            aria-label={`Reset ${step.name} to its saved values`}
            onClick={() => onAct({ type: 'stepReset', id: step.id })}
            className='shrink-0 px-1 transition-opacity duration-200 starting:opacity-0'
          >
            Reset
          </Button>
        )}
      </header>
      <Tabs
        value={tab}
        onValueChange={changeTab}
        className='min-h-0 flex-1 gap-3'
      >
        <TabsList
          variant='segmented'
          aria-label='About this step'
          className='w-full shrink-0'
        >
          <TabsTab value='setup' className='flex-1'>
            Setup
          </TabsTab>
          <TabsTab value='variables' className='flex-1'>
            Variables
          </TabsTab>
          <TabsTab value='run' className='flex-1'>
            Last run
            {showsRunMark && (
              <span className='bg-primary size-1.5 rounded-full'>
                <span className='sr-only'>, has a result</span>
              </span>
            )}
          </TabsTab>
        </TabsList>
        <TabsPanel value='setup' className={PANEL}>
          <SetupPanel
            key={step.id}
            step={step}
            onAct={onAct}
            onMintId={onMintId}
          />
        </TabsPanel>
        <TabsPanel value='variables' className={PANEL}>
          <VariablesPanel workflow={workflow} step={step} />
        </TabsPanel>
        <TabsPanel value='run' className={PANEL}>
          <LastRunPanel step={step} run={run} isActive={isActive} />
        </TabsPanel>
      </Tabs>
    </section>
  );
}
