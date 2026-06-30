'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId } from 'react';

import { PlusIcon, XIcon, type Icon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Input } from '@/registry/ndeko/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';

import {
  ACTIONS,
  FIELDS,
  type Action,
  type ActionKind,
  type Condition,
  type FieldId,
  type Option,
  type OperatorId,
} from './data';
import { FADE_PRESENCE, useHeightPresence } from './motion-parts';
import {
  actionDefinitionOf,
  actionPhraseOf,
  conditionPhraseOf,
  digitsOf,
  fieldOf,
  targetOptionsOf,
} from './rule-model';

const FIELD_OPTIONS: Option<FieldId>[] = FIELDS.map((field) => ({
  value: field.id,
  label: field.label,
}));

const ACTION_OPTIONS: Option<ActionKind>[] = ACTIONS.map((action) => ({
  value: action.kind,
  label: action.label,
}));

const ADD_SLOT = [
  'flex h-9 w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 text-[13px] text-muted-foreground outline-none',
  'hairline-border border-dashed border-foreground/20 transition-[color,border-color,scale] duration-150 ease-(--ease-out-strong)',
  'hover:border-foreground/35 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/25 active:scale-[0.99]',
].join(' ');

function describedByOf(error: string | undefined, errorId: string) {
  if (error) {
    return errorId;
  }
  return undefined;
}

function targetLabelOf(target: string | null) {
  if (target === 'channel') {
    return 'Channel';
  }
  return 'Approver';
}

type ChoiceSelectProps<Value extends string> = {
  label: string;
  value: Value;
  options: Option<Value>[];
  className?: string;
  onValueChange: (value: Value) => void;
};

