'use client';

import {
  LinearModal,
  type LinearModalFeature,
} from '@/components/core/linear-modal';
import {
  BellIcon,
  CalendarCheckIcon,
  ChartLineIcon,
  FilterIcon,
  GitMergeIcon,
  HistoryIcon,
  InboxIcon,
  LayersIcon,
  UsersIcon,
} from '@/registry/ndeko/lib/icons';

const FEATURES: LinearModalFeature[] = [
  {
    id: 'cycles',
    title: 'Cycles',
    summary: 'Two-week rhythms that close on time',
    description:
      'A cycle collects the work your team commits to for the next two weeks. What is not finished rolls into the next one, so nothing is lost and the board starts clean.',
    image: {
      src: '/images/scenes/scene-01.svg',
      alt: 'Flat illustration of indigo hills under a yellow sun',
    },
    points: [
      {
        title: 'Automatic roll-over',
        description: 'Unfinished issues move to the next cycle at midnight',
        icon: HistoryIcon,
      },
      {
        title: 'Cooldown weeks',
        description: 'Leave a gap between cycles for fixes and planning',
        icon: CalendarCheckIcon,
      },
    ],
  },
  {
    id: 'triage',
    title: 'Triage',
    summary: 'One inbox for every new report',
    description:
      'Bug reports, requests from support and ideas from the team land in one queue. Someone on rotation accepts, merges or declines each one before it reaches a cycle.',
    image: {
      src: '/images/scenes/scene-03.svg',
      alt: 'Flat illustration of warm hills under a coral sun',
    },
    points: [
      {
        title: 'Shared queue',
        description: 'Reports from every channel arrive in the same list',
        icon: InboxIcon,
      },
      {
        title: 'Duplicate merging',
        description: 'Fold a report into an existing issue and keep its votes',
        icon: GitMergeIcon,
      },
      {
        title: 'Rotation',
        description: 'A weekly owner, with a reminder the day before',
        icon: BellIcon,
      },
    ],
  },
  {
    id: 'roadmaps',
    title: 'Roadmaps',
    summary: 'Projects on one timeline',
    description:
      'Line up projects by quarter and see which ones share people. Dragging a project changes its dates everywhere it appears.',
    image: {
      src: '/images/scenes/scene-05.svg',
      alt: 'Flat illustration of pink hills under a soft sun',
    },
    points: [
      {
        title: 'Shared people',
        description: 'Spot two projects that count on the same designer',
        icon: UsersIcon,
      },
      {
        title: 'Grouped by initiative',
        description: 'Fold projects under the goal they serve',
        icon: LayersIcon,
      },
    ],
  },
  {
    id: 'insights',
    title: 'Insights',
    summary: 'Charts built from your own issues',
    description:
      'Ask how long bugs stay open or how much of each cycle goes to unplanned work. Every chart can be filtered and saved to a team page.',
    image: {
      src: '/images/scenes/scene-08.svg',
      alt: 'Flat illustration of blue hills under a yellow sun',
    },
    points: [
      {
        title: 'Cycle time',
        description: 'From started to done, by team and by label',
        icon: ChartLineIcon,
      },
      {
        title: 'Saved filters',
        description: 'Keep a view and share it with a link',
        icon: FilterIcon,
      },
    ],
  },
];

export function LinearModalFeatures() {
  return <LinearModal features={FEATURES} className='w-full max-w-2xl' />;
}
