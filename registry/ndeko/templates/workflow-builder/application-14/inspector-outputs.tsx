'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId, useRef } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { PlusIcon, Trash2Icon } from '@/registry/ndeko/lib/icons';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { Button } from '@/registry/ndeko/ui/button';
import { Input } from '@/registry/ndeko/ui/input';
import { LABEL_RECIPE } from '@/registry/ndeko/ui/label';

import {
  BRANCH_MIN_OUTPUTS,
  type BranchOutput,
  type BranchStep,
} from './model';

type OutputRowProps = {
  output: BranchOutput;
  rank: number;
  canRemove: boolean;
  onRename: (outputId: string, label: string) => void;
  onRemove: (outputId: string) => void;
};

function OutputRow({
  output,
  rank,
  canRemove,
  onRename,
  onRemove,
}: OutputRowProps) {
  return (
    <div className='flex items-center gap-1.5 py-1'>
      <Input
        value={output.label}
        aria-label={`Name of output ${rank}`}
        onChange={(event) => onRename(output.id, event.target.value)}
      />
      <Button
        type='button'
        variant='ghost'
        size='icon-sm'
        aria-label={`Remove the output ${output.label}`}
        disabled={!canRemove}
        onClick={() => onRemove(output.id)}
        className='text-muted-foreground shrink-0'
      >
        <Trash2Icon />
      </Button>
    </div>
  );
}

type BranchFieldsProps = {
  step: BranchStep;
  onAdd: () => void;
  onRename: (outputId: string, label: string) => void;
  onRemove: (outputId: string) => void;
};

/** The outputs of a branch as a list to edit. A branch keeps at least two, so the last two cannot be removed. */
export function BranchFields({
  step,
  onAdd,
  onRename,
  onRemove,
}: BranchFieldsProps) {
  const labelId = useId();
  const ruleId = useId();
  const addRef = useRef<HTMLButtonElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const canRemove = step.outputs.length > BRANCH_MIN_OUTPUTS;

  /** The button that was pressed leaves with its row, so the focus goes to the one that adds a row. */
  function remove(outputId: string) {
    onRemove(outputId);
    requestAnimationFrame(() => addRef.current?.focus());
  }

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex flex-col gap-0.5'>
        <span id={labelId} className={LABEL_RECIPE}>
          Outputs
        </span>
        <p id={ruleId} className='text-muted-foreground text-xs'>
          A run takes the output named like its topic, or the last one. A branch
          keeps at least two
        </p>
      </div>
      <ul
        aria-labelledby={labelId}
        aria-describedby={ruleId}
        className='-my-1 flex flex-col'
      >
        <AnimatePresence initial={false}>
          {step.outputs.map((output, index) => (
            <motion.li
              key={output.id}
              className='-mx-1 overflow-hidden px-1'
              {...rowPresence}
            >
              <OutputRow
                output={output}
                rank={index + 1}
                canRemove={canRemove}
                onRename={onRename}
                onRemove={remove}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <button
        ref={addRef}
        type='button'
        onClick={onAdd}
        className='hairline-border text-muted-foreground hover:border-foreground/35 hover:text-foreground focus-visible:ring-ring/25 border-foreground/20 flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border-dashed text-[13px] transition-[color,border-color] duration-150 outline-none focus-visible:ring-[3px] active:scale-[0.97]'
      >
        <PlusIcon className='size-3.5' />
        Add an output
      </button>
    </div>
  );
}
