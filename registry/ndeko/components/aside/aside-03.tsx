'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useId, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { XIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import { Chip } from '@/registry/ndeko/ui/chip';
import { RadioGroup, RadioGroupItem } from '@/registry/ndeko/ui/radio-group';
import { ToggleGroup, ToggleGroupItem } from '@/registry/ndeko/ui/toggle-group';

import {
  ASIDE_SURFACE,
  AsideCloseButton,
  AsideDescription,
  AsidePreview,
  AsideTitle,
} from './_parts/aside-frame';
import { chipVariantsOf } from './_parts/motion';
import { PEOPLE, firstNameOf } from './_parts/people';
import { PersonAvatar } from './_parts/person-avatar';
import {
  MetaGlyph,
  PRIORITY_META,
  PRIORITY_ORDER,
  STATUS_META,
  STATUS_ORDER,
  type PriorityId,
  type StatusId,
} from './_parts/task-meta';

type Due = 'overdue' | 'this-week' | 'next-week' | 'later';

type DuePreset = 'any' | 'overdue' | 'this-week' | 'next-week';

type Task = {
  id: string;
  status: StatusId;
  assignee: string;
  priority: PriorityId;
  due: Due;
};

type Filters = {
  statuses: StatusId[];
  assignees: string[];
  priorities: PriorityId[];
  due: DuePreset;
};

type ActiveFilter = { key: string; label: string; remove: () => void };

function taskOf(
  id: string,
  status: StatusId,
  assignee: string,
  priority: PriorityId,
  due: Due
): Task {
  return { id, status, assignee, priority, due };
}

const TASKS: Task[] = [
  taskOf('t1', 'todo', 'amara', 'high', 'this-week'),
  taskOf('t2', 'todo', 'priya', 'medium', 'next-week'),
  taskOf('t3', 'in-progress', 'priya', 'urgent', 'overdue'),
  taskOf('t4', 'in-progress', 'lucas', 'high', 'this-week'),
  taskOf('t5', 'in-review', 'mateo', 'medium', 'this-week'),
  taskOf('t6', 'backlog', 'hana', 'low', 'later'),
  taskOf('t7', 'done', 'amara', 'medium', 'this-week'),
  taskOf('t8', 'todo', 'mateo', 'low', 'next-week'),
  taskOf('t9', 'in-progress', 'amara', 'medium', 'this-week'),
  taskOf('t10', 'todo', 'priya', 'high', 'this-week'),
  taskOf('t11', 'backlog', 'lucas', 'low', 'later'),
  taskOf('t12', 'in-review', 'priya', 'high', 'overdue'),
  taskOf('t13', 'done', 'hana', 'urgent', 'this-week'),
  taskOf('t14', 'todo', 'hana', 'medium', 'later'),
  taskOf('t15', 'in-progress', 'mateo', 'urgent', 'this-week'),
  taskOf('t16', 'todo', 'lucas', 'medium', 'next-week'),
  taskOf('t17', 'backlog', 'priya', 'low', 'later'),
  taskOf('t18', 'done', 'mateo', 'high', 'next-week'),
  taskOf('t19', 'in-progress', 'priya', 'medium', 'next-week'),
  taskOf('t20', 'todo', 'amara', 'low', 'later'),
  taskOf('t21', 'in-review', 'lucas', 'urgent', 'this-week'),
  taskOf('t22', 'todo', 'mateo', 'high', 'overdue'),
  taskOf('t23', 'backlog', 'amara', 'medium', 'later'),
  taskOf('t24', 'in-progress', 'hana', 'high', 'next-week'),
];

const DUE_PRESETS: { value: DuePreset; label: string; chipLabel: string }[] = [
  { value: 'any', label: 'Any time', chipLabel: 'Any time' },
  { value: 'overdue', label: 'Overdue', chipLabel: 'Overdue' },
  { value: 'this-week', label: 'This week', chipLabel: 'Due this week' },
  { value: 'next-week', label: 'Next week', chipLabel: 'Due next week' },
];

const ASSIGNEES = PEOPLE.slice(0, 5);

const INITIAL_FILTERS: Filters = {
  statuses: ['todo', 'in-progress'],
  assignees: ['priya'],
  priorities: [],
  due: 'any',
};

const NO_FILTERS: Filters = {
  statuses: [],
  assignees: [],
  priorities: [],
  due: 'any',
};

function includesOrAll<Value>(picked: Value[], value: Value) {
  const isUnfiltered = picked.length === 0;
  return isUnfiltered || picked.includes(value);
}

function matchesDue(preset: DuePreset, due: Due) {
  if (preset === 'any') {
    return true;
  }
  return preset === due;
}

