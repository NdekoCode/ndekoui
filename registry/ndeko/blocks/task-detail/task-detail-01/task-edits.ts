import { format } from 'date-fns';

import {
  CURRENT_USER_ID,
  TODAY,
  type FeedChange,
  type FeedComment,
  type StatusId,
  type TaskDetail,
} from './data';
import { statusOf } from './detail-model';

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

export function patchedTask(
  task: TaskDetail,
  patch: Partial<TaskDetail>
): TaskDetail {
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

export function commentOf(body: string): FeedComment {
  return {
    kind: 'comment',
    id: localIdOf('comment'),
    authorId: CURRENT_USER_ID,
    at: nowStamp(),
    body,
  };
}

export function withComment(task: TaskDetail, comment: FeedComment) {
  return { ...task, feed: [...task.feed, comment], updatedAt: comment.at };
}
