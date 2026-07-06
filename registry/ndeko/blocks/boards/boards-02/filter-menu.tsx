'use client';

import {
  FilterIcon,
  GaugeIcon,
  HashIcon,
  UserIcon,
  XIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';
import { Kbd } from '@/registry/ndeko/ui/kbd';
import { Avatar } from '@/registry/ndeko/ui/avatar';

import {
  activeFilterCountOf,
  toggledValue,
  type Filters,
} from './board-filters';
import {
  LABELS,
  PEOPLE,
  PRIORITIES,
  type LabelId,
  type Priority,
  type Task,
} from './data';

type FilterOption = {
  value: string;
  label: string;
  count: number;
  glyph: React.ReactNode;
};

const PRIORITY_ORDER: Priority[] = ['urgent', 'high', 'medium', 'low'];

const LABEL_ORDER: LabelId[] = ['design', 'web', 'mobile', 'api', 'research'];

function isPriority(value: string): value is Priority {
  return PRIORITY_ORDER.some((priority) => priority === value);
}

function isLabelId(value: string): value is LabelId {
  return LABEL_ORDER.some((labelId) => labelId === value);
}

function Dot({ color }: { color: string }) {
  const dotStyle = { backgroundColor: color } as React.CSSProperties;
  return (
    <span
      aria-hidden='true'
      className='flex size-4 items-center justify-center'
    >
      <span style={dotStyle} className='size-2 rounded-full' />
    </span>
  );
}

function priorityOptionsOf(tasks: Task[]): FilterOption[] {
  return PRIORITY_ORDER.map((priority) => {
    const meta = PRIORITIES[priority];
    const count = tasks.filter((task) => task.priority === priority).length;
    return {
      value: priority,
      label: meta.label,
      count,
      glyph: <Dot color={meta.color} />,
    };
  });
}

function assigneeOptionsOf(tasks: Task[]): FilterOption[] {
  return PEOPLE.map((person) => {
    const count = tasks.filter((task) =>
      task.assigneeIds.includes(person.id)
    ).length;
    return {
      value: person.id,
      label: person.name,
      count,
      glyph: <Avatar className='size-4' seed={person.name} />,
    };
  });
}

function labelOptionsOf(tasks: Task[]): FilterOption[] {
  return LABEL_ORDER.map((labelId) => {
    const meta = LABELS[labelId];
    const count = tasks.filter((task) => task.labels.includes(labelId)).length;
    return {
      value: labelId,
      label: meta.label,
      count,
      glyph: <Dot color={meta.color} />,
    };
  });
}

type PropertyMenuProps = {
  label: string;
  icon: Icon;
  options: FilterOption[];
  picked: string[];
  onToggle: (value: string) => void;
};

function PropertyMenu({
  label,
  icon: PropertyIcon,
  options,
  picked,
  onToggle,
}: PropertyMenuProps) {
  const pickedCount = picked.length;
  const hasPicked = pickedCount > 0;

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <PropertyIcon />
        <span className='flex-1'>{label}</span>
        {hasPicked && <Kbd className='mr-1'>{pickedCount}</Kbd>}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className='w-56'>
        {options.map((option) => {
          const isPicked = picked.includes(option.value);

          function toggle() {
            onToggle(option.value);
          }

          return (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={isPicked}
              onCheckedChange={toggle}
            >
              {option.glyph}
              <span className='min-w-0 flex-1 truncate'>{option.label}</span>
              <span className='text-muted-foreground text-xs tabular-nums'>
                {option.count}
              </span>
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

type FilterMenuProps = {
  tasks: Task[];
  filters: Filters;
  onChange: (filters: Filters) => void;
};

/** One row per property, a submenu of values that apply at once, and Clear filters last. */
export function FilterMenu({ tasks, filters, onChange }: FilterMenuProps) {
  const activeCount = activeFilterCountOf(filters);
  const hasFilters = activeCount > 0;

  function togglePriority(value: string) {
    if (!isPriority(value)) {
      return;
    }
    const priorities = toggledValue(filters.priorities, value);
    onChange({ ...filters, priorities });
  }

  function toggleAssignee(value: string) {
    const assigneeIds = toggledValue(filters.assigneeIds, value);
    onChange({ ...filters, assigneeIds });
  }

  function toggleLabel(value: string) {
    if (!isLabelId(value)) {
      return;
    }
    const labels = toggledValue(filters.labels, value);
    onChange({ ...filters, labels });
  }

  function clearFilters() {
    onChange({ priorities: [], assigneeIds: [], labels: [] });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant='outline' />}>
        <FilterIcon />
        Filter
        {hasFilters && (
          <span className='bg-primary/10 text-primary-ink -mr-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs tabular-nums'>
            {activeCount}
            <span className='sr-only'> active</span>
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-52'>
        <PropertyMenu
          label='Priority'
          icon={GaugeIcon}
          options={priorityOptionsOf(tasks)}
          picked={filters.priorities}
          onToggle={togglePriority}
        />
        <PropertyMenu
          label='Assignee'
          icon={UserIcon}
          options={assigneeOptionsOf(tasks)}
          picked={filters.assigneeIds}
          onToggle={toggleAssignee}
        />
        <PropertyMenu
          label='Label'
          icon={HashIcon}
          options={labelOptionsOf(tasks)}
          picked={filters.labels}
          onToggle={toggleLabel}
        />
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={!hasFilters} onClick={clearFilters}>
          <XIcon />
          Clear filters
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
