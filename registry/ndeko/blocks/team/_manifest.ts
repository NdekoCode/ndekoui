import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'team-01',
    title: 'Member cards on one grid',
    description:
      'The column labels and every member card share one grid: presence, current task with its status, time today, estimate and a total that opens the day.',
    files: [
      'index.tsx',
      'member-card.tsx',
      'member-parts.tsx',
      'estimate-field.tsx',
      'invitation-row.tsx',
      'invite-popover.tsx',
      'data.ts',
    ],
    previewHeight: 820,
  },
  {
    name: 'team-02',
    title: 'Member table',
    description:
      'The same members and columns as one table surface, sortable by name and by time, with pending invitations at the end.',
    files: [
      'index.tsx',
      'member-row.tsx',
      'member-parts.tsx',
      'estimate-field.tsx',
      'invitation-row.tsx',
      'invite-popover.tsx',
      'data.ts',
    ],
    previewHeight: 720,
  },
  {
    name: 'team-03',
    title: 'Invite flow',
    description:
      'A sheet with Invite and Invited tabs that turns addresses into chips, beside the list of pending invitations it keeps up to date.',
    files: [
      'index.tsx',
      'invite-sheet.tsx',
      'email-chips-field.tsx',
      'invitation-list.tsx',
      'data.ts',
    ],
    previewHeight: 760,
  },
  {
    name: 'team-04',
    title: 'Team overview',
    description:
      'A team page with its figures for this week or last, the members with their current task and hours, and the activity of the person picked.',
    files: [
      'index.tsx',
      'member-list.tsx',
      'activity-feed.tsx',
      'parts.tsx',
      'data.ts',
    ],
    previewHeight: 820,
  },
];