export function ChoiceSelect<Value extends string>({
  label,
  value,
  options,
  className,
  onValueChange,
}: ChoiceSelectProps<Value>) {
  function changeValue(nextValue: unknown) {
    const option = options.find((candidate) => candidate.value === nextValue);
    if (option) {
      onValueChange(option.value);
    }
  }

  return (
    <Select items={options} value={value} onValueChange={changeValue}>
      <SelectTrigger aria-label={label} className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type StepProps = {
  icon: Icon;
  title: string;
  hint: string;
  isLast?: boolean;
  aside?: React.ReactNode;
  children: React.ReactNode;
};

/** One step of the rule on a rail: the tile and the line on the left, the step's rows on the right. */
export function Step({
  icon: StepIcon,
  title,
  hint,
  isLast = false,
  aside,
  children,
}: StepProps) {
  const titleId = useId();
  const hasLine = !isLast;

  return (
    <section
      aria-labelledby={titleId}
      className='grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3'
    >
      <div className='flex flex-col items-center'>
        <span className='keycap-3d text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg'>
          <StepIcon />
        </span>
        {hasLine && (
          <span
            aria-hidden='true'
            className='hairline-l border-border my-1.5 flex-1'
          />
        )}
      </div>
      <div className='flex min-w-0 flex-col gap-3 pb-6'>
        <div className='flex min-h-8 flex-wrap items-center justify-between gap-x-3 gap-y-1'>
          <div className='flex flex-col'>
            <h2 id={titleId} className='text-sm font-medium'>
              {title}
            </h2>
            <p className='text-muted-foreground text-xs'>{hint}</p>
          </div>
          {aside}
        </div>
        {children}
      </div>
    </section>
  );
}

type AddSlotProps = {
  label: string;
  ref?: React.Ref<HTMLButtonElement>;
  onAdd: () => void;
};

/** A dashed slot: the empty place where the next row goes. */
export function AddSlot({ label, ref, onAdd }: AddSlotProps) {
  return (
    <button ref={ref} type='button' onClick={onAdd} className={ADD_SLOT}>
      <PlusIcon className='size-4' />
      {label}
    </button>
  );
}

export function RowError({ id, error }: { id: string; error?: string }) {
  const heightPresence = useHeightPresence();

  return (
    <AnimatePresence initial={false}>
      {error && (
        <motion.p
          key='error'
          id={id}
          {...heightPresence}
          className='text-destructive-ink overflow-hidden text-xs'
        >
          <span className='block pt-1.5'>{error}</span>
        </motion.p>
      )}
    </AnimatePresence>
  );
}

type ValueControlProps = {
  condition: Condition;
  error?: string;
  errorId: string;
  onValueChange: (value: string) => void;
};

function ValueControl({
  condition,
  error,
  errorId,
  onValueChange,
}: ValueControlProps) {
  const field = fieldOf(condition.field);
  const isInvalid = Boolean(error);
  const describedBy = describedByOf(error, errorId);

  function typeAmount(event: React.ChangeEvent<HTMLInputElement>) {
    const digits = digitsOf(event.target.value);
    onValueChange(digits);
  }

  function typeText(event: React.ChangeEvent<HTMLInputElement>) {
    onValueChange(event.target.value);
  }

  if (field.kind === 'choice') {
    return (
      <ChoiceSelect
        label={`${field.label} value`}
        value={condition.value}
        options={field.choices}
        onValueChange={onValueChange}
        className='min-w-0 flex-1 sm:w-40 sm:flex-none'
      />
    );
  }

  if (field.kind === 'amount') {
    return (
      <div className='relative min-w-0 flex-1 sm:w-32 sm:flex-none'>
        <span
          aria-hidden='true'
          className='text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-[13px]'
        >
          €
        </span>
        <Input
          inputMode='numeric'
          aria-label='Amount in euros'
          aria-invalid={isInvalid}
          aria-describedby={describedBy}
          value={condition.value}
          onChange={typeAmount}
          className='ps-6 tabular-nums'
        />
      </div>
    );
  }

  return (
    <Input
      aria-label='Part of the merchant name'
      aria-invalid={isInvalid}
      aria-describedby={describedBy}
      placeholder='For example: air'
      value={condition.value}
      onChange={typeText}
      className='min-w-0 flex-1 sm:w-40 sm:flex-none'
    />
  );
}

type ConditionRowProps = {
  condition: Condition;
  error?: string;
  onFieldChange: (fieldId: FieldId) => void;
  onChange: (condition: Condition) => void;
  onRemove: () => void;
};

export function ConditionRow({
  condition,
  error,
  onFieldChange,
  onChange,
  onRemove,
}: ConditionRowProps) {
  const errorId = useId();
  const field = fieldOf(condition.field);
  const phrase = conditionPhraseOf(condition);

  function changeOperator(operator: OperatorId) {
    onChange({ ...condition, operator });
  }

  function changeValue(value: string) {
    onChange({ ...condition, value });
  }

  return (
    <div className='flex flex-col'>
      <div className='flex flex-wrap items-center gap-2'>
        <ChoiceSelect
          label='Field'
          value={condition.field}
          options={FIELD_OPTIONS}
          onValueChange={onFieldChange}
          className='w-[calc(50%-0.25rem)] sm:w-32'
        />
        <ChoiceSelect
          label='Comparison'
          value={condition.operator}
          options={field.operators}
          onValueChange={changeOperator}
          className='w-[calc(50%-0.25rem)] sm:w-28'
        />
        <ValueControl
          condition={condition}
          error={error}
          errorId={errorId}
          onValueChange={changeValue}
        />
        <Button
          variant='ghost'
          size='icon'
          aria-label={`Remove the condition ${phrase}`}
          onClick={onRemove}
          className='ms-auto'
        >
          <XIcon />
        </Button>
      </div>
      <RowError id={errorId} error={error} />
    </div>
  );
}

type ActionRowProps = {
  action: Action;
  onKindChange: (kind: ActionKind) => void;
  onChange: (action: Action) => void;
  onRemove: () => void;
};

export function ActionRow({
  action,
  onKindChange,
  onChange,
  onRemove,
}: ActionRowProps) {
  const definition = actionDefinitionOf(action.kind);
  const targetOptions = targetOptionsOf(action.kind);
  const hasTarget = targetOptions.length > 0;
  const phrase = actionPhraseOf(action);
  const targetLabel = targetLabelOf(definition.target);

  function changeTarget(target: string) {
    onChange({ ...action, target });
  }

  return (
    <div className='flex flex-wrap items-center gap-2'>
      <ChoiceSelect
        label='Action'
        value={action.kind}
        options={ACTION_OPTIONS}
        onValueChange={onKindChange}
        className='min-w-0 flex-1 sm:w-48 sm:flex-none'
      />
      <AnimatePresence initial={false} mode='popLayout'>
        {hasTarget && (
          <motion.div
            key={action.kind}
            {...FADE_PRESENCE}
            className='order-last w-full sm:order-none sm:w-44'
          >
            <ChoiceSelect
              label={targetLabel}
              value={action.target}
              options={targetOptions}
              onValueChange={changeTarget}
              className='w-full'
            />
          </motion.div>
        )}
      </AnimatePresence>
      <Button
        variant='ghost'
        size='icon'
        aria-label={`Remove the action ${phrase}`}
        onClick={onRemove}
        className='ms-auto'
      >
        <XIcon />
      </Button>
    </div>
  );
}
