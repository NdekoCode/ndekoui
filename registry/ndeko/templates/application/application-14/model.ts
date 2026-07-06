import type { SeriesSlot } from '@/registry/ndeko/lib/agent-run';

export type ToolId =
  | 'gmail'
  | 'stripe'
  | 'linear'
  | 'notion'
  | 'github'
  | 'googledrive'
  | 'shopify'
  | 'airtable'
  | 'zendesk'
  | 'calder';

export type ModelId =
  'claude-haiku' | 'claude-sonnet' | 'gpt-mini' | 'gemini-flash';

export type PersonId = 'maren' | 'idris' | 'lotte';

export type StepKind =
  | 'trigger'
  | 'agent'
  | 'branch'
  | 'approval'
  | 'tool'
  | 'output'
  | 'wait'
  | 'loop';

export const KIND_WORD: Record<StepKind, string> = {
  trigger: 'Trigger',
  agent: 'Agent',
  branch: 'Branch',
  approval: 'Approval',
  tool: 'Tool',
  output: 'Output',
  wait: 'Wait',
  loop: 'Loop',
};

/** A value may name what an earlier step gave, between braces: {{order.id}}. */
export type ToolSetup = {
  toolId: ToolId;
  actionId: string;
  values: Record<string, string>;
};

export type Creativity = 'precise' | 'balanced' | 'creative';

export type AgentSetup = {
  instructions: string;
  modelId: ModelId;
  creativity: Creativity;
  streams: boolean;
  remembers: boolean;
  retries: boolean;
  outputName: string;
  /** The parts of a structured answer, read as {{topic.order}}. Empty when the agent writes plain text. */
  outputParts: string[];
};

export type TimeoutHours = '1' | '4' | '24';

export type TimeoutRule = 'deny' | 'wait' | 'escalate';

export type ApprovalSetup = {
  approverId: PersonId;
  timeoutHours: TimeoutHours;
  onTimeout: TimeoutRule;
};

export type WaitDuration = '5m' | '1h' | '1d';

export type LoopRounds = '2' | '3' | '5';

type StepBase = {
  id: string;
  name: string;
};

export type TriggerStep = StepBase & {
  kind: 'trigger';
  tool: ToolSetup;
};

export type AgentStep = StepBase & {
  kind: 'agent';
  /** What its picture is drawn from. It stays the same when the step is renamed. */
  seed: string;
  series: SeriesSlot;
  agent: AgentSetup;
};

export type BranchOutput = {
  id: string;
  label: string;
  steps: Step[];
};

export type BranchStep = StepBase & {
  kind: 'branch';
  outputs: BranchOutput[];
};

export type ApprovalStep = StepBase & {
  kind: 'approval';
  approval: ApprovalSetup;
};

export type ToolStep = StepBase & {
  kind: 'tool';
  tool: ToolSetup;
};

export type OutputStep = StepBase & {
  kind: 'output';
  tool: ToolSetup;
};

export type WaitStep = StepBase & {
  kind: 'wait';
  duration: WaitDuration;
};

export type LoopStep = StepBase & {
  kind: 'loop';
  rounds: LoopRounds;
};

export type Step =
  | TriggerStep
  | AgentStep
  | BranchStep
  | ApprovalStep
  | ToolStep
  | OutputStep
  | WaitStep
  | LoopStep;

export type ProductStep = TriggerStep | ToolStep | OutputStep;

/** A flow runs downwards. The outputs of a branch run side by side, then join at the step after it. */
export type Workflow = {
  id: string;
  name: string;
  steps: Step[];
};

/** Where a new step goes: after a step of the same list, first in an output of a branch, or at the end of the flow. */
export type InsertAt =
  | { at: 'after'; stepId: string }
  | { at: 'first'; branchId: string; outputId: string }
  | { at: 'end' };

export const BRANCH_MIN_OUTPUTS = 2;

export function isProductStep(step: Step): step is ProductStep {
  const isTrigger = step.kind === 'trigger';
  const isTool = step.kind === 'tool';
  const isOutput = step.kind === 'output';
  return isTrigger || isTool || isOutput;
}
