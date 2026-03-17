'use client';

import {
  CalendarIcon,
  CircleDashedIcon,
  ClockIcon,
  HashIcon,
  PlusIcon,
  UsersIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Chip } from '@/registry/ndeko/ui/chip';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';

import { LABELS, PEOPLE, PRIORITIES, STATUSES, type TaskDetail } from './data';
import {
  datePresetsOf,
  durationLabel,
  ESTIMATE_PRESETS,
  isOverdue,
  isPriorityId,
  isStatusId,
  labelsOf,
  longDateOf,
  peopleOf,
  priorityOf,
  statusOf,
  toggledIds,
} from './detail-model';
import { Swap } from './motion-parts';
import { PersonAvatar, PriorityGlyph, StatusGlyph } from './task-glyphs';

type Patch = (patch: Partial<TaskDetail>) => void;

const VALUE_TRIGGER =
  'inline-flex h-7 min-w-0 max-w-full -mx-1.5 cursor-pointer items-center gap-1.5 rounded-md px-1.5 text-[13px] outline-none transition-colors duration-150 hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring/25 data-popup-open:bg-foreground/5';

const ADD_SLOT =
  'inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full hairline-border border-dashed border-foreground/20 text-muted-foreground outline-none transition-colors duration-150 hover:border-foreground/35 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/25 data-popup-open:border-foreground/35';

function EmptyValue({ text }: { text: string }) {
  return (
    <span className='text-muted-foreground inline-flex items-center gap-1'>
      <PlusIcon className='size-3.5' />
      {text}
    </span>
  );
}

type PropertyRowProps = {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
};

function PropertyRow({ icon, label, children }: PropertyRowProps) {
  return (
    <div className='flex min-h-9 items-center gap-2'>
      <div className='text-muted-foreground flex w-[6.75rem] shrink-0 items-center gap-2 text-[13px] [&_svg]:size-4'>
        {icon}
        {label}
      </div>
      <div className='flex min-w-0 flex-1 flex-wrap items-center gap-1'>
        {children}
      </div>
    </div>
  );
}

