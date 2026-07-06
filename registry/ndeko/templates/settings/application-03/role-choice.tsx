'use client';

import { RadioGroup, RadioGroupItem } from '@/registry/ndeko/ui/radio-group';

import type { Role, RoleOption } from './data';

function holdersLineOf(holders: number) {
  if (holders === 1) {
    return '1 person has this role today';
  }
  return `${holders} people have this role today`;
}

type RoleChoiceProps = {
  labelledBy: string;
  options: RoleOption[];
  value: Role;
  onValueChange: (role: Role) => void;
};

/** A choice that changes what new people can do: each option says what it allows and who holds it now. */
export function RoleChoice({
  labelledBy,
  options,
  value,
  onValueChange,
}: RoleChoiceProps) {
  function changeValue(nextValue: unknown) {
    const option = options.find((candidate) => candidate.value === nextValue);
    if (option) {
      onValueChange(option.value);
    }
  }

  return (
    <RadioGroup
      aria-labelledby={labelledBy}
      value={value}
      onValueChange={changeValue}
      className='hairline-divide-y divide-border gap-0'
    >
      {options.map((option) => {
        const holdersLine = holdersLineOf(option.holders);

        return (
          <label
            key={option.value}
            className='has-data-checked:bg-primary/[0.06] flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl'
          >
            <RadioGroupItem value={option.value} className='mt-0.5' />
            <span className='flex min-w-0 flex-col gap-0.5'>
              <span className='text-[13px] font-medium'>{option.label}</span>
              <span className='text-muted-foreground text-xs'>
                {option.line}
              </span>
              <span className='text-muted-foreground text-xs tabular-nums'>
                {holdersLine}
              </span>
            </span>
          </label>
        );
      })}
    </RadioGroup>
  );
}
