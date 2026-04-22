import {
  BOARD_ORDER,
  STATUS_ICONS,
  type IssueTypeId,
  type PriorityId,
  type Size,
  type StatusId,
  type Task,
} from './data';
import { patchedTask } from './task-edits';
import { statusOf, taskKeyOf } from './task-model';

export type LaneId = StatusId;

export type Columns = Record<LaneId, string[]>;

export type LaneMeta = ReturnType<typeof laneMetaOf>;

export type BoardCard = {
  id: string;
  number: string;
  title: string;
  type: IssueTypeId;
  priority: PriorityId;
  size: Size | null;
  labelIds: string[];
  assigneeIds: string[];
  estimateMinutes: number;
  workedMinutes: number;
  isTracked: boolean;
};

function laneMetaOf(id: LaneId) {
  const status = statusOf(id);
  return {
    id,
    label: status.name,
    color: status.color,
    icon: STATUS_ICONS[id],
  };
}

export const LANES = BOARD_ORDER.map(laneMetaOf);

function workedMinutesOf(task: Task) {
  let total = 0;
  for (const entry of task.worked) {
    total += entry.minutes;
  }
  return total;
}

function cardOf(task: Task): BoardCard {
  return {
    id: task.id,
    number: taskKeyOf(task),
    title: task.title,
    type: task.type,
    priority: task.priority,
    size: task.size ?? null,
    labelIds: task.labelIds,
    assigneeIds: task.assigneeIds,
    estimateMinutes: task.estimateMinutes ?? 0,
    workedMinutes: workedMinutesOf(task),
    isTracked: Boolean(task.trackedById),
  };
}

export function cardsOf(tasks: Task[]) {
  const cards: Record<string, BoardCard> = {};
  for (const task of tasks) {
    cards[task.id] = cardOf(task);
  }
  return cards;
}

export function columnsOf(tasks: Task[]): Columns {
  const columns: Columns = {
    backlog: [],
    todo: [],
    in_progress: [],
    in_review: [],
    done: [],
  };
  for (const task of tasks) {
    columns[task.status].push(task.id);
  }
  return columns;
}

function movedTask(task: Task, status: StatusId) {
  if (task.status === status) {
    return task;
  }
  return patchedTask(task, { status });
}

/** The board order becomes the order of the tasks, and each lane the status of its cards. */
export function tasksInColumnsOf(tasks: Task[], columns: Columns) {
  const remaining = new Map(tasks.map((task) => [task.id, task]));
  const placed: Task[] = [];
  for (const laneId of BOARD_ORDER) {
    for (const taskId of columns[laneId]) {
      const task = remaining.get(taskId);
      if (!task) {
        continue;
      }
      placed.push(movedTask(task, laneId));
      remaining.delete(taskId);
    }
  }
  const unplaced = [...remaining.values()];
  return [...placed, ...unplaced];
}
