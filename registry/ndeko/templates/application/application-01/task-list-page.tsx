'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { PlusIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

import { ColumnLabels } from './column-labels';
import type { PriorityId, StatusId, Task } from './data';
import { FilteredEmpty, ScopeEmpty } from './empty-list';
import { FilterMenu } from './filter-menu';
import { fadePresence } from './motion-parts';
import { ScopeSwitch } from './scope-switch';
import { SearchField } from './search-field';
import { TaskGroup } from './task-group';
import {
  countLabel,
  EMPTY_FILTERS,
  groupsOf,
  isFiltering,
  isInScope,
  matchesFilters,
  matchesSearch,
  scopeCountsOf,
  toggledFilters,
  toggledIds,
  type FilterKey,
  type Filters,
  type Scope,
  type TaskGroupData,
} from './task-model';
import { useDelayedPlacement } from './use-delayed-placement';

export const NEW_TASK_STATUS: StatusId = 'todo';

function headerMetaOf(tasks: Task[]) {
  const total = countLabel(tasks.length, 'task', 'tasks');
  const trackedCount = tasks.filter((task) => task.trackedById).length;
  if (trackedCount === 0) {
    return total;
  }
  return `${total} · ${trackedCount} tracked now`;
}

function sequenceOf(groups: TaskGroupData[]) {
  const ids: string[] = [];
  for (const group of groups) {
    const groupIds = group.tasks.map((task) => task.id);
    ids.push(...groupIds);
  }
  return ids;
}

function matchesQueryAndFilters(task: Task, query: string, filters: Filters) {
  const isSearchMatch = matchesSearch(task, query);
  const isFilterMatch = matchesFilters(task, filters);
  return isSearchMatch && isFilterMatch;
}

type TaskListPageProps = {
  tasks: Task[];
  openTaskId: string | null;
  draftStatus: StatusId | null;
  onDraftStatusChange: (status: StatusId | null) => void;
  onOpenTask: (taskId: string, sequence: string[]) => void;
  onPatchTask: (taskId: string, patch: Partial<Task>) => void;
  onCreateTask: (status: StatusId, title: string) => void;
};

export function TaskListPage({
  tasks,
  openTaskId,
  draftStatus,
  onDraftStatusChange,
  onOpenTask,
  onPatchTask,
  onCreateTask,
}: TaskListPageProps) {
  const [scope, setScope] = useState<Scope>('active');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [collapsed, setCollapsed] = useState<StatusId[]>([]);
  const placement = useDelayedPlacement();
  const hasDraft = draftStatus !== null;

  if (hasDraft && !isInScope(draftStatus, scope)) {
    setScope('active');
  }
  if (hasDraft && collapsed.includes(draftStatus)) {
    setCollapsed(toggledIds(collapsed, draftStatus, false));
  }

  const matchingTasks = tasks.filter((task) =>
    matchesQueryAndFilters(task, query, filters)
  );
  const scopeCounts = scopeCountsOf(matchingTasks);
  const allScopeCounts = scopeCountsOf(tasks);
  const scopeTasks = tasks.filter((task) => isInScope(task.status, scope));
  const visibleTasks = matchingTasks.filter((task) =>
    isInScope(placement.placementOf(task), scope)
  );
  const groups = groupsOf(
    visibleTasks,
    scope,
    placement.placementOf,
    draftStatus
  );
  const sequence = sequenceOf(groups);
  const hasGroups = groups.length > 0;
  const isFiltered = isFiltering(query, filters);
  const showsFilteredEmpty = !hasGroups && isFiltered;
  const showsScopeEmpty = !hasGroups && !isFiltered;

  function changeStatus(taskId: string, status: StatusId) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      return;
    }
    if (task.status === status) {
      return;
    }
    placement.hold(taskId, task.status);
    onPatchTask(taskId, { status });
  }

  function changePriority(taskId: string, priority: PriorityId) {
    onPatchTask(taskId, { priority });
  }

  function changeAssignees(taskId: string, assigneeIds: string[]) {
    onPatchTask(taskId, { assigneeIds });
  }

  function openTask(taskId: string) {
    onOpenTask(taskId, sequence);
  }

  function toggleCollapsed(status: StatusId) {
    const isCollapsed = collapsed.includes(status);
    setCollapsed(toggledIds(collapsed, status, !isCollapsed));
  }

  function startDraft(status: StatusId) {
    onDraftStatusChange(status);
  }

  function startDefaultDraft() {
    startDraft(NEW_TASK_STATUS);
  }

  function cancelDraft() {
    onDraftStatusChange(null);
  }

  function createTask(status: StatusId, title: string) {
    onCreateTask(status, title);
    onDraftStatusChange(null);
  }

  function toggleFilter(key: FilterKey, value: string, isIncluded: boolean) {
    setFilters((current) => toggledFilters(current, key, value, isIncluded));
  }

  function clearFilters() {
    setQuery('');
    setFilters(EMPTY_FILTERS);
  }

  function showActive() {
    setScope('active');
  }

  return (
    <div className='@container flex min-h-0 flex-1 flex-col'>
      <header className='flex flex-col gap-3 px-3 pt-4 pb-3 sm:px-5'>
        <div className='flex items-center justify-between gap-3'>
          <div className='min-w-0'>
            <h1 className='truncate text-sm font-semibold'>My tasks</h1>
            <p className='text-muted-foreground text-xs'>
              {headerMetaOf(tasks)}
            </p>
          </div>
          <Button onClick={startDefaultDraft}>
            <PlusIcon />
            New task
          </Button>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <ScopeSwitch scope={scope} counts={scopeCounts} onChange={setScope} />
          <div className='flex w-full items-center gap-2 @xl:ml-auto @xl:w-auto'>
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder='Search my tasks'
              className='min-w-0 flex-1 @xl:w-56 @xl:flex-none'
            />
            <FilterMenu
              tasks={scopeTasks}
              filters={filters}
              onToggle={toggleFilter}
              onClear={clearFilters}
            />
          </div>
        </div>
      </header>
      <div className='relative min-h-0 flex-1 overflow-y-auto'>
        <AnimatePresence mode='popLayout' initial={false}>
          {hasGroups && (
            <motion.div
              key='list'
              role='table'
              aria-label='My tasks'
              {...fadePresence()}
              className='pb-6'
            >
              <ColumnLabels />
              <AnimatePresence initial={false}>
                {groups.map((group) => (
                  <TaskGroup
                    key={group.status}
                    status={group.status}
                    tasks={group.tasks}
                    openTaskId={openTaskId}
                    isCollapsed={collapsed.includes(group.status)}
                    isDrafting={draftStatus === group.status}
                    onToggleCollapsed={toggleCollapsed}
                    onStartDraft={startDraft}
                    onCreate={createTask}
                    onCancelDraft={cancelDraft}
                    onStatusChange={changeStatus}
                    onPriorityChange={changePriority}
                    onAssigneesChange={changeAssignees}
                    onOpen={openTask}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
          {showsFilteredEmpty && (
            <motion.div key='filtered' {...fadePresence()}>
              <FilteredEmpty
                scope={scope}
                query={query}
                filters={filters}
                scopeTotal={allScopeCounts[scope]}
                onClear={clearFilters}
              />
            </motion.div>
          )}
          {showsScopeEmpty && (
            <motion.div key='empty' {...fadePresence()}>
              <ScopeEmpty
                scope={scope}
                onNewTask={startDefaultDraft}
                onShowActive={showActive}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
