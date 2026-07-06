'use client';

import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';

import type { Member } from './data';

export function tabIdOf(base: string, memberId: string) {
  return `${base}-tab-${memberId}`;
}

const SPOTLIGHT =
  'bg-card hairline-ring ring-border dark:bg-foreground/[0.07] pointer-events-none absolute top-0 left-0 h-(--active-tab-height) w-(--active-tab-width) translate-x-(--active-tab-left) translate-y-(--active-tab-top) rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.06),0_4px_12px_-4px_rgb(0_0_0/0.08)]';

function travelOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return 'transition-none';
  }
  return 'transition-[translate,width,height] duration-300 ease-(--ease-out-strong)';
}

function isMemberId(value: unknown, members: readonly Member[]) {
  return members.some((member) => member.id === value);
}

type PeoplePickerProps = {
  members: readonly Member[];
  activeId: string;
  pressedId: string | null;
  tabIdBase: string;
  panelId: string;
  onPick: (memberId: string) => void;
};

export function PeoplePicker({
  members,
  activeId,
  pressedId,
  tabIdBase,
  panelId,
  onPick,
}: PeoplePickerProps) {
  const shouldReduceMotion = usePrefersReducedMotion();

  function pickTab(value: unknown) {
    if (isMemberId(value, members)) {
      onPick(String(value));
    }
  }

  return (
    <TabsPrimitive.Root value={activeId} onValueChange={pickTab}>
      <TabsPrimitive.List
        activateOnFocus
        aria-label='Pick a person'
        className='relative isolate flex flex-wrap gap-1'
      >
        {members.map((member) => (
          <TabsPrimitive.Tab
            key={member.id}
            value={member.id}
            id={tabIdOf(tabIdBase, member.id)}
            aria-controls={panelId}
            aria-label={`${member.name}, ${member.role}`}
            className={cn(
              'group/person hover:bg-foreground/[0.03] focus-visible:ring-ring/25 flex min-w-0 cursor-pointer items-center gap-3 rounded-xl p-2 text-start transition-[background-color,scale] duration-150 ease-(--ease-out-strong) outline-none focus-visible:ring-[3px] data-active:hover:bg-transparent @3xl:pe-4',
              pressedQuietOf(pressedId === member.id)
            )}
          >
            <Avatar seed={member.name} className='size-10' />
            <span className='hidden min-w-0 flex-col @3xl:flex'>
              <span className='text-muted-foreground group-data-active/person:text-foreground truncate text-[13px] font-medium transition-colors duration-150'>
                {member.name}
              </span>
              <span className='text-muted-foreground hidden truncate text-xs @5xl:block'>
                {member.role}
              </span>
            </span>
          </TabsPrimitive.Tab>
        ))}
        <TabsPrimitive.Indicator
          className={cn('-z-10', SPOTLIGHT, travelOf(shouldReduceMotion))}
        />
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  );
}
