import type { LabelId, Priority, Task } from './data';

export type Filters = {
  priorities: Priority[];
  assigneeIds: string[];
  labels: LabelId[];
};

export const NO_FILTERS: Filters = {
  priorities: [],
  assigneeIds: [],
  labels: [],
};

export function activeFilterCountOf(filters: Filters) {
  const priorityCount = filters.priorities.length;
  const assigneeCount = filters.assigneeIds.length;
  const labelCount = filters.labels.length;
  return priorityCount + assigneeCount + labelCount;
}

function matchesPriority(task: Task, filters: Filters) {
  const isUnfiltered = filters.priorities.length === 0;
  if (isUnfiltered) {
    return true;
  }
  return filters.priorities.includes(task.priority);
}

function matchesAssignee(task: Task, filters: Filters) {
  const isUnfiltered = filters.assigneeIds.length === 0;
  if (isUnfiltered) {
    return true;
  }
  return task.assigneeIds.some((personId) =>
    filters.assigneeIds.includes(personId)
  );
}

function matchesLabel(task: Task, filters: Filters) {
  const isUnfiltered = filters.labels.length === 0;
  if (isUnfiltered) {
    return true;
  }
  return task.labels.some((labelId) => filters.labels.includes(labelId));
}

/** Values of one property combine with "or", properties combine with "and". */
export function matchesFilters(task: Task, filters: Filters) {
  const hasPriority = matchesPriority(task, filters);
  const hasAssignee = matchesAssignee(task, filters);
  const hasLabel = matchesLabel(task, filters);
  return hasPriority && hasAssignee && hasLabel;
}

export function toggledValue<Value>(values: Value[], value: Value) {
  const isPicked = values.includes(value);
  if (isPicked) {
    return values.filter((candidate) => candidate !== value);
  }
  return [...values, value];
}
