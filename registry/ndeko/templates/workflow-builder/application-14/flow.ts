import {
  isProductStep,
  type BranchOutput,
  type BranchStep,
  type InsertAt,
  type Step,
  type Workflow,
} from './model';

/** A step with its place in the flow: its rank when the flow is read from top to bottom, the outputs of a branch left to right. */
export type Placed = {
  step: Step;
  position: number;
  /** The label of the nearest output of a branch that holds the step. */
  branchLabel: string | null;
};

type Hold = {
  list: Step[];
  index: number;
};

function visit(steps: Step[], branchLabel: string | null, into: Placed[]) {
  for (const step of steps) {
    const position = into.length + 1;
    into.push({ step, position, branchLabel });
    if (step.kind !== 'branch') {
      continue;
    }
    for (const output of step.outputs) {
      visit(output.steps, output.label, into);
    }
  }
}

export function walkOf(workflow: Workflow) {
  const placed: Placed[] = [];
  visit(workflow.steps, null, placed);
  return placed;
}

export function withInside(step: Step) {
  const placed: Placed[] = [];
  visit([step], null, placed);
  return placed.map((entry) => entry.step);
}

function trailIn(list: Step[], id: string): Hold[] | null {
  for (const [index, step] of list.entries()) {
    if (step.id === id) {
      return [{ list, index }];
    }
    if (step.kind !== 'branch') {
      continue;
    }
    for (const output of step.outputs) {
      const inner = trailIn(output.steps, id);
      if (inner) {
        return [{ list, index }, ...inner];
      }
    }
  }
  return null;
}

/** The lists that hold a step, from the flow itself down to the list the step sits in. */
function trailOf(workflow: Workflow, id: string) {
  return trailIn(workflow.steps, id);
}

export function stepOf(workflow: Workflow, id: string | null) {
  if (id === null) {
    return undefined;
  }
  const placed = walkOf(workflow);
  const found = placed.find((entry) => entry.step.id === id);
  return found?.step;
}

function branchOf(workflow: Workflow, id: string) {
  const step = stepOf(workflow, id);
  if (step?.kind !== 'branch') {
    return undefined;
  }
  return step;
}

/** The output of a branch whose label reads like `label`, whatever its case. */
export function outputNamed(branch: BranchStep, label: string) {
  const wanted = label.trim().toLowerCase();
  return branch.outputs.find((output) => {
    const own = output.label.trim().toLowerCase();
    return own === wanted;
  });
}

/** What runs once a step is over: the next one of its list, or the one after the branch that holds it. */
function afterOf(trail: Hold[]) {
  for (let depth = trail.length - 1; depth >= 0; depth -= 1) {
    const hold = trail[depth];
    const next = hold.list[hold.index + 1];
    if (next) {
      return next;
    }
  }
  return null;
}

export function successorOf(workflow: Workflow, id: string) {
  const trail = trailOf(workflow, id);
  if (!trail) {
    return null;
  }
  return afterOf(trail);
}

/** What runs once the whole list that holds a step is over: the step where its branch joins, if it sits in one. */
export function joinAfter(workflow: Workflow, id: string) {
  const trail = trailOf(workflow, id);
  if (!trail) {
    return null;
  }
  const outer = trail.slice(0, -1);
  return afterOf(outer);
}

/** An empty output hands over at once to the step where the outputs join. */
export function firstOf(
  workflow: Workflow,
  branch: BranchStep,
  output: BranchOutput
) {
  const first = output.steps[0];
  if (first) {
    return first;
  }
  return successorOf(workflow, branch.id);
}

/** The steps after `id` in its own list, with all they hold. They are what a denied approval leaves out. */
export function restAfter(workflow: Workflow, id: string) {
  const trail = trailOf(workflow, id);
  const hold = trail?.at(-1);
  if (!hold) {
    return [];
  }
  const rest = hold.list.slice(hold.index + 1);
  return rest.flatMap(withInside);
}

/**
 * Every step that has run when `id` starts: what comes before it in each list that holds it. The
 * other outputs of its own branch are left out, since they never run in the same pass.
 */
