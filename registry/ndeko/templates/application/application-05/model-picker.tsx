'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';

import { models, type ModelValue } from './data';

function isModelValue(value: unknown): value is ModelValue {
  return models.some((model) => model.value === value);
}

type ModelPickerProps = {
  value: ModelValue;
  onChange: (value: ModelValue) => void;
  disabled?: boolean;
};

export function ModelPicker({ value, onChange, disabled }: ModelPickerProps) {
  function change(next: unknown) {
    if (isModelValue(next)) {
      onChange(next);
    }
  }

  return (
    <Select
      items={models}
      value={value}
      onValueChange={change}
      disabled={disabled}
    >
      <SelectTrigger size='sm' aria-label='Model' className='w-auto min-w-32'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className='min-w-64'>
        {models.map((model) => (
          <SelectItem key={model.value} value={model.value}>
            <span className='shrink-0'>{model.label}</span>
            <span className='text-muted-foreground truncate text-xs'>
              {model.hint}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
