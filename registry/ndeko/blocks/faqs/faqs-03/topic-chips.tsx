'use client';

import { MotionNumber } from '@/components/core/motion-number';
import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { ToggleGroup, ToggleGroupItem } from '@/registry/ndeko/ui/toggle-group';

import { TOPICS, type TopicFilter } from './data';

const THUMB =
  'bg-card shadow-[0_1px_2px_rgb(0_0_0/0.08)] hairline-ring ring-foreground/10 dark:bg-foreground/[0.09] dark:ring-foreground/15';

function topicOf(value: unknown) {
  const topic = TOPICS.find((candidate) => candidate.id === value);
  return topic?.id;
}

function emptyDimOf(count: number) {
  if (count === 0) {
    return 'opacity-50';
  }
  return undefined;
}

type TopicChipsProps = {
  topic: TopicFilter;
  counts: Record<string, number>;
  pressed: string | null;
  onPick: (topic: TopicFilter) => void;
};

export function TopicChips({
  topic,
  counts,
  pressed,
  onPick,
}: TopicChipsProps) {
  const pressedValues = [topic];

  function changeTopic(nextValues: unknown[]) {
    const [next] = nextValues;
    const picked = topicOf(next);
    if (picked) {
      onPick(picked);
    }
  }

  return (
    <div className='relative -mx-4 overflow-x-auto px-4 @2xl:mx-0 @2xl:px-0'>
      <ToggleGroup
        aria-label='Topics'
        value={pressedValues}
        onValueChange={changeTopic}
        travel
        size='sm'
        indicatorClassName={THUMB}
        className='bg-foreground/[0.05] rounded-lg p-0.5'
      >
        {TOPICS.map((item) => (
          <ToggleGroupItem
            key={item.id}
            value={item.id}
            className={cn(
              'h-7 gap-1.5 rounded-md px-2.5 text-xs',
              pressedQuietOf(pressed === `topic-${item.id}`)
            )}
          >
            {item.label}
            <MotionNumber
              value={counts[item.id]}
              className={cn(
                'text-muted-foreground',
                emptyDimOf(counts[item.id])
              )}
            />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
