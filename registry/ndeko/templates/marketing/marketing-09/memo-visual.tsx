'use client';

import { FileTextIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Chip } from '@/registry/ndeko/ui/chip';

import { ILLUSTRATIVE_NOTE, MEMO } from './data';
import { useSteps } from './use-steps';
import { type VisualProps } from './visual-props';

const CHARS_PER_STEP = 2;

const LINE_STARTS = startsOf(MEMO.lines.map((line) => line.text.length));

const TOTAL_CHARS = totalOf(MEMO.lines.map((line) => line.text.length));

const TOTAL_STEPS = Math.ceil(TOTAL_CHARS / CHARS_PER_STEP);

function startsOf(lengths: number[]) {
  const starts: number[] = [];
  let before = 0;
  for (const length of lengths) {
    starts.push(before);
    before += length;
  }
  return starts;
}

function totalOf(lengths: number[]) {
  let total = 0;
  for (const length of lengths) {
    total += length;
  }
  return total;
}

function typedIn(lineIndex: number, typedChars: number) {
  const length = MEMO.lines[lineIndex].text.length;
  const into = typedChars - LINE_STARTS[lineIndex];
  return Math.min(length, Math.max(0, into));
}

function statusClassOf(isComplete: boolean) {
  if (isComplete) {
    return 'opacity-100';
  }
  return 'opacity-0';
}

type MemoLineProps = {
  text: string;
  typed: number;
};

/** The line is a black bar the length of its text, and the text types itself out of the bar from the left. */
function MemoLine({ text, typed }: MemoLineProps) {
  const rest = text.length - typed;
  const barStyle = { width: `${rest}ch` };

  return (
    <p className='font-mono text-[13px] leading-6 whitespace-nowrap'>
      <span className='sr-only'>{text}</span>
      <span aria-hidden='true'>
        {text.slice(0, typed)}
        <span
          style={barStyle}
          className='bg-foreground/85 inline-block h-[0.9em] rounded-[2px] align-[-0.12em]'
        />
      </span>
    </p>
  );
}

export function MemoVisual({ progress }: VisualProps) {
  const step = useSteps(progress, TOTAL_STEPS, 0.88);
  const typedChars = step * CHARS_PER_STEP;
  const isComplete = typedChars >= TOTAL_CHARS;

  return (
    <div className='bg-card hairline-ring ring-border mx-auto flex w-full max-w-md flex-col gap-5 rounded-xl p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-16px_rgb(0_0_0/0.12)] sm:p-6'>
      <div className='flex items-center gap-2.5'>
        <span className='keycap-3d text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg'>
          <FileTextIcon />
        </span>
        <p className='min-w-0 flex-1 truncate text-sm font-medium'>
          {MEMO.title}
        </p>
        <Badge variant='secondary' className='text-muted-foreground'>
          {ILLUSTRATIVE_NOTE}
        </Badge>
      </div>
      <div className='flex flex-col gap-1.5'>
        {MEMO.lines.map((line, index) => (
          <MemoLine
            key={line.text}
            text={line.text}
            typed={typedIn(index, typedChars)}
          />
        ))}
      </div>
      <div
        aria-live='polite'
        className={cn(
          'transition-opacity duration-300 ease-(--ease-out-strong)',
          statusClassOf(isComplete)
        )}
      >
        <Chip color='var(--success)'>{MEMO.status}</Chip>
      </div>
    </div>
  );
}