function StatusValue({ task, onPatch }: { task: TaskDetail; onPatch: Patch }) {
  const meta = statusOf(task.status);

  function pick(value: unknown) {
    if (isStatusId(value)) {
      onPatch({ status: value });
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Status: ${meta.name}. Change status`}
        className={VALUE_TRIGGER}
      >
        <Swap swapKey={task.status}>
          <StatusGlyph status={task.status} />
        </Swap>
        <span className='truncate'>{meta.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-48'>
        <DropdownMenuRadioGroup value={task.status} onValueChange={pick}>
          {STATUSES.map((status) => (
            <DropdownMenuRadioItem
              key={status.id}
              value={status.id}
              closeOnClick
            >
              <StatusGlyph status={status.id} />
              {status.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PriorityValue({
  task,
  onPatch,
}: {
  task: TaskDetail;
  onPatch: Patch;
}) {
  const meta = priorityOf(task.priority);
  const isUnset = task.priority === 'none';

  function pick(value: unknown) {
    if (isPriorityId(value)) {
      onPatch({ priority: value });
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Priority: ${meta.name}. Change priority`}
        className={VALUE_TRIGGER}
      >
        {isUnset && <EmptyValue text='Set priority' />}
        {!isUnset && (
          <>
            <Swap swapKey={task.priority}>
              <PriorityGlyph priority={task.priority} />
            </Swap>
            <span className='truncate'>{meta.name}</span>
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-44'>
        <DropdownMenuRadioGroup value={task.priority} onValueChange={pick}>
          {PRIORITIES.map((priority) => (
            <DropdownMenuRadioItem
              key={priority.id}
              value={priority.id}
              closeOnClick
            >
              <PriorityGlyph priority={priority.id} />
              {priority.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function firstNameOf(name: string) {
  return name.split(' ')[0];
}

function PeopleValue({ task, onPatch }: { task: TaskDetail; onPatch: Patch }) {
  const assignees = peopleOf(task.assigneeIds);
  const hasAssignees = assignees.length > 0;

  function toggle(personId: string, isIncluded: boolean) {
    onPatch({
      assigneeIds: toggledIds(task.assigneeIds, personId, isIncluded),
    });
  }

  const menu = (
    <DropdownMenuContent className='w-52'>
      {PEOPLE.map((person) => (
        <DropdownMenuCheckboxItem
          key={person.id}
          checked={task.assigneeIds.includes(person.id)}
          onCheckedChange={(checked) => toggle(person.id, checked)}
        >
          <PersonAvatar person={person} />
          {person.name}
        </DropdownMenuCheckboxItem>
      ))}
    </DropdownMenuContent>
  );

  if (!hasAssignees) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger className={VALUE_TRIGGER}>
          <EmptyValue text='Add people' />
        </DropdownMenuTrigger>
        {menu}
      </DropdownMenu>
    );
  }

  return (
    <>
      {assignees.map((person) => (
        <span
          key={person.id}
          className='bg-card hairline-ring ring-border inline-flex h-6 max-w-40 items-center gap-1.5 rounded-full ps-0.5 pe-2 text-xs'
        >
          <PersonAvatar person={person} />
          <span className='truncate'>{firstNameOf(person.name)}</span>
        </span>
      ))}
      <DropdownMenu>
        <DropdownMenuTrigger aria-label='Change people' className={ADD_SLOT}>
          <PlusIcon className='size-3.5' />
        </DropdownMenuTrigger>
        {menu}
      </DropdownMenu>
    </>
  );
}

function LabelsValue({ task, onPatch }: { task: TaskDetail; onPatch: Patch }) {
  const labels = labelsOf(task.labelIds);
  const hasLabels = labels.length > 0;

  function toggle(labelId: string, isIncluded: boolean) {
    onPatch({ labelIds: toggledIds(task.labelIds, labelId, isIncluded) });
  }

  const menu = (
    <DropdownMenuContent className='w-48'>
      {LABELS.map((label) => {
        const dotStyle = {
          backgroundColor: label.color,
        } as React.CSSProperties;
        return (
          <DropdownMenuCheckboxItem
            key={label.id}
            checked={task.labelIds.includes(label.id)}
            onCheckedChange={(checked) => toggle(label.id, checked)}
          >
            <span
              aria-hidden='true'
              style={dotStyle}
              className='mx-1 size-2 shrink-0 rounded-full'
            />
            {label.name}
          </DropdownMenuCheckboxItem>
        );
      })}
    </DropdownMenuContent>
  );

  if (!hasLabels) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger className={VALUE_TRIGGER}>
          <EmptyValue text='Add label' />
        </DropdownMenuTrigger>
        {menu}
      </DropdownMenu>
    );
  }

  return (
    <>
      {labels.map((label) => (
        <Chip key={label.id} color={label.color} className='h-6 px-2'>
          {label.name}
        </Chip>
      ))}
      <DropdownMenu>
        <DropdownMenuTrigger aria-label='Change labels' className={ADD_SLOT}>
          <PlusIcon className='size-3.5' />
        </DropdownMenuTrigger>
        {menu}
      </DropdownMenu>
    </>
  );
}

function dueToneOf(task: TaskDetail) {
  if (isOverdue(task)) {
    return 'text-destructive-ink';
  }
  return '';
}

function DueValue({ task, onPatch }: { task: TaskDetail; onPatch: Patch }) {
  const presets = datePresetsOf();

  function pick(value: unknown) {
    if (typeof value === 'string') {
      onPatch({ due: value });
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={VALUE_TRIGGER}>
        {!task.due && <EmptyValue text='Add date' />}
        {task.due && (
          <Swap swapKey={task.due} className={dueToneOf(task)}>
            {longDateOf(task.due)}
            {isOverdue(task) && <span className='sr-only'>, overdue</span>}
          </Swap>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-60'>
        <DropdownMenuRadioGroup value={task.due ?? ''} onValueChange={pick}>
          {presets.map((preset) => (
            <DropdownMenuRadioItem
              key={preset.label}
              value={preset.date}
              closeOnClick
            >
              <CalendarIcon />
              <span className='flex-1'>{preset.label}</span>
              <span className='text-muted-foreground text-xs tabular-nums'>
                {longDateOf(preset.date)}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        {task.due && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onPatch({ due: undefined })}>
              <XIcon />
              Clear date
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EstimateValue({
  task,
  onPatch,
}: {
  task: TaskDetail;
  onPatch: Patch;
}) {
  const estimate = task.estimateMinutes;
  const hasEstimate = estimate !== undefined;

  function pick(value: unknown) {
    const minutes = Number(value);
    if (Number.isFinite(minutes)) {
      onPatch({ estimateMinutes: minutes });
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={VALUE_TRIGGER}>
        {!hasEstimate && <EmptyValue text='Estimate' />}
        {hasEstimate && (
          <Swap swapKey={String(estimate)} className='tabular-nums'>
            {durationLabel(estimate)}
          </Swap>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-40'>
        <DropdownMenuRadioGroup
          value={String(estimate ?? '')}
          onValueChange={pick}
        >
          {ESTIMATE_PRESETS.map((minutes) => (
            <DropdownMenuRadioItem
              key={minutes}
              value={String(minutes)}
              closeOnClick
            >
              <ClockIcon />
              <span className='tabular-nums'>{durationLabel(minutes)}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        {hasEstimate && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onPatch({ estimateMinutes: undefined })}
            >
              <XIcon />
              Clear estimate
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type PropertyRowsProps = {
  task: TaskDetail;
  onPatch: Patch;
  columns: 1 | 2;
};

export function PropertyRows({ task, onPatch, columns }: PropertyRowsProps) {
  const isTwoColumn = columns === 2;

  return (
    <div className={cn('grid gap-x-8', isTwoColumn && '@xl:grid-cols-2')}>
      <PropertyRow icon={<CircleDashedIcon />} label='Status'>
        <StatusValue task={task} onPatch={onPatch} />
      </PropertyRow>
      <PropertyRow
        icon={
          <PriorityGlyph priority='high' className='text-muted-foreground' />
        }
        label='Priority'
      >
        <PriorityValue task={task} onPatch={onPatch} />
      </PropertyRow>
      <PropertyRow icon={<UsersIcon />} label='People'>
        <PeopleValue task={task} onPatch={onPatch} />
      </PropertyRow>
      <PropertyRow icon={<HashIcon />} label='Labels'>
        <LabelsValue task={task} onPatch={onPatch} />
      </PropertyRow>
      <PropertyRow icon={<CalendarIcon />} label='Due date'>
        <DueValue task={task} onPatch={onPatch} />
      </PropertyRow>
      <PropertyRow icon={<ClockIcon />} label='Estimate'>
        <EstimateValue task={task} onPatch={onPatch} />
      </PropertyRow>
    </div>
  );
}