function matches(task: Task, filters: Filters) {
  const statusMatches = includesOrAll(filters.statuses, task.status);
  const assigneeMatches = includesOrAll(filters.assignees, task.assignee);
  const priorityMatches = includesOrAll(filters.priorities, task.priority);
  const dueMatches = matchesDue(filters.due, task.due);
  return statusMatches && assigneeMatches && priorityMatches && dueMatches;
}

function toggled<Value>(values: Value[], value: Value) {
  if (values.includes(value)) {
    return values.filter((candidate) => candidate !== value);
  }
  return [...values, value];
}

function isPriority(value: string): value is PriorityId {
  return PRIORITY_ORDER.some((priority) => priority === value);
}

function isDuePreset(value: unknown): value is DuePreset {
  return DUE_PRESETS.some((preset) => preset.value === value);
}

function countWhere(predicate: (task: Task) => boolean) {
  return TASKS.filter(predicate).length;
}

function resultLabelOf(count: number) {
  if (count === 1) {
    return 'task';
  }
  return 'tasks';
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className='flex flex-col gap-1'>
      <legend className='text-muted-foreground mb-1.5 text-xs font-medium'>
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function CheckRow({
  isChecked,
  count,
  onToggle,
  children,
}: {
  isChecked: boolean;
  count: number;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const id = useId();

  return (
    <div className='hover:bg-foreground/[0.03] -mx-2 flex h-8 items-center gap-2.5 rounded-md px-2'>
      <Checkbox id={id} checked={isChecked} onCheckedChange={onToggle} />
      <label
        htmlFor={id}
        className='flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-[13px]'
      >
        {children}
        <span className='text-muted-foreground ml-auto text-xs tabular-nums'>
          {count}
        </span>
      </label>
    </div>
  );
}

function ActiveFilters({ filters }: { filters: ActiveFilter[] }) {
  const shouldReduceMotion = useReducedMotion();
  const variants = chipVariantsOf(shouldReduceMotion);
  const allowsLayout = !shouldReduceMotion;
  const hasFilters = filters.length > 0;

  return (
    <AnimatedSize>
      {!hasFilters && (
        <p className='text-muted-foreground py-1 text-[13px]'>
          No filter: every task shows
        </p>
      )}
      {hasFilters && (
        <ul
          aria-label='Active filters'
          className='relative flex flex-wrap gap-1'
        >
          <AnimatePresence initial={false} mode='popLayout'>
            {filters.map((filter) => (
              <motion.li
                key={filter.key}
                layout={allowsLayout}
                variants={variants}
                initial='hidden'
                animate='shown'
                exit='hidden'
                className='flex'
              >
                <Chip
                  color='var(--primary)'
                  className='h-6 gap-1 pr-0.5 pl-2 text-xs'
                >
                  {filter.label}
                  <button
                    type='button'
                    aria-label={`Remove the filter ${filter.label}`}
                    onClick={filter.remove}
                    className='hover:bg-foreground/10 focus-visible:ring-ring/25 flex size-5 cursor-pointer items-center justify-center rounded-[5px] outline-none focus-visible:ring-[3px]'
                  >
                    <XIcon className='size-3' />
                  </button>
                </Chip>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </AnimatedSize>
  );
}

function activeFiltersOf(
  filters: Filters,
  setFilters: React.Dispatch<React.SetStateAction<Filters>>
) {
  const active: ActiveFilter[] = [];
  for (const status of filters.statuses) {
    active.push({
      key: `status-${status}`,
      label: STATUS_META[status].label,
      remove: () =>
        setFilters((previous) => ({
          ...previous,
          statuses: toggled(previous.statuses, status),
        })),
    });
  }
  for (const personId of filters.assignees) {
    const person = PEOPLE.find((candidate) => candidate.id === personId);
    if (!person) {
      continue;
    }
    active.push({
      key: `assignee-${personId}`,
      label: firstNameOf(person),
      remove: () =>
        setFilters((previous) => ({
          ...previous,
          assignees: toggled(previous.assignees, personId),
        })),
    });
  }
  for (const priority of filters.priorities) {
    active.push({
      key: `priority-${priority}`,
      label: `${PRIORITY_META[priority].label} priority`,
      remove: () =>
        setFilters((previous) => ({
          ...previous,
          priorities: toggled(previous.priorities, priority),
        })),
    });
  }
  const hasDue = filters.due !== 'any';
  if (hasDue) {
    const preset = DUE_PRESETS.find((item) => item.value === filters.due);
    active.push({
      key: 'due',
      label: preset?.chipLabel ?? 'Due date',
      remove: () => setFilters((previous) => ({ ...previous, due: 'any' })),
    });
  }
  return active;
}

function TaskFilters() {
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const resultCount = countWhere((task) => matches(task, filters));
  const hasResults = resultCount > 0;
  const active = activeFiltersOf(filters, setFilters);
  const hasActive = active.length > 0;

  function toggleStatus(status: StatusId) {
    setFilters((previous) => ({
      ...previous,
      statuses: toggled(previous.statuses, status),
    }));
  }

  function toggleAssignee(personId: string) {
    setFilters((previous) => ({
      ...previous,
      assignees: toggled(previous.assignees, personId),
    }));
  }

  function changePriorities(values: string[]) {
    const priorities = values.filter(isPriority);
    setFilters((previous) => ({ ...previous, priorities }));
  }

  function changeDue(value: unknown) {
    if (isDuePreset(value)) {
      setFilters((previous) => ({ ...previous, due: value }));
    }
  }

  function clearAll() {
    setFilters(NO_FILTERS);
  }

  return (
    <div className='flex min-h-full flex-col'>
      <div className='flex flex-col gap-4 px-5 pt-5 pb-6'>
        <div className='flex items-start gap-3'>
          <div className='flex min-w-0 flex-1 flex-col gap-1'>
            <AsideTitle>Filters</AsideTitle>
            <AsideDescription>Tasks of the Product team</AsideDescription>
          </div>
          <AsideCloseButton label='Close filters' className='-mt-1 -mr-2' />
        </div>
        <ActiveFilters filters={active} />
      </div>
      <div className='flex flex-1 flex-col gap-6 px-5 pb-6'>
        <FilterGroup title='Status'>
          {STATUS_ORDER.map((status) => {
            const meta = STATUS_META[status];
            const isChecked = filters.statuses.includes(status);
            const count = countWhere((task) => task.status === status);

            function toggle() {
              toggleStatus(status);
            }

            return (
              <CheckRow
                key={status}
                isChecked={isChecked}
                count={count}
                onToggle={toggle}
              >
                <MetaGlyph meta={meta} />
                {meta.label}
              </CheckRow>
            );
          })}
        </FilterGroup>
        <FilterGroup title='Assignee'>
          {ASSIGNEES.map((person) => {
            const isChecked = filters.assignees.includes(person.id);
            const count = countWhere((task) => task.assignee === person.id);

            function toggle() {
              toggleAssignee(person.id);
            }

            return (
              <CheckRow
                key={person.id}
                isChecked={isChecked}
                count={count}
                onToggle={toggle}
              >
                <PersonAvatar person={person} size='xs' />
                <span className='truncate'>{person.name}</span>
              </CheckRow>
            );
          })}
        </FilterGroup>
        <FilterGroup title='Priority'>
          <ToggleGroup
            multiple
            value={filters.priorities}
            onValueChange={changePriorities}
            variant='outline'
            size='sm'
            aria-label='Priority'
            className='grid w-full grid-cols-2 gap-1.5'
          >
            {PRIORITY_ORDER.map((priority) => {
              const meta = PRIORITY_META[priority];

              return (
                <ToggleGroupItem
                  key={priority}
                  value={priority}
                  className='justify-start gap-2 text-xs'
                >
                  <MetaGlyph meta={meta} />
                  {meta.label}
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
        </FilterGroup>
        <FilterGroup title='Due date'>
          <RadioGroup
            value={filters.due}
            onValueChange={changeDue}
            className='gap-0'
          >
            {DUE_PRESETS.map((preset) => (
              <label
                key={preset.value}
                className='hover:bg-foreground/[0.03] -mx-2 flex h-8 cursor-pointer items-center gap-2.5 rounded-md px-2 text-[13px]'
              >
                <RadioGroupItem value={preset.value} />
                {preset.label}
              </label>
            ))}
          </RadioGroup>
        </FilterGroup>
      </div>
      <div
        className={cn(
          'sticky bottom-0 mt-auto flex items-center gap-2 px-5 pt-2 pb-4',
          ASIDE_SURFACE
        )}
      >
        <Button variant='ghost' disabled={!hasActive} onClick={clearAll}>
          Clear all
        </Button>
        <Button disabled={!hasResults} className='ml-auto'>
          {hasResults && (
            <span className='flex items-center gap-1'>
              Show
              <MotionNumber value={resultCount} />
              {resultLabelOf(resultCount)}
            </span>
          )}
          {!hasResults && 'No task matches'}
        </Button>
      </div>
    </div>
  );
}

export default function Aside03() {
  return (
    <AsidePreview triggerLabel='Open filters'>
      <TaskFilters />
    </AsidePreview>
  );
}
