import type {
  BranchOutput,
  BranchStep,
  InsertAt,
  Step,
  Workflow,
} from './model';

type ListEdit = (list: Step[], index: number) => Step[];

/** Every list and step an edit does not touch keeps its identity, so only what changed is drawn again. */
function editedWhereHeld(steps: Step[], id: string, edit: ListEdit): Step[] {
  const index = steps.findIndex((step) => step.id === id);
  if (index >= 0) {
    return edit(steps, index);
  }
  let hasChanged = false;
  const next = steps.map((step) => {
    const edited = editedInside(step, id, edit);
    if (edited !== step) {
      hasChanged = true;
    }
    return edited;
  });
  if (!hasChanged) {
    return steps;
  }
  return next;
}

function editedInside(step: Step, id: string, edit: ListEdit): Step {
  if (step.kind !== 'branch') {
    return step;
  }
  let hasChanged = false;
  const outputs = step.outputs.map((output) => {
    const steps = editedWhereHeld(output.steps, id, edit);
    if (steps === output.steps) {
      return output;
    }
    hasChanged = true;
    return { ...output, steps };
  });
  if (!hasChanged) {
    return step;
  }
  return { ...step, outputs };
}

function withSteps(workflow: Workflow, steps: Step[]): Workflow {
  if (steps === workflow.steps) {
    return workflow;
  }
  return { ...workflow, steps };
}

export function changed(
  workflow: Workflow,
  id: string,
  change: (step: Step) => Step
) {
  const steps = editedWhereHeld(workflow.steps, id, (list, index) => {
    const next = change(list[index]);
    if (next === list[index]) {
      return list;
    }
    const copy = [...list];
    copy[index] = next;
    return copy;
  });
  return withSteps(workflow, steps);
}

export function removed(workflow: Workflow, id: string) {
  const steps = editedWhereHeld(workflow.steps, id, (list, index) => {
    const before = list.slice(0, index);
    const after = list.slice(index + 1);
    return [...before, ...after];
  });
  return withSteps(workflow, steps);
}

function insertedAfter(workflow: Workflow, stepId: string, step: Step) {
  const steps = editedWhereHeld(workflow.steps, stepId, (list, index) => {
    const before = list.slice(0, index + 1);
    const after = list.slice(index + 1);
    return [...before, step, ...after];
  });
  return withSteps(workflow, steps);
}

function withFirst(output: BranchOutput, outputId: string, step: Step) {
  if (output.id !== outputId) {
    return output;
  }
  return { ...output, steps: [step, ...output.steps] };
}

function insertedFirst(
  workflow: Workflow,
  branchId: string,
  outputId: string,
  step: Step
) {
  return changed(workflow, branchId, (branch) => {
    if (branch.kind !== 'branch') {
      return branch;
    }
    const hasOutput = branch.outputs.some((output) => output.id === outputId);
    if (!hasOutput) {
      return branch;
    }
    const outputs = branch.outputs.map((output) =>
      withFirst(output, outputId, step)
    );
    return { ...branch, outputs };
  });
}

export function inserted(workflow: Workflow, at: InsertAt, step: Step) {
  if (at.at === 'after') {
    return insertedAfter(workflow, at.stepId, step);
  }
  if (at.at === 'first') {
    return insertedFirst(workflow, at.branchId, at.outputId, step);
  }
  return withSteps(workflow, [...workflow.steps, step]);
}

/** Copies never share an id with what they come from: the copy takes the base, what it holds the base and a rank. */
type IdMint = { base: string; count: number };

function mintedId(mint: IdMint) {
  const rank = mint.count;
  mint.count += 1;
  if (rank === 0) {
    return mint.base;
  }
  return `${mint.base}-${rank}`;
}

function copiedOutput(output: BranchOutput, mint: IdMint): BranchOutput {
  const id = mintedId(mint);
  const steps = output.steps.map((step) => copiedStep(step, mint));
  return { ...output, id, steps };
}

function copiedStep(step: Step, mint: IdMint): Step {
  const id = mintedId(mint);
  if (step.kind === 'branch') {
    const outputs = step.outputs.map((output) => copiedOutput(output, mint));
    return { ...step, id, outputs };
  }
  if (step.kind === 'agent') {
    return { ...step, id, seed: id };
  }
  return { ...step, id };
}

export function copyOf(step: Step, idBase: string): Step {
  const mint: IdMint = { base: idBase, count: 0 };
  const copy = copiedStep(step, mint);
  return { ...copy, name: `${step.name} copy` };
}

export function changedBranch(
  workflow: Workflow,
  id: string,
  change: (branch: BranchStep) => BranchStep
) {
  return changed(workflow, id, (step) => {
    if (step.kind !== 'branch') {
      return step;
    }
    return change(step);
  });
}
