'use client';

import { motion, type MotionProps, type Transition } from 'motion/react';

import { MotionNumber } from '@/components/core/motion-number';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { CircleDashedIcon, UserIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';
import { Kbd } from '@/registry/ndeko/ui/kbd';

import {
  PEOPLE,
  PRIORITIES,
  STATUSES,
  type PriorityId,
  type StatusId,
  type Task,
} from './data';
import { PersonAvatar, PriorityGlyph, StatusGlyph } from './task-glyphs';
import { isPriorityId, isStatusId } from './task-model';

const EASE_OUT_STRONG: [number, number, number, number] = [0.23, 1, 0.32, 1];

const BAR_ENTER: Transition = { duration: 0.22, ease: EASE_OUT_STRONG };

const BAR_EXIT: Transition = { duration: 0.15, ease: EASE_OUT_STRONG };

type PresenceProps = Pick<
  MotionProps,
  'initial' | 'animate' | 'exit' | 'transition'
>;

const BAR_PRESENCE: PresenceProps = {
  initial: { opacity: 0, y: 12, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 8, scale: 0.98, transition: BAR_EXIT },
  transition: BAR_ENTER,
};

const BAR_FADE: PresenceProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: BAR_EXIT },
  transition: BAR_ENTER,
};

function barPresenceOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return BAR_FADE;
  }
  return BAR_PRESENCE;
}

function sharedValueOf<Value extends string>(values: Value[]) {
  const first = values[0];
  const isShared = values.every((value) => value === first);
  if (isShared) {
    return first;
  }
  return '';
}

function BarDivider() {
  return (
    <span aria-hidden='true' className='bg-border mx-1 h-5 w-(--hairline)' />
  );
}

type SelectionBarProps = {
  tasks: Task[];
  onStatus: (status: StatusId) => void;
  onPriority: (priority: PriorityId) => void;
  onAssignee: (personId: string, isIncluded: boolean) => void;
  onClear: () => void;
};

export function SelectionBar({
  tasks,
  onStatus,
  onPriority,
  onAssignee,
  onClear,
}: SelectionBarProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const sharedStatus = sharedValueOf(tasks.map((task) => task.status));
  const sharedPriority = sharedValueOf(tasks.map((task) => task.priority));

  function pickStatus(value: unknown) {
    if (isStatusId(value)) {
      onStatus(value);
    }
  }

  function pickPriority(value: unknown) {
    if (isPriorityId(value)) {
      onPriority(value);
    }
  }

  function isAssignedToAll(personId: string) {
    return tasks.every((task) => task.assigneeIds.includes(personId));
  }

  return (
    <motion.div
      role='toolbar'
      aria-label='Edit the selected tasks'
      {...barPresenceOf(shouldReduceMotion)}
      className='surface-raised pointer-events-auto flex h-11 max-w-full items-center gap-0.5 rounded-full py-1 ps-4 pe-1.5'
    >
      <span className='flex items-center gap-1 text-[13px] font-medium whitespace-nowrap'>
        <MotionNumber value={tasks.length} />
        selected
      </span>
      <BarDivider />
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label='Status'
          render={<Button variant='ghost' size='sm' />}
        >
          <CircleDashedIcon />
          <span className='hidden @lg:inline'>Status</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent side='top' sideOffset={10} className='w-48'>
          <DropdownMenuRadioGroup
            value={sharedStatus}
            onValueChange={pickStatus}
          >
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
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label='Priority'
          render={<Button variant='ghost' size='sm' />}
        >
          <PriorityGlyph priority='high' className='text-muted-foreground' />
          <span className='hidden @lg:inline'>Priority</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent side='top' sideOffset={10} className='w-44'>
          <DropdownMenuRadioGroup
            value={sharedPriority}
            onValueChange={pickPriority}
          >
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
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label='Assignee'
          render={<Button variant='ghost' size='sm' />}
        >
          <UserIcon />
          <span className='hidden @lg:inline'>Assignee</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent side='top' sideOffset={10} className='w-52'>
          {PEOPLE.map((person) => (
            <DropdownMenuCheckboxItem
              key={person.id}
              checked={isAssignedToAll(person.id)}
              onCheckedChange={(checked) => onAssignee(person.id, checked)}
            >
              <PersonAvatar person={person} />
              {person.name}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <BarDivider />
      <Button variant='ghost' size='sm' onClick={onClear}>
        Clear
        <Kbd className='hidden @lg:inline-flex'>Esc</Kbd>
      </Button>
    </motion.div>
  );
}
