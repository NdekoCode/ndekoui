'use client';

import { CopyButton } from '@/registry/ndeko/ui/copy-button';

import { upstreamOf, type Placed } from './flow';
import { isProductStep, type Step, type Workflow } from './model';
import { StepTile } from './node-tile';
import { actionOf, toolOf } from './tools';

function tokenOf(path: string) {
  return `{{${path}}}`;
}

/** What a step leaves for the ones after it: the result of its action, the answer of its agent, the decision of a person. */
function tokensOf(step: Step) {
  if (isProductStep(step)) {
    const tool = toolOf(step.tool.toolId);
    const action = actionOf(tool, step.tool.actionId);
    return action.outputs.map((part) => tokenOf(`${action.namespace}.${part}`));
  }
  if (step.kind === 'agent') {
    const { outputName, outputParts } = step.agent;
    if (outputParts.length === 0) {
      return [tokenOf(outputName)];
    }
    return outputParts.map((part) => tokenOf(`${outputName}.${part}`));
  }
  if (step.kind === 'approval') {
    return [tokenOf('approval.decision')];
  }
  if (step.kind === 'branch') {
    return [tokenOf('branch.taken')];
  }
  if (step.kind === 'loop') {
    return [tokenOf('loop.round')];
  }
  return [];
}

function givesSomething(placed: Placed) {
  const tokens = tokensOf(placed.step);
  return tokens.length > 0;
}

/** A step of a branch only ran when its branch was taken: what it gives may be empty. */
function originOf(placed: Placed) {
  if (placed.branchLabel === null) {
    return null;
  }
  return `Only when ${placed.branchLabel} ran`;
}

type TokenGroupProps = {
  placed: Placed;
  tokens: string[];
};

function TokenGroup({ placed, tokens }: TokenGroupProps) {
  const origin = originOf(placed);

  return (
    <li className='flex flex-col gap-1.5'>
      <div className='flex items-center gap-2'>
        <StepTile step={placed.step} size='md' />
        <span className='min-w-0 truncate text-[13px] font-medium'>
          {placed.step.name}
        </span>
      </div>
      {origin && <p className='text-muted-foreground text-xs'>{origin}</p>}
      <ul
        aria-label={`What ${placed.step.name} gives`}
        className='flex flex-col gap-1'
      >
        {tokens.map((token) => (
          <li key={token} className='flex items-center gap-1'>
            <code className='bg-foreground/[0.05] min-w-0 flex-1 truncate rounded-md px-2 py-1 font-mono text-xs leading-4'>
              {token}
            </code>
            <CopyButton text={token} label={`Copy ${token}`} />
          </li>
        ))}
      </ul>
    </li>
  );
}

type VariablesPanelProps = {
  workflow: Workflow;
  step: Step;
};

export function VariablesPanel({ workflow, step }: VariablesPanelProps) {
  const upstream = upstreamOf(workflow, step.id);
  const givers = upstream.filter(givesSomething);

  if (givers.length === 0) {
    return (
      <p className='text-muted-foreground text-[13px] leading-relaxed'>
        Nothing runs before this step, so it has nothing to read yet
      </p>
    );
  }

  return (
    <ul
      aria-label='Variables this step can read'
      className='flex flex-col gap-4'
    >
      {givers.map((placed) => (
        <TokenGroup
          key={placed.step.id}
          placed={placed}
          tokens={tokensOf(placed.step)}
        />
      ))}
    </ul>
  );
}
