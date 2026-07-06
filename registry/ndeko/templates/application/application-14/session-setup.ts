import { changed, changedBranch } from './edits';
import { stepOf } from './flow';
import {
  BRANCH_MIN_OUTPUTS,
  isProductStep,
  type AgentSetup,
  type ApprovalSetup,
  type BranchOutput,
  type BranchStep,
  type LoopRounds,
  type Step,
  type WaitDuration,
} from './model';
import type { BuilderState } from './session';
import { edited } from './session-history';
import { actionOf, toolOf, valuesOf } from './tools';

export function agentChanged(
  state: BuilderState,
  id: string,
  patch: Partial<AgentSetup>
): BuilderState {
  const workflow = changed(state.workflow, id, (step) => {
    if (step.kind !== 'agent') {
      return step;
    }
    return { ...step, agent: { ...step.agent, ...patch } };
  });
  const fields = Object.keys(patch).join(' ');
  return edited(state, workflow, `agent ${id} ${fields}`);
}

export function approvalChanged(
  state: BuilderState,
  id: string,
  patch: Partial<ApprovalSetup>
): BuilderState {
  const workflow = changed(state.workflow, id, (step) => {
    if (step.kind !== 'approval') {
      return step;
    }
    return { ...step, approval: { ...step.approval, ...patch } };
  });
  return edited(state, workflow, null);
}

/** Another action has other fields: they start from what the action holds by default. */
export function actionPicked(
  state: BuilderState,
  id: string,
  actionId: string
): BuilderState {
  const workflow = changed(state.workflow, id, (step) => {
    if (!isProductStep(step)) {
      return step;
    }
    const tool = toolOf(step.tool.toolId);
    const action = actionOf(tool, actionId);
    const values = valuesOf(action);
    return { ...step, tool: { toolId: tool.id, actionId: action.id, values } };
  });
  return edited(state, workflow, null);
}

export function fieldChanged(
  state: BuilderState,
  id: string,
  fieldId: string,
  value: string
): BuilderState {
  const workflow = changed(state.workflow, id, (step) => {
    if (!isProductStep(step)) {
      return step;
    }
    const values = { ...step.tool.values, [fieldId]: value };
    return { ...step, tool: { ...step.tool, values } };
  });
  return edited(state, workflow, `field ${id} ${fieldId}`);
}

export function waitChanged(
  state: BuilderState,
  id: string,
  duration: WaitDuration
): BuilderState {
  const workflow = changed(state.workflow, id, (step) => {
    if (step.kind !== 'wait') {
      return step;
    }
    return { ...step, duration };
  });
  return edited(state, workflow, null);
}

export function loopChanged(
  state: BuilderState,
  id: string,
  rounds: LoopRounds
): BuilderState {
  const workflow = changed(state.workflow, id, (step) => {
    if (step.kind !== 'loop') {
      return step;
    }
    return { ...step, rounds };
  });
  return edited(state, workflow, null);
}

export function outputAdded(
  state: BuilderState,
  id: string,
  outputId: string
): BuilderState {
  const workflow = changedBranch(state.workflow, id, (branch) => {
    const rank = branch.outputs.length + 1;
    const output: BranchOutput = {
      id: outputId,
      label: `Output ${rank}`,
      steps: [],
    };
    return { ...branch, outputs: [...branch.outputs, output] };
  });
  const next = edited(state, workflow, null);
  return { ...next, spoken: 'Output added' };
}

function relabelled(output: BranchOutput, outputId: string, label: string) {
  if (output.id !== outputId) {
    return output;
  }
  return { ...output, label };
}

export function outputRenamed(
  state: BuilderState,
  id: string,
  outputId: string,
  label: string
): BuilderState {
  const workflow = changedBranch(state.workflow, id, (branch) => {
    const outputs = branch.outputs.map((output) =>
      relabelled(output, outputId, label)
    );
    return { ...branch, outputs };
  });
  return edited(state, workflow, `output ${id} ${outputId}`);
}

/** A branch keeps at least two outputs. The steps of the one that goes leave with it. */
export function outputRemoved(
  state: BuilderState,
  id: string,
  outputId: string
): BuilderState {
  const workflow = changedBranch(state.workflow, id, (branch) => {
    if (branch.outputs.length <= BRANCH_MIN_OUTPUTS) {
      return branch;
    }
    const outputs = branch.outputs.filter((output) => output.id !== outputId);
    return { ...branch, outputs };
  });
  const next = edited(state, workflow, null);
  return { ...next, spoken: 'Output removed' };
}

function savedLabelOf(output: BranchOutput, saved: BranchStep) {
  const match = saved.outputs.find((entry) => entry.id === output.id);
  if (!match) {
    return output;
  }
  return { ...output, label: match.label };
}

/**
 * The values of a step as they were saved. For a branch that means the labels of its outputs: the
 * steps it holds are other steps, with their own reset.
 */
function resetOf(step: Step, saved: Step): Step {
  if (step.kind !== saved.kind) {
    return step;
  }
  if (step.kind !== 'branch') {
    return saved;
  }
  if (saved.kind !== 'branch') {
    return step;
  }
  const outputs = step.outputs.map((output) => savedLabelOf(output, saved));
  return { ...step, name: saved.name, outputs };
}

function branchDiffers(step: BranchStep, saved: BranchStep) {
  if (step.name !== saved.name) {
    return true;
  }
  return step.outputs.some((output) => {
    const relabelledOutput = savedLabelOf(output, saved);
    return relabelledOutput.label !== output.label;
  });
}

/** Whether Reset has something to give back: the step was saved once and reads differently now. */
export function differsFromSaved(step: Step, saved: Step | undefined) {
  if (!saved || step === saved) {
    return false;
  }
  const areBranches = step.kind === 'branch' && saved.kind === 'branch';
  if (areBranches) {
    return branchDiffers(step, saved);
  }
  const now = JSON.stringify(step);
  const then = JSON.stringify(saved);
  return now !== then;
}

export function stepReset(state: BuilderState, id: string): BuilderState {
  const saved = stepOf(state.savedWorkflow, id);
  if (!saved) {
    return state;
  }
  const workflow = changed(state.workflow, id, (step) => resetOf(step, saved));
  const next = edited(state, workflow, null);
  return { ...next, spoken: `${saved.name} is back to its saved values` };
}