export function upstreamOf(workflow: Workflow, id: string) {
  const trail = trailOf(workflow, id);
  if (!trail) {
    return [];
  }
  const ids = new Set<string>();
  for (const hold of trail) {
    const earlier = hold.list.slice(0, hold.index);
    const steps = earlier.flatMap(withInside);
    for (const step of steps) {
      ids.add(step.id);
    }
  }
  const placed = walkOf(workflow);
  return placed.filter((entry) => ids.has(entry.step.id));
}

export function previousOf(workflow: Workflow, id: string) {
  const placed = walkOf(workflow);
  const index = placed.findIndex((entry) => entry.step.id === id);
  if (index <= 0) {
    return null;
  }
  return placed[index - 1].step;
}

export function countsOf(workflow: Workflow) {
  const placed = walkOf(workflow);
  let branches = 0;
  for (const entry of placed) {
    if (entry.step.kind === 'branch') {
      branches += entry.step.outputs.length;
    }
  }
  return { steps: placed.length, branches };
}

export function agentCountOf(workflow: Workflow) {
  const placed = walkOf(workflow);
  const agents = placed.filter((entry) => entry.step.kind === 'agent');
  return agents.length;
}

export function nodePressKeyOf(stepId: string) {
  return `node-${stepId}`;
}

/** A step has one way out, a branch one for each output: that is enough to name an edge. */
export function edgeIdOf(fromId: string, outputId: string | null) {
  if (outputId === null) {
    return fromId;
  }
  return `${fromId}:${outputId}`;
}

/** The label each output of a branch carries on its edge, by the id of that edge. */
export function outputLabelsOf(workflow: Workflow) {
  const labels: Record<string, string> = {};
  for (const { step } of walkOf(workflow)) {
    if (step.kind !== 'branch') {
      continue;
    }
    for (const output of step.outputs) {
      const edgeId = edgeIdOf(step.id, output.id);
      labels[edgeId] = output.label;
    }
  }
  return labels;
}

type KeyPart = string | number | KeyPart[];

function shapeOfStep(step: Step): KeyPart[] {
  if (step.kind !== 'branch') {
    return [step.id, step.kind];
  }
  const outputs = step.outputs.map(shapeOfOutput);
  return [step.id, step.kind, outputs];
}

function shapeOfOutput(output: BranchOutput): KeyPart[] {
  const steps = output.steps.map(shapeOfStep);
  return [output.id, steps];
}

/** What the layout reads: the ids, the kinds, the outputs of each branch and their order. Never a name or a setting. */
export function structureKeyOf(workflow: Workflow) {
  const steps = workflow.steps.map(shapeOfStep);
  return JSON.stringify(steps);
}

function pictureOf(step: Step): KeyPart[] {
  if (step.kind === 'agent') {
    return [step.seed, step.series];
  }
  if (isProductStep(step)) {
    return [step.tool.toolId];
  }
  return [];
}

function faceOfStep(step: Step): KeyPart[] {
  const picture = pictureOf(step);
  const face: KeyPart[] = [step.id, step.kind, step.name, picture];
  if (step.kind === 'branch') {
    const outputs = step.outputs.map(faceOfOutput);
    face.push(outputs);
  }
  return face;
}

function faceOfOutput(output: BranchOutput): KeyPart[] {
  const steps = output.steps.map(faceOfStep);
  return [output.id, output.label, steps];
}

/**
 * What the canvas shows: the structure, the names, the pictures and the labels of the outputs.
 * Instructions and the other settings are not in it, so typing them leaves the canvas as it is.
 */
export function faceKeyOf(workflow: Workflow) {
  const steps = workflow.steps.map(faceOfStep);
  return JSON.stringify([workflow.name, steps]);
}

const AT_THE_END = 'at the end of the flow';

/** Where a new step would go, in words that follow "Add a step": after Track the parcel, first in Refund. */
export function placementOf(workflow: Workflow, at: InsertAt) {
  if (at.at === 'end') {
    return AT_THE_END;
  }
  if (at.at === 'first') {
    const branch = branchOf(workflow, at.branchId);
    const output = branch?.outputs.find((entry) => entry.id === at.outputId);
    const label = output?.label ?? 'this output';
    return `first in ${label}`;
  }
  const step = stepOf(workflow, at.stepId);
  if (!step) {
    return AT_THE_END;
  }
  if (step.kind === 'branch') {
    return `where the outputs of ${step.name} join`;
  }
  return `after ${step.name}`;
}
