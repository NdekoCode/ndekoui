'use client';

import { useId } from 'react';

import { Avatar } from '@/registry/ndeko/ui/avatar';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { LABEL_RECIPE } from '@/registry/ndeko/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';
import { Switch } from '@/registry/ndeko/ui/switch';

import { modelOf, MODELS, PEOPLE, personOf, type Choice } from './data';
import type { ModelId, PersonId } from './model';

export const GROUP = 'flex flex-col gap-4';

export const FIELD = 'flex flex-col gap-1.5';

export const HINT = 'text-muted-foreground text-xs';

type ChoiceSelectProps<Value extends string> = {
  label: string;
  value: Value;
  choices: Choice<Value>[];
  onChange: (value: Value) => void;
};

export function ChoiceSelect<Value extends string>({
  label,
  value,
  choices,
  onChange,
}: ChoiceSelectProps<Value>) {
  const labelId = useId();

  function change(next: unknown) {
    const found = choices.find((choice) => choice.value === next);
    if (found) {
      onChange(found.value);
    }
  }

  return (
    <div className={FIELD}>
      <span id={labelId} className={LABEL_RECIPE}>
        {label}
      </span>
      <Select items={choices} value={value} onValueChange={change}>
        <SelectTrigger aria-labelledby={labelId}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {choices.map((choice) => (
            <SelectItem key={choice.value} value={choice.value}>
              {choice.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

const MODEL_CHOICES: Choice<ModelId>[] = MODELS.map((model) => ({
  value: model.id,
  label: model.name,
}));

type ModelSelectProps = {
  value: ModelId;
  onChange: (modelId: ModelId) => void;
};

/** A model is named with the mark of its maker, in the field and in its list. */
export function ModelSelect({ value, onChange }: ModelSelectProps) {
  const labelId = useId();
  const model = modelOf(value);

  function change(next: unknown) {
    const found = MODELS.find((candidate) => candidate.id === next);
    if (found) {
      onChange(found.id);
    }
  }

  return (
    <div className={FIELD}>
      <span id={labelId} className={LABEL_RECIPE}>
        Model
      </span>
      <Select items={MODEL_CHOICES} value={value} onValueChange={change}>
        <SelectTrigger aria-labelledby={labelId}>
          <span className='flex min-w-0 flex-1 items-center gap-2'>
            <BrandTile brand={model.brand} size='sm' />
            <SelectValue />
          </span>
        </SelectTrigger>
        <SelectContent>
          {MODELS.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              <BrandTile brand={option.brand} size='sm' />
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

type SwitchRowProps = {
  label: string;
  hint: string;
  isOn: boolean;
  onChange: (isOn: boolean) => void;
};

export function SwitchRow({ label, hint, isOn, onChange }: SwitchRowProps) {
  const labelId = useId();
  const hintId = useId();

  return (
    <div className='flex items-start gap-3'>
      <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
        <span id={labelId} className='text-[13px] leading-5 font-medium'>
          {label}
        </span>
        <span id={hintId} className={HINT}>
          {hint}
        </span>
      </div>
      <Switch
        checked={isOn}
        onCheckedChange={onChange}
        aria-labelledby={labelId}
        aria-describedby={hintId}
        className='mt-0.5'
      />
    </div>
  );
}

const PERSON_CHOICES: Choice<PersonId>[] = PEOPLE.map((person) => ({
  value: person.id,
  label: person.name,
}));

type ApproverSelectProps = {
  value: PersonId;
  onChange: (approverId: PersonId) => void;
};

export function ApproverSelect({ value, onChange }: ApproverSelectProps) {
  const labelId = useId();
  const approver = personOf(value);

  function change(next: unknown) {
    const found = PEOPLE.find((person) => person.id === next);
    if (found) {
      onChange(found.id);
    }
  }

  return (
    <div className={FIELD}>
      <span id={labelId} className={LABEL_RECIPE}>
        Who is asked
      </span>
      <Select items={PERSON_CHOICES} value={value} onValueChange={change}>
        <SelectTrigger aria-labelledby={labelId}>
          <span className='flex min-w-0 flex-1 items-center gap-2'>
            <Avatar seed={approver.name} className='size-4' />
            <SelectValue />
          </span>
        </SelectTrigger>
        <SelectContent>
          {PEOPLE.map((person) => (
            <SelectItem key={person.id} value={person.id}>
              <Avatar seed={person.name} className='size-4' />
              <span className='min-w-0 truncate'>{person.name}</span>
              <span className='text-muted-foreground text-xs'>
                {person.role}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
