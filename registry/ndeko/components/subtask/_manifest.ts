import type { ComponentManifest } from '@/registry/ndeko/components/types';

export const manifest: ComponentManifest = [
  {
    name: 'subtask-01',
    source: 'ndeko',
    title: 'Checklist with progress ring',
    description:
      'Sub-tasks you check off, a strike that runs across the title and a ring that fills, then turns into a check',
  },
  {
    name: 'subtask-02',
    source: 'ndeko',
    title: 'Inline add',
    description:
      'A dashed add line where Enter adds the sub-task and keeps the cursor for the next one, and rows that fold away on remove',
  },
  {
    name: 'subtask-03',
    source: 'ndeko',
    title: 'Reorder by drag',
    description:
      'Rows that move by their handle, by its arrow keys or by the up and down buttons, with the new position announced',
  },
  {
    name: 'subtask-04',
    source: 'ndeko',
    title: 'Status and assignees',
    description:
      'Each sub-task with a status menu and an assignee menu, over a bar with one segment per sub-task in its status colour',
  },
  {
    name: 'subtask-05',
    source: 'ndeko',
    title: 'Nested sub-tasks',
    description:
      'Phases that fold over their steps, with a parent box that checks every step and shows when only some are done',
  },
  {
    name: 'subtask-06',
    source: 'ndeko',
    title: 'Collapsed summary',
    description:
      'A one-line "4 of 7 done" with a segment per sub-task that opens into the checklist',
  },
  {
    name: 'subtask-07',
    source: 'ndeko',
    title: 'Convert a note line',
    description:
      'A note line that travels into the sub-task list and takes a task number when you convert it',
  },
  {
    name: 'subtask-08',
    source: 'ndeko',
    title: 'Live list',
    description:
      'A checklist a team writes in at once: new items arrive in their group with the name of who added them, ticked ones settle into Done, and the card keeps its height.',
  },
];
