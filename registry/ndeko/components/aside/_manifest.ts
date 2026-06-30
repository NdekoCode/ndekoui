import type { ComponentManifest } from '@/registry/ndeko/components/types';

export const manifest: ComponentManifest = [
  {
    name: 'aside-01',
    source: 'ndeko',
    title: 'Task details',
    description:
      'Properties as rows with a status menu and assignee chips, sub-issues you check off and a comment box pinned at the foot',
  },
  {
    name: 'aside-02',
    source: 'ndeko',
    title: 'Member profile',
    description:
      'Presence on the avatar, contact rows, the day split by project in one bar that morphs between today and yesterday',
  },
  {
    name: 'aside-03',
    source: 'ndeko',
    title: 'Filters',
    description:
      'Status, assignee, priority and due date filters with removable chips and a button that counts the matching tasks',
  },
  {
    name: 'aside-04',
    source: 'ndeko',
    title: 'Notification settings',
    description:
      'Events by channel as a grid of switches, a group checkbox for each section, quiet hours and a digest',
  },
  {
    name: 'aside-05',
    source: 'ndeko',
    title: 'Project details',
    description:
      'A read-only project with its properties, progress by status in one bar and members that unfold in place',
  },
  {
    name: 'aside-06',
    source: 'ndeko',
    title: 'Workspace sidebar',
    description:
      'A workspace switcher, navigation with one travelling highlight, a folding projects group and the account menu',
  },
  {
    name: 'aside-07',
    source: 'ndeko',
    title: 'Keyboard shortcuts',
    description:
      'Shortcuts grouped by area, filtered as you type with the match highlighted and rows that fold away',
  },
];
