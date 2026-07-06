'use client';

import { cn } from '@/registry/ndeko/lib/utils';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { Switch } from '@/registry/ndeko/ui/switch';

import { filterSummaryOf } from './comparison';

type DifferencesSwitchProps = {
  isOn: boolean;
  onChange: (isOn: boolean) => void;
  className?: string;
};

/** The Only differences switch, with a line that says what it hides. */
export function DifferencesSwitch({
  isOn,
  onChange,
  className,
}: DifferencesSwitchProps) {
  const summary = filterSummaryOf(isOn);

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label className='flex w-fit cursor-pointer items-center gap-2.5 text-[13px] font-medium'>
        <Switch checked={isOn} onCheckedChange={onChange} />
        Only differences
      </label>
      <p className='text-muted-foreground text-xs text-pretty'>
        <Swap swapKey={summary}>{summary}</Swap>
      </p>
    </div>
  );
}
