import {
  FIELDS_OF,
  OUTPUT_WORD,
  OUTPUTS_OF,
  type Connection,
  type FieldId,
  type OutputId,
  type Step,
} from './data';

export type Graph = {
  steps: Step[];
  connections: Connection[];
};

export function stepOf(steps: Step[], id: string | null) {
  if (id === null) {
    return undefined;
  }
  return steps.find((step) => step.id === id);
}

export function targetOf(
  connections: Connection[],
  from: string,
  output: OutputId
) {
  const link = connections.find(
    (candidate) => candidate.from === from && candidate.output === output
  );
  return link?.to ?? null;
}

function leadsTo(connections: Connection[], start: string, goal: string) {
  const seen = new Set<string>();
  const pending = [start];
  let current = pending.pop();
  while (current !== undefined) {
    if (current === goal) {
      return true;
    }
    if (!seen.has(current)) {
      seen.add(current);
      const reached = current;
      const links = connections.filter((link) => link.from === reached);
      links.forEach((link) => pending.push(link.to));
    }
    current = pending.pop();
  }
  return false;
}

export type Refusal = 'missing' | 'self' | 'start' | 'loop';

/** Why a wire cannot go from one step to another, or null when it can. */
export function refusalOf(
  graph: Graph,
  from: string,
  to: string
): Refusal | null {
  const source = stepOf(graph.steps, from);
  const target = stepOf(graph.steps, to);
  if (!source || !target) {
    return 'missing';
  }
  if (from === to) {
    return 'self';
  }
  if (target.kind === 'trigger') {
    return 'start';
  }
  if (leadsTo(graph.connections, to, from)) {
    return 'loop';
  }
  return null;
}

export function canConnect(graph: Graph, from: string, to: string) {
  return refusalOf(graph, from, to) === null;
}

/** The steps a wire from `from` may land on. */
export function targetsOf(graph: Graph, from: string) {
  return graph.steps.filter((step) => canConnect(graph, from, step.id));
}

export type ProblemField = FieldId | 'name';

export type Problem = {
  stepId: string;
  line: string;
  /** The field to fill, when the problem is a missing value. */
  field?: ProblemField;
};

function isBlank(value: string | undefined) {
  const text = value ?? '';
  return text.trim() === '';
}

function fieldProblemsOf(step: Step): Problem[] {
  const problems: Problem[] = [];
  if (isBlank(step.name)) {
    problems.push({ stepId: step.id, line: 'Name the step', field: 'name' });
  }
  for (const spec of FIELDS_OF[step.kind]) {
    if (isBlank(step.values[spec.id])) {
      problems.push({
        stepId: step.id,
        line: spec.missingLine,
        field: spec.id,
      });
    }
  }
  return problems;
}

function inputProblemsOf(graph: Graph, step: Step): Problem[] {
  if (step.kind === 'trigger') {
    return [];
  }
  const isReached = graph.connections.some((link) => link.to === step.id);
  if (isReached) {
    return [];
  }
  return [{ stepId: step.id, line: 'Nothing leads to this step' }];
}

/** Both answers of a condition have to go somewhere. Any other step may end the flow. */
function outputProblemsOf(graph: Graph, step: Step): Problem[] {
  if (step.kind !== 'condition') {
    return [];
  }
  const open = OUTPUTS_OF.condition.filter(
    (output) => targetOf(graph.connections, step.id, output) === null
  );
  return open.map((output) => ({
    stepId: step.id,
    line: `${OUTPUT_WORD[output]} leads nowhere`,
  }));
}

export function problemsOf(graph: Graph) {
  const problems: Problem[] = [];
  for (const step of graph.steps) {
    problems.push(...fieldProblemsOf(step));
    problems.push(...inputProblemsOf(graph, step));
    problems.push(...outputProblemsOf(graph, step));
  }
  return problems;
}

export function problemsOfStep(problems: Problem[], stepId: string) {
  return problems.filter((problem) => problem.stepId === stepId);
}

export type OutputLine = {
  output: OutputId;
  word: string;
  target: Step | undefined;
};

/** Where each way out of a step leads, for the inspector and for screen readers. */
export function outputLinesOf(graph: Graph, step: Step): OutputLine[] {
  return OUTPUTS_OF[step.kind].map((output) => {
    const targetId = targetOf(graph.connections, step.id, output);
    return {
      output,
      word: OUTPUT_WORD[output],
      target: stepOf(graph.steps, targetId),
    };
  });
}

export type Move = 'forward' | 'back' | 'next' | 'previous';

function forwardOf(graph: Graph, id: string) {
  const step = stepOf(graph.steps, id);
  if (!step) {
    return null;
  }
  for (const output of OUTPUTS_OF[step.kind]) {
    const target = targetOf(graph.connections, id, output);
    if (target !== null) {
      return target;
    }
  }
  return null;
}

function backOf(graph: Graph, id: string) {
  const link = graph.connections.find((candidate) => candidate.to === id);
  return link?.from ?? null;
}

/** The steps a fork leads to, in the order of its outputs. */
function siblingsOf(graph: Graph, id: string) {
  const sourceId = backOf(graph, id);
  const source = stepOf(graph.steps, sourceId);
  if (!source) {
    return [];
  }
  const siblings: string[] = [];
  for (const output of OUTPUTS_OF[source.kind]) {
    const target = targetOf(graph.connections, source.id, output);
    if (target !== null && !siblings.includes(target)) {
      siblings.push(target);
    }
  }
  return siblings;
}

function siblingOf(graph: Graph, id: string, offset: number) {
  const siblings = siblingsOf(graph, id);
  const index = siblings.indexOf(id);
  if (index === -1) {
    return null;
  }
  return siblings[index + offset] ?? null;
}

/** The step an arrow key moves to: along a connection, or to the other branch of a fork. */
export function neighbourOf(graph: Graph, id: string, move: Move) {
  if (move === 'forward') {
    return forwardOf(graph, id);
  }
  if (move === 'back') {
    return backOf(graph, id);
  }
  if (move === 'next') {
    return siblingOf(graph, id, 1);
  }
  return siblingOf(graph, id, -1);
}
