'use client';

import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';

import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';

import type { Story } from './data';

export function tabIdOf(base: string, storyId: string) {
  return `${base}-tab-${storyId}`;
}

type Progress = 'past' | 'current' | 'ahead';

function progressOf(index: number, activeIndex: number): Progress {
  if (index === activeIndex) {
    return 'current';
  }
  if (index < activeIndex) {
    return 'past';
  }
  return 'ahead';
}

const FILL_CLASS: Record<Progress, string> = {
  past: 'scale-x-100 bg-foreground/30',
  current: 'scale-x-100 bg-primary',
  ahead: 'scale-x-0 bg-foreground/30',
};

function isStoryId(value: unknown, stories: readonly Story[]) {
  return stories.some((story) => story.id === value);
}

type PersonTabsProps = {
  stories: readonly Story[];
  activeId: string;
  tabIdBase: string;
  panelId: string;
  onPick: (storyId: string) => void;
  className?: string;
};

export function PersonTabs({
  stories,
  activeId,
  tabIdBase,
  panelId,
  onPick,
  className,
}: PersonTabsProps) {
  const activeIndex = stories.findIndex((story) => story.id === activeId);

  function pickTab(value: unknown) {
    if (isStoryId(value, stories)) {
      onPick(String(value));
    }
  }

  return (
    <TabsPrimitive.Root
      value={activeId}
      onValueChange={pickTab}
      className={className}
    >
      <TabsPrimitive.List
        activateOnFocus
        aria-label='Choose a customer'
        className='grid grid-cols-4 gap-2'
      >
        {stories.map((story, index) => {
          const { person } = story;
          const progress = progressOf(index, activeIndex);

          return (
            <TabsPrimitive.Tab
              key={story.id}
              value={story.id}
              id={tabIdOf(tabIdBase, story.id)}
              aria-controls={panelId}
              aria-label={`${person.name}, ${person.company}`}
              className='group/tab focus-visible:ring-ring/25 flex min-w-0 cursor-pointer flex-col gap-2.5 rounded-lg px-1 pt-1 pb-0.5 text-start outline-none focus-visible:ring-[3px]'
            >
              <span className='flex min-w-0 items-center gap-2'>
                <Avatar seed={person.name} className='size-6' />
                <span className='text-muted-foreground group-hover/tab:text-foreground group-data-active/tab:text-foreground hidden truncate text-[13px] font-medium transition-colors duration-150 @xl:block'>
                  {person.name}
                </span>
              </span>
              <span className='bg-foreground/10 relative h-0.5 overflow-hidden rounded-full'>
                <span
                  className={cn(
                    'absolute inset-0 origin-left rounded-full transition-[scale,background-color] duration-300 ease-(--ease-out-strong)',
                    FILL_CLASS[progress]
                  )}
                />
              </span>
            </TabsPrimitive.Tab>
          );
        })}
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  );
}
