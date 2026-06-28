'use client';
import { useRef } from 'react';
import {
  TimelineAnimation,
  TimelineAnimationItem,
} from '@/components/core/timeline-animation';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';

type Entry = {
  date: string;
  title: string;
  author: { name: string; initials: string; avatar: string };
  changes: string[];
};

const ENTRIES: Entry[] = [
  {
    date: 'Oct 28',
    title: 'Faster sync on large notebooks',
    author: {
      name: 'Léa Martin',
      initials: 'LM',
      avatar: '/avatars/avatar-03.svg',
    },
    changes: [
      'Notebooks with more than 5,000 notes open in under a second',
      'Sync resumes where it stopped after a lost connection',
    ],
  },
  {
    date: 'Oct 14',
    title: 'Templates for meeting notes',
    author: {
      name: 'Kofi Mensah',
      initials: 'KM',
      avatar: '/avatars/avatar-04.svg',
    },
    changes: [
      'Agenda, decisions and follow-ups in one template',
      'Attendees are filled in from the calendar event',
    ],
  },
  {
    date: 'Sep 30',
    title: 'Keyboard shortcuts you can change',
    author: {
      name: 'Ana Duarte',
      initials: 'AD',
      avatar: '/avatars/avatar-05.svg',
    },
    changes: [
      'Every command can take a shortcut of your choice',
      'Conflicts are shown before you save',
      'Shortcuts sync between the desktop and the web',
    ],
  },
  {
    date: 'Sep 12',
    title: 'Dark mode for printed notes',
    author: {
      name: 'Tomás Reyes',
      initials: 'TR',
      avatar: '/avatars/avatar-06.svg',
    },
    changes: ['Exports keep light colours, whatever the theme on screen'],
  },
];

export function TimelineAnimationChangelog() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className='relative h-[460px] w-full overflow-y-auto rounded-xl px-6 sm:px-10'
    >
      <div className='flex h-[180px] flex-col justify-end gap-1 pb-8'>
        <h2 className='text-foreground text-base font-semibold text-balance'>
          Changelog
        </h2>
        <p className='text-muted-foreground text-[13px]'>
          What shipped in Quillnote this autumn
        </p>
      </div>
      <TimelineAnimation containerRef={containerRef} className='max-w-md'>
        {ENTRIES.map((entry) => (
          <TimelineAnimationItem key={entry.title} className='pb-12'>
            <span className='text-muted-foreground text-xs tabular-nums'>
              {entry.date}
            </span>
            <h3 className='text-foreground mt-1 text-sm font-medium'>
              {entry.title}
            </h3>
            <ul className='text-muted-foreground mt-2 flex list-disc flex-col gap-1 ps-4 text-[13px]'>
              {entry.changes.map((change) => (
                <li key={change}>{change}</li>
              ))}
            </ul>
            <div className='mt-3 flex items-center gap-2'>
              <Avatar className='size-5'>
                <AvatarImage src={entry.author.avatar} alt='' />
                <AvatarFallback className='text-[10px]'>
                  {entry.author.initials}
                </AvatarFallback>
              </Avatar>
              <span className='text-muted-foreground text-xs'>
                {entry.author.name}
              </span>
            </div>
          </TimelineAnimationItem>
        ))}
      </TimelineAnimation>
      <div className='h-[240px]' />
    </div>
  );
}
