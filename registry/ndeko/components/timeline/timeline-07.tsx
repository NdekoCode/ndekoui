import { Avatar } from '@/registry/ndeko/ui/avatar';
import {
  Timeline,
  TimelineContent,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from '@/registry/ndeko/ui/timeline';

import { AgoTime } from './_parts/ago-time';
import { MARKER, MARKER_RAIL, MARKER_ROW } from './_parts/markers';

type Remark = {
  author: string;
  action: string;
  text: string;
  at: string;
};

const REVIEW_THREAD: Remark[] = [
  {
    author: 'Noor Rahimi',
    action: 'shared round two',
    text: 'Three label options for the cocoa tin. Option B keeps the oat stalk from the old pack.',
    at: '2026-11-12T11:55:00',
  },
  {
    author: 'Tobias Lindqvist',
    action: 'left a note',
    text: 'B reads best from the shelf. The weight line gets hard to read under 40 mm though.',
    at: '2026-11-12T13:10:00',
  },
  {
    author: 'Wanjiru Kamau',
    action: 'asked you to check it',
    text: 'Can you look at the clear zone around the barcode before Thursday?',
    at: '2026-11-12T14:15:00',
  },
  {
    author: 'Idris Okoye',
    action: 'approved option B',
    text: 'Approved with the larger weight line. It goes to the printer tonight.',
    at: '2026-11-12T14:50:00',
  },
];

const ROW = [
  MARKER_ROW,
  'group-data-[orientation=vertical]/timeline:not-last:pb-8',
].join(' ');

const PORTRAIT_FRAME = [MARKER, 'border-none bg-transparent'].join(' ');

export default function Timeline07() {
  return (
    <Timeline
      role='list'
      aria-label='Review of the Oatfield label'
      className='w-full max-w-md [--marker:1.5rem]'
    >
      {REVIEW_THREAD.map((remark, index) => {
        const step = index + 1;

        return (
          <TimelineItem
            key={remark.at}
            step={step}
            role='listitem'
            className={ROW}
          >
            <TimelineHeader>
              <TimelineIndicator className={PORTRAIT_FRAME}>
                <Avatar seed={remark.author} className='size-(--marker)' />
              </TimelineIndicator>
              <TimelineSeparator className={MARKER_RAIL} />
              <TimelineTitle className='mt-0.5'>
                {remark.author}{' '}
                <span className='text-muted-foreground font-normal'>
                  {remark.action}
                </span>
              </TimelineTitle>
            </TimelineHeader>
            <TimelineContent className='bg-foreground/[0.04] text-foreground mt-2 rounded-xl px-3 py-2.5'>
              {remark.text}
              <AgoTime at={remark.at} className='mt-1' />
            </TimelineContent>
          </TimelineItem>
        );
      })}
    </Timeline>
  );
}
