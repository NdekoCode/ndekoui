'use client';

import { useId } from 'react';

import { TrashIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold } from '@/registry/ndeko/ui/chat-motion';
import { Input } from '@/registry/ndeko/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';
import { Textarea } from '@/registry/ndeko/ui/textarea';

import {
  FIELDS_OF,
  KIND_WORD,
  shownNameOf,
  type FieldSpec,
  type Step,
} from './data';
import {
  outputLinesOf,
  type Graph,
  type OutputLine,
  type Problem,
  type ProblemField,
} from './graph';
import type { BuilderAction } from './session';
import { StepTile } from './step-tile';

type FieldLook = Omit<FieldSpec, 'id'>;

const NAME_LOOK: FieldLook = {
  label: 'Name',
  control: 'text',
  placeholder: 'Name the step',
  missingLine: 'Name the step',
};

function describedByOf(isMissing: boolean, hintId: string) {
  if (isMissing) {
    return hintId;
  }
  return undefined;
}

/** The select holds nothing until a choice is made, so its placeholder shows. */
function chosenOf(value: string) {
  if (value === '') {
    return null;
  }
  return value;
}

function isMissingField(problems: Problem[], field: ProblemField) {
  return problems.some((problem) => problem.field === field);
}

type ControlProps = {
  look: FieldLook;
  value: string;
  fieldId: string;
  labelId: string;
  isMissing: boolean;
  describedBy: string | undefined;
  onChange: (value: string) => void;
};

function ChoiceControl({
  look,
  value,
  fieldId,
  labelId,
  isMissing,
  describedBy,
  onChange,
}: ControlProps) {
  const choices = look.choices ?? [];

  function change(next: unknown) {
    const choice = choices.find((candidate) => candidate.value === next);
    if (choice) {
      onChange(choice.value);
    }
  }

  return (
    <Select items={choices} value={chosenOf(value)} onValueChange={change}>
      <SelectTrigger
        id={fieldId}
        aria-labelledby={labelId}
        aria-invalid={isMissing}
        aria-describedby={describedBy}
      >
        <SelectValue placeholder={look.placeholder} />
      </SelectTrigger>
      <SelectContent>
        {choices.map((choice) => (
          <SelectItem key={choice.value} value={choice.value}>
            {choice.brand && <BrandTile brand={choice.brand} size='sm' />}
            {choice.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type FieldRowProps = {
  look: FieldLook;
  value: string;
  isMissing: boolean;
  onChange: (value: string) => void;
};

/** The hint of an empty field is the sentence the step shows on the canvas. */
function FieldRow({ look, value, isMissing, onChange }: FieldRowProps) {
  const fieldId = useId();
  const labelId = useId();
  const hintId = useId();
  const describedBy = describedByOf(isMissing, hintId);

  return (
    <div className='flex flex-col gap-1.5'>
      <label id={labelId} htmlFor={fieldId} className='text-xs font-medium'>
        {look.label}
      </label>
      {look.control === 'text' && (
        <Input
          id={fieldId}
          value={value}
          autoComplete='off'
          placeholder={look.placeholder}
          aria-invalid={isMissing}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {look.control === 'textarea' && (
        <Textarea
          id={fieldId}
          value={value}
          rows={3}
          placeholder={look.placeholder}
          aria-invalid={isMissing}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {look.control === 'select' && (
        <ChoiceControl
          look={look}
          value={value}
          fieldId={fieldId}
          labelId={labelId}
          isMissing={isMissing}
          describedBy={describedBy}
          onChange={onChange}
        />
      )}
      <Fold open={isMissing}>
        <p id={hintId} className='text-destructive-ink text-xs'>
          {look.missingLine}
        </p>
      </Fold>
    </div>
  );
}

function openWordOf(mustLead: boolean) {
  if (mustLead) {
    return 'Not connected';
  }
  return 'The flow ends here';
}

function openToneOf(mustLead: boolean) {
  if (mustLead) {
    return 'text-warning-foreground';
  }
  return 'text-muted-foreground';
}

/** Both answers of a condition have to lead somewhere. Any other step may end the flow. */
function LeadRow({ line }: { line: OutputLine }) {
  const mustLead = line.output !== 'next';

  return (
    <li className='flex items-center gap-2 text-xs'>
      <span className='text-muted-foreground w-8 shrink-0'>{line.word}</span>
      {line.target && (
        <span className='min-w-0 truncate font-medium'>
          {shownNameOf(line.target)}
        </span>
      )}
      {!line.target && (
        <span className={cn('min-w-0 truncate', openToneOf(mustLead))}>
          {openWordOf(mustLead)}
        </span>
      )}
    </li>
  );
}

export type InspectorProps = {
  step: Step;
  graph: Graph;
  /** The problems of this step alone. */
  problems: Problem[];
  headingId: string;
  onAction: (action: BuilderAction) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
};

export function Inspector({
  step,
  graph,
  problems,
  headingId,
  onAction,
  onRemove,
  onClose,
}: InspectorProps) {
  const lines = outputLinesOf(graph, step);
  const flowProblems = problems.filter(
    (problem) => problem.field === undefined
  );
  const hasFlowProblems = flowProblems.length > 0;

  return (
    <div className='flex min-h-0 flex-1 flex-col gap-4'>
      <header className='flex items-center gap-2.5'>
        <StepTile step={step} />
        <div className='flex min-w-0 flex-1 flex-col'>
          <span className='text-muted-foreground text-[11px] leading-4'>
            {KIND_WORD[step.kind]}
          </span>
          <h2
            id={headingId}
            tabIndex={-1}
            data-inspector-heading
            className='focus-visible:ring-ring/25 truncate rounded-sm text-sm leading-5 font-medium outline-none focus-visible:ring-[3px]'
          >
            {shownNameOf(step)}
          </h2>
        </div>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label='Close the inspector'
          onClick={onClose}
          className='text-muted-foreground'
        >
          <XIcon />
        </Button>
      </header>
      <div className='-mx-1 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1 pb-1'>
        {hasFlowProblems && (
          <ul className='bg-warning/10 text-warning-foreground flex flex-col gap-1 rounded-md px-2.5 py-2 text-xs'>
            {flowProblems.map((problem) => (
              <li key={problem.line}>{problem.line}</li>
            ))}
          </ul>
        )}
        <FieldRow
          look={NAME_LOOK}
          value={step.name}
          isMissing={isMissingField(problems, 'name')}
          onChange={(name) => onAction({ type: 'renamed', id: step.id, name })}
        />
        {FIELDS_OF[step.kind].map((spec) => (
          <FieldRow
            key={spec.id}
            look={spec}
            value={step.values[spec.id] ?? ''}
            isMissing={isMissingField(problems, spec.id)}
            onChange={(value) =>
              onAction({
                type: 'fieldChanged',
                id: step.id,
                field: spec.id,
                value,
              })
            }
          />
        ))}
        <div className='flex flex-col gap-1.5'>
          <h3 className='text-xs font-medium'>Leads to</h3>
          <ul className='bg-foreground/[0.04] flex flex-col gap-1.5 rounded-md px-2.5 py-2'>
            {lines.map((line) => (
              <LeadRow key={line.output} line={line} />
            ))}
          </ul>
        </div>
      </div>
      <footer>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={() => onRemove(step.id)}
          className='text-destructive-ink -ms-2'
        >
          <TrashIcon />
          Delete step
        </Button>
      </footer>
    </div>
  );
}
