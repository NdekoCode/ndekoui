'use client';

import { Select as SelectPrimitive } from '@base-ui/react/select';

import { MorphingLabel } from '@/registry/ndeko/components/navbar/_parts/morphing-label';
import { ChevronsUpDownIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Select, SelectContent, SelectItem } from '@/registry/ndeko/ui/select';

type GhostSelectOption = { value: string; label: string };

type GhostSelectProps = {
  items: GhostSelectOption[];
  defaultValue: string;
  label: string;
  icon?: React.ReactNode;
  className?: string;
  valueClassName?: string;
};

function labelOf(items: GhostSelectOption[], value: string) {
  const selected = items.find((item) => item.value === value);
  return selected?.label ?? value;
}

function GhostSelect({
  items,
  defaultValue,
  label,
  icon,
  className,
  valueClassName,
}: GhostSelectProps) {
  function renderValue(value: string) {
    return <MorphingLabel value={value}>{labelOf(items, value)}</MorphingLabel>;
  }

  return (
    <Select items={items} defaultValue={defaultValue}>
      <SelectPrimitive.Trigger
        aria-label={label}
        render={
          <Button
            variant='ghost'
            className={cn('text-foreground gap-1.5 px-2', className)}
          />
        }
      >
        {icon}
        <SelectPrimitive.Value className={cn('flex', valueClassName)}>
          {renderValue}
        </SelectPrimitive.Value>
        <ChevronsUpDownIcon className='text-muted-foreground size-3.5' />
      </SelectPrimitive.Trigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { GhostSelect, type GhostSelectOption };
