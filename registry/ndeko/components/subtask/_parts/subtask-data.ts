import type { StatusId } from './subtask-parts';

export type Subtask = {
  id: string;
  number: number;
  title: string;
  status: StatusId;
  assigneeId?: string;
};

export const TEAM_KEY = 'MOS';

export const SUBTASKS: Subtask[] = [
  {
    id: 'mos-215',
    number: 215,
    title: 'Pick the columns finance needs',
    status: 'done',
    assigneeId: 'leo',
  },
  {
    id: 'mos-216',
    number: 216,
    title: 'Write the CSV writer with escaped fields',
    status: 'done',
    assigneeId: 'leo',
  },
  {
    id: 'mos-218',
    number: 218,
    title: 'Add the totals row',
    status: 'in_progress',
    assigneeId: 'leo',
  },
  {
    id: 'mos-219',
    number: 219,
    title: 'Respect the account time zone in dates',
    status: 'in_review',
    assigneeId: 'tomas',
  },
  {
    id: 'mos-220',
    number: 220,
    title: 'Download button on the invoices page',
    status: 'todo',
    assigneeId: 'mei',
  },
  {
    id: 'mos-222',
    number: 222,
    title: 'Test with ten thousand invoices',
    status: 'done',
    assigneeId: 'sana',
  },
  {
    id: 'mos-223',
    number: 223,
    title: 'Note the export in the changelog',
    status: 'backlog',
  },
];

export function keyOf(number: number) {
  return `${TEAM_KEY}-${number}`;
}

export function isDone(subtask: Subtask) {
  return subtask.status === 'done';
}

export function doneCountOf(subtasks: Subtask[]) {
  return subtasks.filter(isDone).length;
}

export function withToggled(subtasks: Subtask[], subtaskId: string) {
  return subtasks.map((subtask) => {
    if (subtask.id !== subtaskId) {
      return subtask;
    }
    return { ...subtask, status: toggledStatusOf(subtask.status) };
  });
}

function toggledStatusOf(status: StatusId): StatusId {
  if (status === 'done') {
    return 'todo';
  }
  return 'done';
}

export function countLabel(count: number, singular: string, plural: string) {
  if (count === 1) {
    return `${count} ${singular}`;
  }
  return `${count} ${plural}`;
}
