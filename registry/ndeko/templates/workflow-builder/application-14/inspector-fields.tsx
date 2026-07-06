'use client';

import { useId } from 'react';

import { Input } from '@/registry/ndeko/ui/input';
import { Label, LABEL_RECIPE } from '@/registry/ndeko/ui/label';
import { Segments } from '@/registry/ndeko/ui/segments';
import { Textarea } from '@/registry/ndeko/ui/textarea';

import { CREATIVITIES, ROUNDS, TIMEOUT_RULES, TIMEOUTS, WAITS } from './data';
import {
  ApproverSelect,
  ChoiceSelect,
  FIELD,
  GROUP,
  HINT,
  ModelSelect,
  SwitchRow,
} from './field-kit';
import type {
  AgentSetup,
  AgentStep,
  ApprovalSetup,
  ApprovalStep,
  LoopRounds,
  LoopStep,
  ProductStep,
  WaitDuration,
  WaitStep,
} from './model';
import { MarkTile } from './node-tile';
import { actionOf, toolOf, type ToolField } from './tools';

/** A name other steps read between braces: letters, figures and underscores only. */
function variableNameOf(typed: string) {
  return typed.replace(/[^a-zA-Z0-9_]/g, '_');
}

type AgentFieldsProps = {
  step: AgentStep;
  onChange: (patch: Partial<AgentSetup>) => void;
};

export function AgentFields({ step, onChange }: AgentFieldsProps) {
  const instructionsId = useId();
  const outputId = useId();
  const outputHintId = useId();
  const { agent } = step;

  function renameOutput(event: React.ChangeEvent<HTMLInputElement>) {
    const outputName = variableNameOf(event.target.value);
    onChange({ outputName });
  }

  return (
    <div className={GROUP}>
      <div className={FIELD}>
        <Label htmlFor={instructionsId}>Instructions</Label>
        <Textarea
          id={instructionsId}
          value={agent.instructions}
          placeholder='Say what this agent does with what it receives'
          onChange={(event) => onChange({ instructions: event.target.value })}
          className='min-h-24'
        />
      </div>
      <ModelSelect
        value={agent.modelId}
        onChange={(modelId) => onChange({ modelId })}
      />
      <div className={FIELD}>
        <span className={LABEL_RECIPE}>Creativity</span>
        <Segments
          label='Creativity'
          value={agent.creativity}
          segments={CREATIVITIES}
          onValueChange={(creativity) => onChange({ creativity })}
          className='w-full'
        />
      </div>
      <div className='flex flex-col gap-3'>
        <SwitchRow
          label='Stream the answer'
          hint='Words show as they are written'
          isOn={agent.streams}
          onChange={(streams) => onChange({ streams })}
        />
        <SwitchRow
          label='Remember the thread'
          hint='Earlier emails of the customer are read first'
          isOn={agent.remembers}
          onChange={(remembers) => onChange({ remembers })}
        />
        <SwitchRow
          label='Retry once on failure'
          hint='One more try before the run stops'
          isOn={agent.retries}
          onChange={(retries) => onChange({ retries })}
        />
      </div>
      <div className={FIELD}>
        <Label htmlFor={outputId}>Output name</Label>
        <Input
          id={outputId}
          value={agent.outputName}
          aria-describedby={outputHintId}
          onChange={renameOutput}
          className='font-mono'
        />
        <p id={outputHintId} className={HINT}>
          Later steps read it as{' '}
          <code className='font-mono'>{`{{${agent.outputName}}}`}</code>
        </p>
      </div>
    </div>
  );
}

type ApprovalFieldsProps = {
  step: ApprovalStep;
  onChange: (patch: Partial<ApprovalSetup>) => void;
};

export function ApprovalFields({ step, onChange }: ApprovalFieldsProps) {
  const { approval } = step;

  return (
    <div className={GROUP}>
      <ApproverSelect
        value={approval.approverId}
        onChange={(approverId) => onChange({ approverId })}
      />
      <ChoiceSelect
        label='If nobody answers'
        value={approval.timeoutHours}
        choices={TIMEOUTS}
        onChange={(timeoutHours) => onChange({ timeoutHours })}
      />
      <ChoiceSelect
        label='Then'
        value={approval.onTimeout}
        choices={TIMEOUT_RULES}
        onChange={(onTimeout) => onChange({ onTimeout })}
      />
    </div>
  );
}

type ToolFieldRowProps = {
  field: ToolField;
  value: string;
  onChange: (fieldId: string, value: string) => void;
};

function ToolFieldRow({ field, value, onChange }: ToolFieldRowProps) {
  const inputId = useId();

  return (
    <div className={FIELD}>
      <Label htmlFor={inputId}>{field.label}</Label>
      <Input
        id={inputId}
        value={value}
        onChange={(event) => onChange(field.id, event.target.value)}
      />
    </div>
  );
}

/** A trigger listens for an event of its product. A tool or an output runs one of its actions. */
function actionLabelOf(isTrigger: boolean) {
  if (isTrigger) {
    return 'Event';
  }
  return 'Action';
}

type ProductFieldsProps = {
  step: ProductStep;
  onPickAction: (actionId: string) => void;
  onChangeField: (fieldId: string, value: string) => void;
};

export function ProductFields({
  step,
  onPickAction,
  onChangeField,
}: ProductFieldsProps) {
  const tool = toolOf(step.tool.toolId);
  const action = actionOf(tool, step.tool.actionId);
  const isTrigger = step.kind === 'trigger';
  const offered = tool.actions.filter((entry) => entry.isEvent === isTrigger);
  const choices = offered.map((entry) => ({
    value: entry.id,
    label: entry.label,
  }));

  return (
    <div className={GROUP}>
      <div className='bg-foreground/[0.04] flex items-center gap-2 rounded-lg p-2'>
        <MarkTile mark={tool.mark} size='md' />
        <span className='min-w-0 truncate text-[13px] font-medium'>
          {tool.name}
        </span>
      </div>
      <ChoiceSelect
        label={actionLabelOf(isTrigger)}
        value={action.id}
        choices={choices}
        onChange={onPickAction}
      />
      {action.fields.map((field) => (
        <ToolFieldRow
          key={`${action.id} ${field.id}`}
          field={field}
          value={step.tool.values[field.id] ?? ''}
          onChange={onChangeField}
        />
      ))}
    </div>
  );
}

type WaitFieldsProps = {
  step: WaitStep;
  onChange: (duration: WaitDuration) => void;
};

export function WaitFields({ step, onChange }: WaitFieldsProps) {
  return (
    <div className={GROUP}>
      <ChoiceSelect
        label='Wait for'
        value={step.duration}
        choices={WAITS}
        onChange={onChange}
      />
      <p className={HINT}>A test run does not wait: it goes straight on</p>
    </div>
  );
}

type LoopFieldsProps = {
  step: LoopStep;
  onChange: (rounds: LoopRounds) => void;
};

export function LoopFields({ step, onChange }: LoopFieldsProps) {
  return (
    <div className={GROUP}>
      <ChoiceSelect
        label='Repeat what follows'
        value={step.rounds}
        choices={ROUNDS}
        onChange={onChange}
      />
      <p className={HINT}>A test run plays one round</p>
    </div>
  );
}
