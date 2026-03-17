'use client';

import { UserRoundPlusIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';

import {
  PEOPLE,
  PRIORITIES,
  STATUSES,
  type PriorityId,
  type StatusId,
} from './data';
import { Swap } from './motion-parts';
import {
  PeopleStack,
  PersonAvatar,
  PriorityGlyph,
  StatusGlyph,
} from './task-glyphs';
import { CELL_TRIGGER, HOVER_ONLY } from './task-grid';
import {
  isPriorityId,
  isStatusId,
  peopleOf,
  peopleSentenceOf,
  priorityOf,
  statusOf,
  toggledIds,
} from './task-model';

export function StatusPicker({
  status,
  onChange,
}: {
  status: StatusId;
  onChange: (status: StatusId) => void;
}) {
  const meta = statusOf(status);

  function pick(value: unknown) {
    if (isStatusId(value)) {
      onChange(value);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Status: ${meta.name}. Change status`}
        className={CELL_TRIGGER}
      >
        <Swap swapKey={status}>
          <StatusGlyph status={status} />
        </Swap>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-48'>
        <DropdownMenuRadioGroup value={status} onValueChange={pick}>
          {STATUSES.map((option) => (
            <DropdownMenuRadioItem
              key={option.id}
              value={option.id}
              closeOnClick
            >
              <StatusGlyph status={option.id} />
              {option.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PriorityPicker({
  priority,
  onChange,
}: {
  priority: PriorityId;
  onChange: (priority: PriorityId) => void;
}) {
  const meta = priorityOf(priority);
  const isUnset = priority === 'none';

  function pick(value: unknown) {
    if (isPriorityId(value)) {
      onChange(value);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Priority: ${meta.name}. Change priority`}
        className={CELL_TRIGGER}
      >
        <Swap swapKey={priority} className={cn(isUnset && HOVER_ONLY)}>
          <PriorityGlyph priority={priority} />
        </Swap>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-44'>
        <DropdownMenuRadioGroup value={priority} onValueChange={pick}>
          {PRIORITIES.map((option) => (
            <DropdownMenuRadioItem
              key={option.id}
              value={option.id}
              closeOnClick
            >
              <PriorityGlyph priority={option.id} />
              {option.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function assigneeLabelOf(names: string[]) {
  const people = peopleSentenceOf(names);
  return `Assigned to ${people}. Change assignees`;
}

export function AssigneePicker({
  assigneeIds,
  onChange,
}: {
  assigneeIds: string[];
  onChange: (assigneeIds: string[]) => void;
}) {
  const assignees = peopleOf(assigneeIds);
  const names = assignees.map((person) => person.name);
  const hasAssignees = assignees.length > 0;

  function toggle(personId: string, isIncluded: boolean) {
    onChange(toggledIds(assigneeIds, personId, isIncluded));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={assigneeLabelOf(names)}
        className={cn(CELL_TRIGGER, 'w-auto min-w-7 px-1')}
      >
        {hasAssignees && <PeopleStack people={assignees} />}
        {!hasAssignees && (
          <UserRoundPlusIcon
            className={cn('text-muted-foreground size-4', HOVER_ONLY)}
          />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-52'>
        {PEOPLE.map((person) => (
          <DropdownMenuCheckboxItem
            key={person.id}
            checked={assigneeIds.includes(person.id)}
            onCheckedChange={(checked) => toggle(person.id, checked)}
          >
            <PersonAvatar person={person} />
            {person.name}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
