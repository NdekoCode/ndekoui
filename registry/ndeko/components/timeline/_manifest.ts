import type { ComponentManifest } from '@/registry/ndeko/components/types';

export const manifest: ComponentManifest = [
  {
    name: 'timeline-01',
    source: 'comp-530',
    title: 'Milestone timeline',
    description: 'Milestone titles on a vertical line, the first three done.',
  },
  {
    name: 'timeline-02',
    source: 'ndeko',
    title: 'Dates on the side',
    description:
      'Dates sit above each title and move to a column on the left when the piece is wide enough.',
  },
  {
    name: 'timeline-03',
    source: 'ndeko',
    title: 'Timeline with dates',
    description:
      'A date above each title and description, and each step says whether it is done, in progress or to come.',
  },
  {
    name: 'timeline-04',
    source: 'ndeko',
    title: 'Pull request timeline',
    description:
      'Review steps with how long ago each one happened under its description, and the exact time on hover.',
  },
  {
    name: 'timeline-05',
    source: 'ndeko',
    title: 'Checked timeline',
    description:
      'Marking the next step done draws its check in a filled circle, fills the line to it and rolls the count.',
  },
  {
    name: 'timeline-06',
    source: 'ndeko',
    title: 'Timeline with icons',
    description:
      'Each event has its own icon in a circle that fills once the event is done.',
  },
  {
    name: 'timeline-07',
    source: 'ndeko',
    title: 'Comment timeline',
    description:
      'Avatars on the line and each comment in a soft bubble with its time.',
  },
  {
    name: 'timeline-08',
    source: 'comp-537',
    title: 'Alternating timeline',
    description: 'Milestones on both sides of a centred line.',
  },
  {
    name: 'timeline-09',
    source: 'ndeko',
    title: 'Event log',
    description:
      'System events in one card, each with a status dot and its date and time.',
  },
  {
    name: 'timeline-10',
    source: 'comp-539',
    title: 'Activity feed',
    description: 'Who did what and how long ago, with an icon per action.',
  },
  {
    name: 'timeline-11',
    source: 'ndeko',
    title: 'Horizontal timeline',
    description:
      'Milestones along a horizontal line that stacks into a vertical list when the piece gets narrow.',
  },
  {
    name: 'timeline-12',
    source: 'ndeko',
    title: 'Horizontal timeline, dates above',
    description:
      'Dates above the line, titles and descriptions below it, stacking into a vertical list when the piece gets narrow.',
  },
];
