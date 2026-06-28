'use client';
import { useRef } from 'react';
import {
  TimelineAnimation,
  TimelineAnimationItem,
} from '@/components/core/timeline-animation';
import { Chip } from '@/registry/ndeko/ui/chip';

const RELEASES = [
  {
    version: 'v2.4',
    date: 'October 2026',
    title: 'Shared notebooks',
    text: 'Invite people to a notebook and see where they are typing. Comments stay in the margin.',
  },
  {
    version: 'v2.0',
    date: 'June 2026',
    title: 'A new editor',
    text: 'Tables, checklists and code blocks in the same note. Older notes open exactly as they were.',
  },
  {
    version: 'v1.6',
    date: 'February 2026',
    title: 'Offline first',
    text: 'Notes save on the device and sync when the connection comes back, even after a week.',
  },
  {
    version: 'v1.2',
    date: 'September 2025',
    title: 'Search inside images',
    text: 'The text in photos of whiteboards and receipts can now be searched like any other note.',
  },
  {
    version: 'v1.0',
    date: 'April 2025',
    title: 'First public release',
    text: 'Notebooks, tags and a quick capture window that opens from anywhere on the desktop.',
  },
  {
    version: 'v0.4',
    date: 'November 2024',
    title: 'Private beta',
    text: 'Two hundred people used Quillnote every day for a month and told us what was missing.',
  },
];

function chipColorOf(index: number) {
  if (index === 0) {
    return 'var(--primary)';
  }
  return 'var(--muted-foreground)';
}

export function TimelineAnimationReleases() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className='relative h-[460px] w-full overflow-y-auto rounded-xl px-6 sm:px-10'
    >
      <div className='flex h-[180px] flex-col justify-end gap-1 pb-8'>
        <h2 className='text-foreground text-base font-semibold text-balance'>
          Quillnote release history
        </h2>
        <p className='text-muted-foreground text-[13px]'>
          Two years of notes, newest first
        </p>
      </div>
      <TimelineAnimation containerRef={containerRef} className='max-w-md'>
        {RELEASES.map((release, index) => (
          <TimelineAnimationItem key={release.version}>
            <div className='flex items-center gap-2'>
              <Chip color={chipColorOf(index)} className='tabular-nums'>
                {release.version}
              </Chip>
              <span className='text-muted-foreground text-xs'>
                {release.date}
              </span>
            </div>
            <h3 className='text-foreground mt-2 text-sm font-medium'>
              {release.title}
            </h3>
            <p className='text-muted-foreground mt-1 text-[13px]'>
              {release.text}
            </p>
          </TimelineAnimationItem>
        ))}
      </TimelineAnimation>
      <div className='h-[240px]' />
    </div>
  );
}
