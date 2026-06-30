import type { ComponentManifest } from '@/registry/ndeko/components/types';

export const manifest: ComponentManifest = [
  {
    name: 'activity-01',
    source: 'ndeko',
    title: 'Task history',
    description:
      'Every change to a task with its old and new value, and a time that switches to the exact date on click',
  },
  {
    name: 'activity-02',
    source: 'ndeko',
    title: 'Feed by day with filters',
    description:
      'Activity grouped under Today and Yesterday, with kind filters that fold rows away and an empty state',
  },
  {
    name: 'activity-03',
    source: 'ndeko',
    title: 'Compact side feed',
    description:
      'One-line entries for a narrow panel that open in place to show what changed',
  },
  {
    name: 'activity-04',
    source: 'ndeko',
    title: 'Team activity stream',
    description:
      'Who worked on what with the time spent, a timer glyph on each avatar and a range switch that rescales the bars',
  },
  {
    name: 'activity-05',
    source: 'ndeko',
    title: 'Live feed',
    description:
      'New updates wait behind a count pill and slide in at the top when you ask for them',
  },
  {
    name: 'activity-06',
    source: 'ndeko',
    title: 'Folded runs of changes',
    description:
      'Changes one person made in a row fold under their name behind a "more changes" button',
  },
  {
    name: 'activity-07',
    source: 'ndeko',
    title: 'Mentions with quotes',
    description:
      'Mentions and replies with the quoted comment cut at two lines, opened in place when it runs longer',
  },
];
