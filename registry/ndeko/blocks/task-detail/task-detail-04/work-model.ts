import {
  differenceInCalendarDays,
  differenceInMinutes,
  format,
  parseISO,
} from 'date-fns';

import {
  CURRENT_USER_ID,
  NOW,
  PEOPLE,
  TEAM_KEY,
  type Subtask,
  type TaskComment,
  type WorkEvent,
} from './data';

export type WorkState = {
  subtasks: Subtask[];
  comments: TaskComment[];
  events: WorkEvent[];
};

export type EventDay = {
  key: string;
  label: string;
  events: WorkEvent[];
};

const MINUTES_PER_HOUR = 60;

const FIRST_FREE_NUMBER = 230;

let createdCount = 0;

export function nextSeq() {
  createdCount += 1;
  return createdCount;
}

function nextIdOf(prefix: string) {
  return `${prefix}-${nextSeq()}`;
}

export function personOf(id: string) {
  const found = PEOPLE.find((person) => person.id === id);
  if (found) {
    return found;
  }
  return PEOPLE[0];
}

export function currentUser() {
  return personOf(CURRENT_USER_ID);
}

export function actorNameOf(id: string) {
  if (id === CURRENT_USER_ID) {
    return 'You';
  }
  return personOf(id).name;
}

export function keyOf(number: number) {
  return `${TEAM_KEY}-${number}`;
}

export function countLabel(count: number, singular: string, plural: string) {
  if (count === 1) {
    return `${count} ${singular}`;
  }
  return `${count} ${plural}`;
}

export function doneCountOf(subtasks: Subtask[]) {
  return subtasks.filter((subtask) => subtask.isDone).length;
}

function daysBeforeNow(iso: string) {
  return differenceInCalendarDays(parseISO(NOW), parseISO(iso));
}

export function relativeTimeOf(iso: string) {
  const minutes = differenceInMinutes(parseISO(NOW), parseISO(iso));
  if (minutes < 1) {
    return 'Just now';
  }
  if (minutes < MINUTES_PER_HOUR) {
    return `${minutes}m ago`;
  }
  const days = daysBeforeNow(iso);
  if (days === 0) {
    const hours = Math.floor(minutes / MINUTES_PER_HOUR);
    return `${hours}h ago`;
  }
  if (days === 1) {
    return 'Yesterday';
  }
  return format(parseISO(iso), 'MMM d');
}

export function clockOf(iso: string) {
  return format(parseISO(iso), 'HH:mm');
}

export function dueLabelOf(iso: string) {
  const days = -daysBeforeNow(iso);
  if (days === 0) {
    return 'Due today';
  }
  if (days === 1) {
    return 'Due tomorrow';
  }
  if (days > 1) {
    return `Due in ${days} days`;
  }
  return `${Math.abs(days)} days late`;
}

function dayLabelOf(iso: string) {
  const days = daysBeforeNow(iso);
  if (days === 0) {
    return 'Today';
  }
  if (days === 1) {
    return 'Yesterday';
  }
  return format(parseISO(iso), 'EEEE, MMM d');
}

/** Newest day first, newest event first inside each day. */
export function eventDaysOf(events: WorkEvent[]) {
  const sorted = [...events].sort((first, second) =>
    second.at.localeCompare(first.at)
  );
  const days: EventDay[] = [];
  for (const event of sorted) {
    const key = event.at.slice(0, 10);
    const last = days.at(-1);
    const isSameDay = last?.key === key;
    if (isSameDay) {
      last.events.push(event);
      continue;
    }
    days.push({ key, label: dayLabelOf(event.at), events: [event] });
  }
  return days;
}

function toggleEventOf(subtask: Subtask): WorkEvent {
  let verb = 'reopened';
  if (subtask.isDone) {
    verb = 'completed';
  }
  return {
    id: `toggle-${subtask.id}`,
    kind: 'subtask',
    actorId: CURRENT_USER_ID,
    at: NOW,
    text: `${verb} ${keyOf(subtask.number)} ${subtask.title}`,
    seq: nextSeq(),
  };
}

/** A sub-task checked then unchecked in the same visit leaves one line in the log, not two. */
function withEvent(events: WorkEvent[], event: WorkEvent) {
  const others = events.filter((item) => item.id !== event.id);
  return [...others, event];
}

export function toggledSubtask(state: WorkState, subtaskId: string) {
  const target = state.subtasks.find((subtask) => subtask.id === subtaskId);
  if (!target) {
    return state;
  }
  const toggled: Subtask = { ...target, isDone: !target.isDone };
  const subtasks = state.subtasks.map((subtask) => {
    if (subtask.id !== subtaskId) {
      return subtask;
    }
    return toggled;
  });
  const events = withEvent(state.events, toggleEventOf(toggled));
  const next: WorkState = { ...state, subtasks, events };
  return next;
}

function nextNumberOf(subtasks: Subtask[]) {
  const numbers = subtasks.map((subtask) => subtask.number);
  return Math.max(FIRST_FREE_NUMBER, ...numbers) + 1;
}

export function addedSubtask(state: WorkState, title: string) {
  const number = nextNumberOf(state.subtasks);
  const subtask: Subtask = {
    id: nextIdOf('subtask'),
    number,
    title,
    isDone: false,
  };
  const event: WorkEvent = {
    id: nextIdOf('event'),
    kind: 'subtask',
    actorId: CURRENT_USER_ID,
    at: NOW,
    text: `added ${keyOf(number)} ${title}`,
    seq: nextSeq(),
  };
  const next: WorkState = {
    ...state,
    subtasks: [...state.subtasks, subtask],
    events: [...state.events, event],
  };
  return next;
}

export function postedComment(state: WorkState, body: string) {
  const comment: TaskComment = {
    id: nextIdOf('comment'),
    authorId: CURRENT_USER_ID,
    at: NOW,
    body,
    seq: nextSeq(),
  };
  return withComment(state, comment);
}

export function withComment(state: WorkState, comment: TaskComment) {
  const event: WorkEvent = {
    id: nextIdOf('event'),
    kind: 'comment',
    actorId: comment.authorId,
    at: comment.at,
    text: 'commented',
    seq: comment.seq,
  };
  const next: WorkState = {
    ...state,
    comments: [...state.comments, comment],
    events: [...state.events, event],
  };
  return next;
}

export type Segment = {
  text: string;
  isMention: boolean;
};

const MENTION_TOKENS = PEOPLE.map((person) => `@${person.name}`);

function pushPlain(segments: Segment[], text: string) {
  if (text.length === 0) {
    return;
  }
  segments.push({ text, isMention: false });
}

/** Splits a comment into plain text and mentions of known people, written "@First Last". */
export function segmentsOf(text: string) {
  const segments: Segment[] = [];
  let plain = '';
  let index = 0;
  while (index < text.length) {
    const token = MENTION_TOKENS.find((candidate) =>
      text.startsWith(candidate, index)
    );
    if (token) {
      pushPlain(segments, plain);
      segments.push({ text: token, isMention: true });
      plain = '';
      index += token.length;
      continue;
    }
    plain += text[index];
    index += 1;
  }
  pushPlain(segments, plain);
  return segments;
}
