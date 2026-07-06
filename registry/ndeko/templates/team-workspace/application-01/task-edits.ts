import { format } from 'date-fns';

import {
  CURRENT_USER_ID,
  TODAY,
  type FeedChange,
  type FeedComment,
  type StatusId,
  type Task,
} from './data';
import { statusOf } from './task-model';

function nowStamp() {
  const time = format(new Date(), 'HH:mm:ss');
  return `${TODAY}T${time}`;
}

function localIdOf(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

function statusChangeOf(from: StatusId, to: StatusId): FeedChange {
  const fromName = statusOf(from).name;
  const toName = statusOf(to).name;
  return {
    kind: 'change',
    id: localIdOf('change'),
    authorId: CURRENT_USER_ID,
    at: nowStamp(),
    change: 'status',
    text: `moved it from ${fromName} to ${toName}`,
  };
}

export function patchedTask(task: Task, patch: Partial<Task>): Task {
  const next = { ...task, ...patch, updatedAt: nowStamp() };
  const nextStatus = patch.status;
  if (!nextStatus) {
    return next;
  }
  if (nextStatus === task.status) {
    return next;
  }
  const change = statusChangeOf(task.status, nextStatus);
  return { ...next, feed: [...task.feed, change] };
}

export function newTaskOf(
  number: number,
  status: StatusId,
  title: string,
  assigneeIds: string[]
): Task {
  const stamp = nowStamp();
  const created: FeedChange = {
    kind: 'change',
    id: localIdOf('created'),
    authorId: CURRENT_USER_ID,
    at: stamp,
    change: 'created',
    text: 'created the task',
  };
  return {
    id: `mos-${number}`,
    number,
    title,
    type: 'task',
    status,
    priority: 'none',
    labelIds: [],
    assigneeIds,
    createdAt: stamp,
    updatedAt: stamp,
    reporterId: CURRENT_USER_ID,
    description: [],
    children: [],
    feed: [created],
    worked: [],
  };
}

export function commentOf(body: string): FeedComment {
  return {
    kind: 'comment',
    id: localIdOf('comment'),
    authorId: CURRENT_USER_ID,
    at: nowStamp(),
    body,
  };
}

export function withComment(task: Task, comment: FeedComment) {
  return { ...task, feed: [...task.feed, comment], updatedAt: comment.at };
}
