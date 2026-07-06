'use client';

import { AnimatePresence, motion } from 'motion/react';

import { MotionNumber } from '@/components/core/motion-number';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { DrawnCheck } from '@/registry/ndeko/ui/drawn-check';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';

import { WAITING, type Waiting, type WaitingId } from './data';

function toneOf(isDone: boolean) {
  if (isDone) {
    return 'opacity-60';
  }
  return undefined;
}

function waitingVariantOf(waiting: number) {
  if (waiting === 0) {
    return 'secondary';
  }
  return 'warning';
}

function stateKeyOf(isDone: boolean) {
  if (isDone) {
    return 'done';
  }
  return 'open';
}

type RowProps = {
  waiting: Waiting;
  isDone: boolean;
  pressed: string | null;
  onAct: (id: WaitingId) => void;
};

function WaitingRow({ waiting, isDone, pressed, onAct }: RowProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const presence = rowPresenceOf(shouldReduceMotion);
  const isPressed = pressed === `act-${waiting.id}`;

  return (
    <motion.li className='overflow-hidden' {...presence}>
      <div className='grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 px-1 py-2.5 @md:grid-cols-[auto_minmax(0,1fr)_auto]'>
        <MeshTile
          seed={waiting.agent}
          color={seriesColorOf(waiting.series)}
          size='lg'
        />
        <div
          className={cn(
            'flex min-w-0 flex-1 flex-col gap-0.5 transition-opacity duration-200',
            toneOf(isDone)
          )}
        >
          <p className='flex items-baseline gap-2 text-[13px] font-medium'>
            {waiting.agent}
            <span className='text-muted-foreground text-xs font-normal tabular-nums'>
              {waiting.waited}
            </span>
          </p>
          <p className='text-muted-foreground text-xs text-pretty'>
            {waiting.ask}
          </p>
        </div>
        <Swap
          swapKey={stateKeyOf(isDone)}
          className='col-start-2 justify-self-start @md:col-start-auto @md:justify-self-end'
        >
          {!isDone && (
            <Button
              type='button'
              size='sm'
              variant='outline'
              onClick={() => onAct(waiting.id)}
              className={pressedQuietOf(isPressed)}
            >
              {waiting.action}
            </Button>
          )}
          {isDone && (
            <span className='text-success-foreground flex items-center gap-1.5 text-xs font-medium'>
              <DrawnCheck tone='success' entrance='draw' />
              {waiting.done}
            </span>
          )}
        </Swap>
      </div>
    </motion.li>
  );
}

type NeedsYouProps = {
  arrived: number;
  resolved: WaitingId[];
  waiting: number;
  pressed: string | null;
  onAct: (id: WaitingId) => void;
};

export function NeedsYou({
  arrived,
  resolved,
  waiting,
  pressed,
  onAct,
}: NeedsYouProps) {
  const rows = WAITING.slice(0, arrived);
  const isNobodyWaiting = waiting === 0;

  return (
    <section
      aria-label='Agents that need you'
      className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] flex flex-col gap-2 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] @2xl:p-5'
    >
      <header className='flex items-center justify-between gap-3'>
        <h2 className='text-sm font-medium'>Needs you</h2>
        <Badge variant={waitingVariantOf(waiting)}>
          <MotionNumber value={waiting} />
          waiting
        </Badge>
      </header>
      <ul className='flex flex-col'>
        <AnimatePresence initial={false}>
          {rows.map((row) => (
            <WaitingRow
              key={row.id}
              waiting={row}
              isDone={resolved.includes(row.id)}
              pressed={pressed}
              onAct={onAct}
            />
          ))}
        </AnimatePresence>
      </ul>
      {isNobodyWaiting && (
        <p className='text-muted-foreground py-6 text-center text-[13px]'>
          Nothing is waiting on you
        </p>
      )}
    </section>
  );
}
