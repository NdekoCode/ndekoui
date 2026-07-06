'use client';

import { MotionNumber } from '@/components/core/motion-number';
import {
  CircleDashedIcon,
  HashIcon,
  LayersIcon,
  ListFilterIcon,
  UserIcon,
  UserRoundIcon,
  XIcon,
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

import {
  ISSUE_TYPES,
  LABELS,
  PEOPLE,
  PRIORITIES,
  STATUSES,
  type Task,
} from './data';
import {
  IssueTypeGem,
  PersonAvatar,
  PriorityGlyph,
  StatusGlyph,
} from './task-glyphs';
import {
  activeFilterCountOf,
  assigneeValuesOf,
  NO_ASSIGNEE,
  type FilterKey,
  type Filters,
} from './task-model';

type FilterOption = {
  value: string;
  label: string;
  glyph: React.ReactNode;
  count: number;
};

type FilterProperty = {
  key: FilterKey;
  label: string;
  glyph: React.ReactNode;
  options: FilterOption[];
};

function countBy(tasks: Task[], valuesOf: (task: Task) => string[]) {
  const counts = new Map<string, number>();
  for (const task of tasks) {
    for (const value of valuesOf(task)) {
      const current = counts.get(value) ?? 0;
      counts.set(value, current + 1);
    }
  }
  return counts;
}

function LabelDot({ color }: { color: string }) {
  const dotStyle = { backgroundColor: color } as React.CSSProperties;
  return (
    <span
      aria-hidden='true'
      style={dotStyle}
      className='mx-1 size-2 shrink-0 rounded-full'
    />
  );
}

function filterPropertiesOf(tasks: Task[]): FilterProperty[] {
  const statusCounts = countBy(tasks, (task) => [task.status]);
  const priorityCounts = countBy(tasks, (task) => [task.priority]);
  const assigneeCounts = countBy(tasks, assigneeValuesOf);
  const labelCounts = countBy(tasks, (task) => task.labelIds);
  const typeCounts = countBy(tasks, (task) => [task.type]);

  const assigneeOptions: FilterOption[] = PEOPLE.map((person) => ({
    value: person.id,
    label: person.name,
    glyph: <PersonAvatar person={person} className='size-4 text-[8px]' />,
    count: assigneeCounts.get(person.id) ?? 0,
  }));
  assigneeOptions.push({
    value: NO_ASSIGNEE,
    label: 'No assignee',
    glyph: <UserRoundIcon />,
    count: assigneeCounts.get(NO_ASSIGNEE) ?? 0,
  });

  return [
    {
      key: 'status',
      label: 'Status',
      glyph: <CircleDashedIcon />,
      options: STATUSES.map((status) => ({
        value: status.id,
        label: status.name,
        glyph: <StatusGlyph status={status.id} />,
        count: statusCounts.get(status.id) ?? 0,
      })),
    },
    {
      key: 'priority',
      label: 'Priority',
      glyph: (
        <PriorityGlyph priority='high' className='text-muted-foreground' />
      ),
      options: PRIORITIES.map((priority) => ({
        value: priority.id,
        label: priority.name,
        glyph: <PriorityGlyph priority={priority.id} />,
        count: priorityCounts.get(priority.id) ?? 0,
      })),
    },
    {
      key: 'assignee',
      label: 'Assignee',
      glyph: <UserIcon />,
      options: assigneeOptions,
    },
    {
      key: 'label',
      label: 'Label',
      glyph: <HashIcon />,
      options: LABELS.map((label) => ({
        value: label.id,
        label: label.name,
        glyph: <LabelDot color={label.color} />,
        count: labelCounts.get(label.id) ?? 0,
      })),
    },
    {
      key: 'type',
      label: 'Type',
      glyph: <LayersIcon />,
      options: ISSUE_TYPES.map((type) => ({
        value: type.id,
        label: type.name,
        glyph: <IssueTypeGem type={type.id} />,
        count: typeCounts.get(type.id) ?? 0,
      })),
    },
  ];
}

type FilterMenuProps = {
  tasks: Task[];
  filters: Filters;
  onToggle: (key: FilterKey, value: string, isIncluded: boolean) => void;
  onClear: () => void;
};

export function FilterMenu({
  tasks,
  filters,
  onToggle,
  onClear,
}: FilterMenuProps) {
  const properties = filterPropertiesOf(tasks);
  const activeCount = activeFilterCountOf(filters);
  const hasActive = activeCount > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant='outline' />}>
        <ListFilterIcon />
        Filter
        {hasActive && (
          <span className='bg-primary/10 text-primary-ink -me-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs'>
            <MotionNumber value={activeCount} />
            <span className='sr-only'> active</span>
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-52'>
        {properties.map((property) => {
          const selected = filters[property.key];
          const selectedCount = selected.length;
          const hasSelection = selectedCount > 0;
          return (
            <DropdownMenuSub key={property.key}>
              <DropdownMenuSubTrigger>
                {property.glyph}
                <span className='flex-1'>{property.label}</span>
                {hasSelection && <Kbd>{selectedCount}</Kbd>}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className='w-56'>
                {property.options.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={selected.includes(option.value)}
                    onCheckedChange={(checked) =>
                      onToggle(property.key, option.value, checked)
                    }
                  >
                    {option.glyph}
                    <span className='min-w-0 flex-1 truncate'>
                      {option.label}
                    </span>
                    <span className='text-muted-foreground text-xs tabular-nums'>
                      {option.count}
                    </span>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={!hasActive} onClick={onClear}>
          <XIcon />
          Clear filters
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
