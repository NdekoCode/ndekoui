import type { ComponentType } from 'react';

import Avatar14 from '@/registry/ndeko/components/avatar/avatar-14';
import CalendarDatePicker02 from '@/registry/ndeko/components/calendar-date-picker/calendar-date-picker-02';
import Checkbox06 from '@/registry/ndeko/components/checkbox/checkbox-06';
import Checkbox14 from '@/registry/ndeko/components/checkbox/checkbox-14';
import FileUpload08 from '@/registry/ndeko/components/file-upload/file-upload-08';
import Notification04 from '@/registry/ndeko/components/notification/notification-04';
import Notification09 from '@/registry/ndeko/components/notification/notification-09';
import Notification13 from '@/registry/ndeko/components/notification/notification-13';
import Radio08 from '@/registry/ndeko/components/radio/radio-08';
import Radio14 from '@/registry/ndeko/components/radio/radio-14';
import Slider13 from '@/registry/ndeko/components/slider/slider-13';
import Slider26 from '@/registry/ndeko/components/slider/slider-26';
import Tabs01 from '@/registry/ndeko/components/tabs/tabs-01';
import Timeline06 from '@/registry/ndeko/components/timeline/timeline-06';
import Timeline07 from '@/registry/ndeko/components/timeline/timeline-07';
import Tree03 from '@/registry/ndeko/components/tree/tree-03';
import { cn } from '@/registry/ndeko/lib/utils';

type WallColumn = {
  items: ComponentType[];
  duration: string;
  isReversed: boolean;
  visibility: string;
};

const COLUMNS: WallColumn[] = [
  {
    items: [CalendarDatePicker02, Notification13, Avatar14, Checkbox06],
    duration: '[--marquee-duration:70s]',
    isReversed: false,
    visibility: 'flex',
  },
  {
    items: [Timeline06, Radio08, Slider26, Notification09],
    duration: '[--marquee-duration:85s]',
    isReversed: true,
    visibility: 'hidden sm:flex',
  },
  {
    items: [Tree03, Tabs01, Checkbox14, FileUpload08],
    duration: '[--marquee-duration:75s]',
    isReversed: false,
    visibility: 'hidden md:flex',
  },
  {
    items: [Radio14, Timeline07, Notification04, Slider13],
    duration: '[--marquee-duration:90s]',
    isReversed: true,
    visibility: 'hidden lg:flex',
  },
];

function directionOf(isReversed: boolean) {
  if (isReversed) {
    return '[animation-direction:reverse]';
  }
  return '';
}

function WallTile({ Item }: { Item: ComponentType }) {
  return (
    <div className='pb-4'>
      <div className='bg-card hairline-ring ring-border flex min-h-32 items-center justify-center rounded-2xl p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
        <Item />
      </div>
    </div>
  );
}

function WallColumnView({ column }: { column: WallColumn }) {
  const loop = [...column.items, ...column.items];
  return (
    <div className={cn('min-w-0 flex-1 flex-col', column.visibility)}>
      <div
        className={cn(
          'motion-safe:animate-marquee-y flex flex-col',
          column.duration,
          directionOf(column.isReversed)
        )}
      >
        {loop.map((Item, index) => (
          <WallTile key={index} Item={Item} />
        ))}
      </div>
    </div>
  );
}

/** Live compositions drifting in columns: the catalogue itself, not a picture of it. */
export function LivingWall({ className }: { className?: string }) {
  return (
    <div
      inert
      aria-hidden
      className={cn(
        'bg-foreground/[0.025] relative h-[560px] overflow-hidden rounded-2xl mask-y-from-85% px-4 sm:h-[620px]',
        className
      )}
    >
      <div className='flex gap-4'>
        {COLUMNS.map((column) => (
          <WallColumnView key={column.duration} column={column} />
        ))}
      </div>
    </div>
  );
}
