'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';

import { PlusIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

import { ColumnLabels, type SelectionState } from './column-labels';
import { TASKS, type PriorityId, type StatusId, type Task } from './data';
import { FilteredEmpty, ScopeEmpty } from './empty-list';
import { FilterMenu } from './filter-menu';
import { fadePresence } from './motion-parts';
import { ScopeSwitch } from './scope-switch';
import { SearchField } from './search-field';
import { SelectionBar } from './selection-bar';
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
  rangeBetween,
  scopeCountsOf,
  toggledFilters,
  toggledIds,
  withRange,
  type FilterKey,
  type Filters,
  type Scope,
  type TaskGroupData,
} from './task-model';
import { useDelayedPlacement } from './use-delayed-placement';

const NEW_TASK_STATUS: StatusId = 'todo';

const IGNORED_ESCAPE_TARGETS =
  'input, textarea, select, [contenteditable="true"], [role="menu"]';

function headerMetaOf(tasks: Task[]) {
  const total = countLabel(tasks.length, 'task', 'tasks');
  const trackedCount = tasks.filter((task) => task.trackedById).length;
  if (trackedCount === 0) {
    return total;
  }
  return `${total} · ${trackedCount} tracked now`;
}

function isIgnoredEscape(event: KeyboardEvent) {
  if (event.defaultPrevented) {
    return true;
  }
  if (!(event.target instanceof HTMLElement)) {
    return false;
  }
  return Boolean(event.target.closest(IGNORED_ESCAPE_TARGETS));
}

function shownIdsOf(groups: TaskGroupData[], collapsed: StatusId[]) {
  const openGroups = groups.filter(
    (group) => !collapsed.includes(group.status)
  );
  return openGroups.flatMap((group) => group.tasks.map((task) => task.id));
}

function selectionStateOf(
  selectedCount: number,
  shownCount: number
): SelectionState {
  if (selectedCount === 0) {
    return 'none';
  }
  if (selectedCount === shownCount) {
    return 'all';
  }
  return 'some';
}

function patchedWhere(
  tasks: Task[],
  taskIds: string[],
  patchOf: (task: Task) => Partial<Task>
) {
  return tasks.map((task) => {
    if (!taskIds.includes(task.id)) {
      return task;
    }
    return { ...task, ...patchOf(task) };
  });
}

function assigneesAfter(
  target: Task,
  added: string[],
  removed: string[]
): Partial<Task> {
  const kept = target.assigneeIds.filter((id) => !removed.includes(id));
  const missing = added.filter((id) => !kept.includes(id));
  return { assigneeIds: [...kept, ...missing] };
}

export default function TaskLists02() {
  const [tasks, setTasks] = useState<Task[]>(TASKS);
  const [scope, setScope] = useState<Scope>('active');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [collapsed, setCollapsed] = useState<StatusId[]>([]);
  const [draftStatus, setDraftStatus] = useState<StatusId | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [anchorId, setAnchorId] = useState<string | null>(null);
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
  const shownIds = shownIdsOf(groups, collapsed);
  const shownSelectedIds = selectedIds.filter((id) => shownIds.includes(id));
  const selectedTasks = tasks.filter((task) =>
    shownSelectedIds.includes(task.id)
  );
  const hasSelection = shownSelectedIds.length > 0;
  const selection = selectionStateOf(shownSelectedIds.length, shownIds.length);

  useEffect(() => {
    if (!hasSelection) {
      return;
    }
    function clearOnEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return;
      }
      if (isIgnoredEscape(event)) {
        return;
      }
      setSelectedIds([]);
    }
    document.addEventListener('keydown', clearOnEscape);
    return () => document.removeEventListener('keydown', clearOnEscape);
  }, [hasSelection]);

  function targetsOf(taskId: string) {
    const isInSelection = shownSelectedIds.includes(taskId);
    if (isInSelection) {
      return shownSelectedIds;
    }
    return [taskId];
  }

  function updateTasks(
    taskIds: string[],
    patchOf: (task: Task) => Partial<Task>
  ) {
    setTasks((current) => patchedWhere(current, taskIds, patchOf));
  }

  function applyStatus(taskIds: string[], status: StatusId) {
    const targets = tasks.filter((task) => taskIds.includes(task.id));
    const moving = targets.filter((task) => task.status !== status);
    for (const task of moving) {
      placement.hold(task.id, task.status);
    }
    updateTasks(taskIds, () => ({ status }));
  }

  function applyPriority(taskIds: string[], priority: PriorityId) {
    updateTasks(taskIds, () => ({ priority }));
  }

  function applyAssignee(personId: string, isIncluded: boolean) {
    updateTasks(shownSelectedIds, (task) => ({
      assigneeIds: toggledIds(task.assigneeIds, personId, isIncluded),
    }));
  }

  function changeAssignees(taskId: string, assigneeIds: string[]) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      return;
    }
    const added = assigneeIds.filter((id) => !task.assigneeIds.includes(id));
    const removed = task.assigneeIds.filter((id) => !assigneeIds.includes(id));
    updateTasks(targetsOf(taskId), (target) =>
      assigneesAfter(target, added, removed)
    );
  }

  function select(taskId: string, isSelected: boolean, isRange: boolean) {
    if (isRange && anchorId) {
      const range = rangeBetween(shownIds, anchorId, taskId);
      setSelectedIds(withRange(shownSelectedIds, range, isSelected));
      return;
    }
    setSelectedIds(toggledIds(shownSelectedIds, taskId, isSelected));
    setAnchorId(taskId);
  }

  function toggleAll(isSelected: boolean) {
    if (isSelected) {
      setSelectedIds(shownIds);
      return;
    }
    setSelectedIds([]);
  }

  function clearSelection() {
    setSelectedIds([]);
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
      <div className='relative min-h-0 flex-1'>
        <div className='absolute inset-0 overflow-y-auto'>
          <AnimatePresence mode='popLayout' initial={false}>
            {hasGroups && (
              <motion.div
                key='list'
                role='table'
                aria-label='Tasks'
                {...fadePresence()}
                className='pb-24'
              >
                <ColumnLabels selection={selection} onToggleAll={toggleAll} />
                <AnimatePresence initial={false}>
                  {groups.map((group) => (
                    <TaskGroup
                      key={group.status}
                      status={group.status}
                      tasks={group.tasks}
                      selectedIds={shownSelectedIds}
                      onSelect={select}
                      isCollapsed={collapsed.includes(group.status)}
                      isDrafting={draftStatus === group.status}
                      onToggleCollapsed={toggleCollapsed}
                      onStartDraft={startDraft}
                      onCreate={createTask}
                      onCancelDraft={() => setDraftStatus(null)}
                      onStatusChange={(taskId, status) =>
                        applyStatus(targetsOf(taskId), status)
                      }
                      onPriorityChange={(taskId, priority) =>
                        applyPriority(targetsOf(taskId), priority)
                      }
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
        <div className='pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-3'>
          <AnimatePresence>
            {hasSelection && (
              <SelectionBar
                key='selection-bar'
                tasks={selectedTasks}
                onStatus={(status) => applyStatus(shownSelectedIds, status)}
                onPriority={(priority) =>
                  applyPriority(shownSelectedIds, priority)
                }
                onAssignee={applyAssignee}
                onClear={clearSelection}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
