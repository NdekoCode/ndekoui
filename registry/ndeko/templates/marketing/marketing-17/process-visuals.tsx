import { KeyIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';

import type { ProcessStepId } from './data';

const FRAME =
  'hairline-border border-border bg-background flex aspect-[4/3] w-full max-w-md flex-col justify-between gap-6 rounded-xl p-6';

const LINE_WIDTHS = ['w-3/4', 'w-full', 'w-5/6', 'w-2/3', 'w-full', 'w-1/2'];

const HIGHLIGHTED = new Set([1, 4]);

function lineToneOf(index: number) {
  if (HIGHLIGHTED.has(index)) {
    return 'bg-primary/40';
  }
  return 'bg-foreground/15';
}

function ListenVisual() {
  return (
    <div className={FRAME}>
      <div className='flex flex-col gap-3'>
        <span className='bg-foreground/60 h-2 w-1/3 rounded-full' />
        <div className='flex flex-col gap-2.5'>
          {LINE_WIDTHS.map((width, index) => (
            <span
              key={`${width}-${index}`}
              className={cn('h-1.5 rounded-full', width, lineToneOf(index))}
            />
          ))}
        </div>
      </div>
      <div className='flex items-center gap-2'>
        <Avatar seed='Partner interview' className='size-6' />
        <span className='bg-foreground/15 h-1.5 w-24 rounded-full' />
      </div>
    </div>
  );
}

const MODULE_TONES = [
  'bg-foreground/10',
  'bg-transparent',
  'bg-transparent',
  'bg-transparent',
  'bg-primary/20',
  'bg-foreground/10',
];

function BuildVisual() {
  return (
    <div className={FRAME}>
      <div className='grid flex-1 grid-cols-3 gap-3'>
        {MODULE_TONES.map((tone, index) => (
          <span
            key={`${tone}-${index}`}
            className={cn('hairline-border border-border rounded-lg', tone)}
          />
        ))}
      </div>
      <div className='flex items-center justify-between'>
        <div className='flex -space-x-2'>
          <Avatar seed='Partner' className='ring-background size-7 ring-2' />
          <Avatar
            seed='Studio designer'
            className='ring-background size-7 ring-2'
          />
          <Avatar
            seed='Studio engineer'
            className='ring-background size-7 ring-2'
          />
        </div>
        <span className='bg-foreground/15 h-1.5 w-20 rounded-full' />
      </div>
    </div>
  );
}

const TIMELINE = ['Launch', 'Month 1', 'Month 2', 'Quarter'];

function dotToneOf(isLast: boolean) {
  if (isLast) {
    return 'bg-foreground';
  }
  return 'bg-background border-foreground/50';
}

function HandOverVisual() {
  const lastIndex = TIMELINE.length - 1;

  return (
    <div className={FRAME}>
      <div className='relative flex flex-1 items-center'>
        <span className='bg-foreground/25 absolute inset-x-1 top-1/2 h-px' />
        <div className='relative flex w-full justify-between'>
          {TIMELINE.map((label, index) => (
            <div key={label} className='flex flex-col items-center gap-3'>
              <span
                className={cn(
                  'hairline-border size-3 rounded-full',
                  dotToneOf(index === lastIndex)
                )}
              />
              <span className='text-muted-foreground text-[11px]'>{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className='flex items-center gap-2 text-xs'>
        <KeyIcon className='size-4' />
        <span>Keys, code and files handed over</span>
      </div>
    </div>
  );
}

const VISUALS: Record<ProcessStepId, React.ReactNode> = {
  listen: <ListenVisual />,
  build: <BuildVisual />,
  'hand-over': <HandOverVisual />,
};

export function ProcessVisual({ id }: { id: ProcessStepId }) {
  return <div className='flex w-full justify-center'>{VISUALS[id]}</div>;
}
