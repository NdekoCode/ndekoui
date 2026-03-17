'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { PlusIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

import { ColumnLabels } from './column-labels';
import { TASKS, type PriorityId, type StatusId, type Task } from './data';
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
  nextTaskNumberOf,
  patchedTask,
  scopeCountsOf,
  toggledFilters,
  toggledIds,
  type FilterKey,
  type Filters,
  type Scope,
} from './task-model';
import { useDelayedPlacement } from './use-delayed-placement';

const NEW_TASK_STATUS: StatusId = 'todo';

function headerMetaOf(tasks: Task[]) {
  const total = countLabel(tasks.length, 'task', 'tasks');
  const trackedCount = tasks.filter((task) => task.trackedById).length;
  if (trackedCount === 0) {
    return total;
  }
  return `${total} · ${trackedCount} tracked now`;
}

export default function TaskLists01() {
  const [tasks, setTasks] = useState<Task[]>(TASKS);
  const [scope, setScope] = useState<Scope>('active');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [collapsed, setCollapsed] = useState<StatusId[]>([]);
  const [draftStatus, setDraftStatus] = useState<StatusId | null>(null);
  const placement = useDelayedPlacement();

  const matchingTasks = tasks.filter(
    (task) => matchesSearch(task, query) && matchesFilters(task, filters)
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
  const hasGroups = groups.length > 0;
  const isFiltered = isFiltering(query, filters);
  const showsFilteredEmpty = !hasGroups && isFiltered;
  const showsScopeEmpty = !hasGroups && !isFiltered;

  function updateTask(taskId: string, patch: Partial<Task>) {
    setTasks((current) =>
      current.map((task) => patchedTask(task, taskId, patch))
    );
  }

  function changeStatus(taskId: string, status: StatusId) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      return;
    }
    if (task.status === status) {
      return;
    }
    placement.hold(taskId, task.status);
    updateTask(taskId, { status });
  }

  function changePriority(taskId: string, priority: PriorityId) {
    updateTask(taskId, { priority });
  }

  function changeAssignees(taskId: string, assigneeIds: string[]) {
    updateTask(taskId, { assigneeIds });
  }

  function toggleCollapsed(status: StatusId) {
    const isCollapsed = collapsed.includes(status);
    setCollapsed(toggledIds(collapsed, status, !isCollapsed));
  }

  function startDraft(status: StatusId) {
    const isHiddenByScope = !isInScope(status, scope);
    if (isHiddenByScope) {
      setScope('active');
    }
    setCollapsed((current) => current.filter((item) => item !== status));
    setDraftStatus(status);
  }

  function createTask(status: StatusId, title: string) {
    const number = nextTaskNumberOf(tasks);
    const task: Task = {
      id: `mos-${number}`,
      number,
      title,
      type: 'task',
      status,
      priority: 'none',
      labelIds: [],
      assigneeIds: [],
    };
    setTasks((current) => [task, ...current]);
    setDraftStatus(null);
  }

  function toggleFilter(key: FilterKey, value: string, isIncluded: boolean) {
    setFilters((current) => toggledFilters(current, key, value, isIncluded));
  }

  function clearFilters() {
    setQuery('');
    setFilters(EMPTY_FILTERS);
  }

  return (
    <div className='bg-background text-foreground @container flex h-svh min-h-[28rem] flex-col'>
      <header className='flex flex-col gap-3 px-3 pt-4 pb-3 sm:px-5'>
        <div className='flex items-center justify-between gap-3'>
          <div className='min-w-0'>
            <h1 className='truncate text-sm font-semibold'>Tasks</h1>
            <p className='text-muted-foreground text-xs'>
              {headerMetaOf(tasks)}
            </p>
          </div>
          <Button onClick={() => startDraft(NEW_TASK_STATUS)}>
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
              placeholder='Search tasks'
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
              aria-label='Tasks'
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
                    isCollapsed={collapsed.includes(group.status)}
                    isDrafting={draftStatus === group.status}
                    onToggleCollapsed={toggleCollapsed}
                    onStartDraft={startDraft}
                    onCreate={createTask}
                    onCancelDraft={() => setDraftStatus(null)}
                    onStatusChange={changeStatus}
                    onPriorityChange={changePriority}
                    onAssigneesChange={changeAssignees}
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
                onNewTask={() => startDraft(NEW_TASK_STATUS)}
                onShowActive={() => setScope('active')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
