import type { CSSProperties } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';

import { HERO, VISIBLE_COUNT } from './data';
import type { Stack } from './stack';

type SlotStyle = CSSProperties & { '--slot': number };

function slotStyleOf(slot: number) {
  const style: SlotStyle = { '--slot': slot };
  return style;
}

/** The newest avatar slides in from beside the stack; the first ones are simply there. */
function arrivalClassOf(isNewest: boolean, hasJoined: boolean) {
  const isArriving = isNewest && hasJoined;
  if (isArriving) {
    return 'starting:opacity-0 starting:translate-x-[calc((var(--slot)_-_1)*1.5rem)]';
  }
  return undefined;
}

function tuckClassOf(isTucked: boolean) {
  if (isTucked) {
    return 'opacity-0';
  }
  return 'opacity-100';
}

type AvatarStackProps = {
  stack: Stack;
  hasJoined: boolean;
};

/**
 * Avatars overlap in slots. Each one reads its slot from a custom property and its position
 * follows it with a transition, so a new member shifts the others along without any layout work.
 */
export function AvatarStack({ stack, hasJoined }: AvatarStackProps) {
  return (
    <div className='flex items-center gap-3'>
      <div className='flex items-center'>
        <div aria-hidden='true' className='relative h-9 w-24 shrink-0'>
          {stack.members.map((member, slot) => (
            <Avatar
              key={member.id}
              seed={member.name}
              style={slotStyleOf(slot)}
              className={cn(
                'outline-background absolute top-0 left-0 size-9 translate-x-[calc(var(--slot)*1.5rem)] outline-2 transition-[translate,opacity] duration-500 ease-(--ease-out-strong) motion-reduce:transition-none',
                tuckClassOf(slot >= VISIBLE_COUNT),
                arrivalClassOf(slot === 0, hasJoined)
              )}
            />
          ))}
        </div>
        <span className='bg-card hairline-ring ring-border outline-background relative z-10 inline-flex h-9 items-center rounded-full px-3 text-[13px] font-medium outline-2'>
          <MotionNumber value={stack.count} className='tabular-nums' />
        </span>
      </div>
      <div className='flex flex-col items-start text-start'>
        <p className='text-[13px]'>{HERO.countCaption}</p>
        <p className='text-muted-foreground text-xs'>{HERO.countNote}</p>
      </div>
    </div>
  );
}
