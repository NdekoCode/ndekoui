import { format, isBefore, parseISO } from 'date-fns';

import {
  ISSUE_TYPES,
  LABELS,
  PEOPLE,
  PRIORITIES,
  STATUSES,
  TEAM_KEY,
  TODAY,
  type IssueTypeId,
  type PriorityId,
  type StatusId,
  type Task,
} from './data';

export type Scope = 'active' | 'done' | 'all';

export type ScopeOption = {
  id: Scope;
  label: string;
  singular: string;
  plural: string;
};

export const SCOPES: ScopeOption[] = [
  {
    id: 'active',
    label: 'Active',
    singular: 'active task',
    plural: 'active tasks',
  },
  {
    id: 'done',
    label: 'Done',
    singular: 'finished task',
    plural: 'finished tasks',
  },
  { id: 'all', label: 'All', singular: 'task', plural: 'tasks' },
];

export const SCOPE_GROUPS: Record<Scope, StatusId[]> = {
  active: ['in_progress', 'in_review', 'todo', 'backlog'],
  done: ['done'],
  all: ['in_progress', 'in_review', 'todo', 'backlog', 'done'],
};

export type FilterKey = 'status' | 'priority' | 'assignee' | 'label' | 'type';

export type Filters = Record<FilterKey, string[]>;

export const EMPTY_FILTERS: Filters = {
  status: [],
  priority: [],
  assignee: [],
  label: [],
  type: [],
};

export const NO_ASSIGNEE = 'none';

export type TaskGroupData = {
  status: StatusId;
  tasks: Task[];
};

function byId<Item extends { id: string }>(items: Item[], id: string): Item {
  const found = items.find((item) => item.id === id);
  if (found) {
    return found;
  }
  return items[0];
}

export function statusOf(id: StatusId) {
  return byId(STATUSES, id);
}

export function priorityOf(id: PriorityId) {
  return byId(PRIORITIES, id);
}

export function issueTypeOf(id: IssueTypeId) {
  return byId(ISSUE_TYPES, id);
}

export function peopleOf(ids: string[]) {
  return PEOPLE.filter((person) => ids.includes(person.id));
}

export function labelsOf(ids: string[]) {
  return LABELS.filter((label) => ids.includes(label.id));
}

export function trackerOf(task: Task) {
  if (!task.trackedById) {
    return undefined;
  }
  return PEOPLE.find((person) => person.id === task.trackedById);
}

export function isStatusId(value: unknown): value is StatusId {
  return STATUSES.some((status) => status.id === value);
}

export function isPriorityId(value: unknown): value is PriorityId {
  return PRIORITIES.some((priority) => priority.id === value);
}

export function isScope(value: unknown): value is Scope {
  return SCOPES.some((scope) => scope.id === value);
}

export function scopeOf(id: Scope) {
  return byId(SCOPES, id);
}

export function taskKeyOf(task: Task) {
  return `${TEAM_KEY}-${task.number}`;
}

export function isInScope(status: StatusId, scope: Scope) {
  if (scope === 'all') {
    return true;
  }
  const isDone = status === 'done';
  if (scope === 'done') {
    return isDone;
  }
  return !isDone;
}

export function matchesSearch(task: Task, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  const title = task.title.toLowerCase();
  const key = taskKeyOf(task).toLowerCase();
  return title.includes(needle) || key.includes(needle);
}

function matchesAny(selected: string[], values: string[]) {
  if (selected.length === 0) {
    return true;
  }
  return values.some((value) => selected.includes(value));
}

export function assigneeValuesOf(task: Task) {
  if (task.assigneeIds.length === 0) {
    return [NO_ASSIGNEE];
  }
  return task.assigneeIds;
}

export function matchesFilters(task: Task, filters: Filters) {
  const checks = [
    matchesAny(filters.status, [task.status]),
    matchesAny(filters.priority, [task.priority]),
    matchesAny(filters.type, [task.type]),
    matchesAny(filters.label, task.labelIds),
    matchesAny(filters.assignee, assigneeValuesOf(task)),
  ];
  return checks.every(Boolean);
}

export function activeFilterCountOf(filters: Filters) {
  let count = 0;
  for (const values of Object.values(filters)) {
    count += values.length;
  }
  return count;
}

export function isFiltering(query: string, filters: Filters) {
  const hasQuery = query.trim().length > 0;
  const hasFilters = activeFilterCountOf(filters) > 0;
  return hasQuery || hasFilters;
}

export function toggledIds<Id extends string>(
  ids: Id[],
  id: Id,
  isIncluded: boolean
): Id[] {
  const withoutId = ids.filter((current) => current !== id);
  if (isIncluded) {
    return [...withoutId, id];
  }
  return withoutId;
}

export function toggledFilters(
  filters: Filters,
  key: FilterKey,
  value: string,
  isIncluded: boolean
): Filters {
  const values = toggledIds(filters[key], value, isIncluded);
  return { ...filters, [key]: values };
}

export function scopeCountsOf(tasks: Task[]): Record<Scope, number> {
  const doneCount = tasks.filter((task) => task.status === 'done').length;
  const activeCount = tasks.length - doneCount;
  return { active: activeCount, done: doneCount, all: tasks.length };
}

export function groupsOf(
  tasks: Task[],
  scope: Scope,
  placementOf: (task: Task) => StatusId,
  draftStatus: StatusId | null
): TaskGroupData[] {
  const groups: TaskGroupData[] = [];
  for (const status of SCOPE_GROUPS[scope]) {
    const groupTasks = tasks.filter((task) => placementOf(task) === status);
    const hasTasks = groupTasks.length > 0;
    const isDrafting = draftStatus === status;
    if (hasTasks || isDrafting) {
      groups.push({ status, tasks: groupTasks });
    }
  }
  return groups;
}

export function patchedTask(
  task: Task,
  taskId: string,
  patch: Partial<Task>
): Task {
  if (task.id !== taskId) {
    return task;
  }
  return { ...task, ...patch };
}

export function nextTaskNumberOf(tasks: Task[]) {
  const numbers = tasks.map((task) => task.number);
  return Math.max(0, ...numbers) + 1;
}

export function dueLabelOf(due: string) {
  return format(parseISO(due), 'MMM d');
}

export function isOverdue(task: Task) {
  if (!task.due) {
    return false;
  }
  if (task.status === 'done') {
    return false;
  }
  return isBefore(parseISO(task.due), parseISO(TODAY));
}

export function countLabel(count: number, singular: string, plural: string) {
  if (count === 1) {
    return `${count} ${singular}`;
  }
  return `${count} ${plural}`;
}

export function peopleSentenceOf(names: string[]) {
  if (names.length === 0) {
    return 'nobody';
  }
  if (names.length === 1) {
    return names[0];
  }
  const head = names.slice(0, -1).join(', ');
  const last = names[names.length - 1];
  return `${head} and ${last}`;
}

export function rangeBetween(ids: string[], fromId: string, toId: string) {
  const fromIndex = ids.indexOf(fromId);
  const toIndex = ids.indexOf(toId);
  const isMissing = fromIndex === -1 || toIndex === -1;
  if (isMissing) {
    return [toId];
  }
  const start = Math.min(fromIndex, toIndex);
  const end = Math.max(fromIndex, toIndex);
  return ids.slice(start, end + 1);
}

export function withRange(
  selectedIds: string[],
  range: string[],
  isIncluded: boolean
) {
  const remaining = selectedIds.filter((id) => !range.includes(id));
  if (isIncluded) {
    return [...remaining, ...range];
  }
  return remaining;
}
