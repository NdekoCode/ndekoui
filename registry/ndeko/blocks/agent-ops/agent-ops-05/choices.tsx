'use client';

import { cn } from '@/registry/ndeko/lib/utils';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { LetterTile } from '@/registry/ndeko/ui/letter-tile';
import { ToggleGroup, ToggleGroupItem } from '@/registry/ndeko/ui/toggle-group';

import { EDITORS, type Editor, type EditorId } from './data';

const THUMB =
  'bg-card shadow-[0_1px_2px_rgb(0_0_0/0.08)] hairline-ring ring-foreground/10 dark:bg-foreground/[0.09] dark:ring-foreground/15';

function EditorMark({ editor }: { editor: Editor }) {
  if (editor.brand) {
    return <BrandTile brand={editor.brand} size='lg' />;
  }
  return <LetterTile initial={editor.initial} size='lg' />;
}

type EditorTilesProps = {
  value: EditorId;
  onValueChange: (id: EditorId) => void;
};

export function EditorTiles({ value, onValueChange }: EditorTilesProps) {
  function change(values: unknown[]) {
    const [next] = values;
    const editor = EDITORS.find((candidate) => candidate.id === next);
    if (editor) {
      onValueChange(editor.id);
    }
  }

  return (
    <ToggleGroup
      aria-label='Editor'
      value={[value]}
      onValueChange={change}
      travel
      indicatorClassName={THUMB}
      className='bg-foreground/[0.04] grid w-full grid-cols-3 gap-1 rounded-xl p-1 @xl:grid-cols-6'
    >
      {EDITORS.map((editor) => (
        <ToggleGroupItem
          key={editor.id}
          value={editor.id}
          className='h-auto min-w-0 flex-col gap-1.5 rounded-lg px-1 py-2.5 text-xs'
        >
          <EditorMark editor={editor} />
          <span className='max-w-full truncate'>{editor.name}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export type Option<Value extends string> = {
  value: Value;
  label: string;
};

type OptionSwitchProps<Value extends string> = {
  label: string;
  value: Value;
  options: readonly Option<Value>[];
  isDisabled?: boolean;
  onValueChange: (value: Value) => void;
  className?: string;
};

/** A segmented switch that can be locked when the editor leaves no choice. */
export function OptionSwitch<Value extends string>({
  label,
  value,
  options,
  isDisabled = false,
  onValueChange,
  className,
}: OptionSwitchProps<Value>) {
  function change(values: unknown[]) {
    const [next] = values;
    const option = options.find((candidate) => candidate.value === next);
    if (option) {
      onValueChange(option.value);
    }
  }

  return (
    <ToggleGroup
      aria-label={label}
      value={[value]}
      onValueChange={change}
      disabled={isDisabled}
      travel
      size='sm'
      indicatorClassName={THUMB}
      className={cn('bg-foreground/[0.05] rounded-lg p-0.5', className)}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className='h-6 flex-1 rounded-md px-2.5 text-xs'
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
