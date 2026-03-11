'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useId, useState } from 'react';

import {
  ChartLineIcon,
  ChevronDownIcon,
  EllipsisIcon,
  PlusIcon,
  ShieldCheckIcon,
  TrashIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Chip } from '@/registry/ndeko/ui/chip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';

import {
  ROLE_LABEL,
  type Member,
  type MemberTask,
  type Role,
  type StatusId,
} from './data';
import { EstimateField } from './estimate-field';
import {
  FIGURE_LABEL,
  IssueTypeGem,
  MEMBER_CARD_HEIGHT,
  MEMBER_GRID,
  PresenceAvatar,
  SlidingValue,
  StatusChipMenu,
  formatDuration,
  totalTodayOf,
  workedTodayOf,
} from './member-parts';

export type MemberActions = {
  assignTask: (memberId: string, task: MemberTask) => void;
  unassignTask: (memberId: string) => void;
  changeStatus: (memberId: string, status: StatusId) => void;
  changeEstimate: (memberId: string, minutes: number) => void;
  addTime: (memberId: string, minutes: number) => void;
  changeRole: (memberId: string, role: Role) => void;
  removeMember: (memberId: string) => void;
};

const OWN_CARD =
  'ring-primary/45 shadow-[0_6px_18px_-8px_color-mix(in_oklab,var(--primary)_45%,transparent)]';

const QUICK_TIME = [15, 30, 60];

const TASK_SWAP_TRANSITION: Transition = {
  duration: 0.18,
  ease: [0.23, 1, 0.32, 1],
};

const TASK_SWAP: Variants = {
  enter: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

const PANEL_IN: Transition = { duration: 0.2, ease: [0.23, 1, 0.32, 1] };

const PANEL_OUT: Transition = { duration: 0.14, ease: [0.23, 1, 0.32, 1] };

const PANEL_PRESENCE: Variants = {
  hidden: { height: 0, opacity: 0, transition: PANEL_OUT },
  shown: { height: 'auto', opacity: 1, transition: PANEL_IN },
};

const FADE: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
  hidden: { opacity: 0, transition: PANEL_OUT },
  shown: { opacity: 1, transition: PANEL_IN },
};

const ROLES: Role[] = ['manager', 'member', 'viewer'];

function taskSwapOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE;
  }
  return TASK_SWAP;
}

function panelPresenceOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE;
  }
  return PANEL_PRESENCE;
}

function controlsOf(isOpen: boolean, panelId: string) {
  if (isOpen) {
    return panelId;
  }
  return undefined;
}

function isRole(value: unknown): value is Role {
  return ROLES.some((role) => role === value);
}

function shareOf(minutes: number, total: number) {
  if (total === 0) {
    return 0;
  }
  return Math.round((minutes / total) * 100);
}

function quickTimeLabelOf(minutes: number) {
  if (minutes < 60) {
    return `+${minutes}m`;
  }
  return `+${minutes / 60}h`;
}

function AssignTaskMenu({
  member,
  openTasks,
  onAssign,
}: {
  member: Member;
  openTasks: MemberTask[];
  onAssign: (task: MemberTask) => void;
}) {
  const hasOpenTasks = openTasks.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type='button'
            aria-label={`Assign a task to ${member.name}`}
            className='hairline-border border-foreground/20 hover:border-foreground/35 text-muted-foreground hover:text-foreground focus-visible:ring-ring/25 data-popup-open:border-foreground/35 inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md border-dashed px-2.5 text-[13px] transition-colors duration-150 outline-none focus-visible:ring-[3px]'
          />
        }
      >
        <PlusIcon className='size-3.5' />
        Assign task
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-80'>
        <DropdownMenuLabel>Open tasks</DropdownMenuLabel>
        {!hasOpenTasks && (
          <DropdownMenuItem disabled>
            No open task left to assign
          </DropdownMenuItem>
        )}
        {openTasks.map((task) => {
          function assign() {
            onAssign(task);
          }

          return (
            <DropdownMenuItem key={task.id} onClick={assign}>
              <IssueTypeGem type={task.type} />
              <span className='text-muted-foreground text-xs tabular-nums'>
                {task.number}
              </span>
              <span className='min-w-0 flex-1 truncate'>{task.title}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TaskCell({
  member,
  openTasks,
  actions,
}: {
  member: Member;
  openTasks: MemberTask[];
  actions: MemberActions;
}) {
  const shouldReduceMotion = useReducedMotion();
  const variants = taskSwapOf(shouldReduceMotion);
  const task = member.task;
  let swapKey = 'no-task';
  if (task) {
    swapKey = task.id;
  }

  function assign(nextTask: MemberTask) {
    actions.assignTask(member.id, nextTask);
  }

  function changeStatus(status: StatusId) {
    actions.changeStatus(member.id, status);
  }

  return (
    <AnimatePresence mode='popLayout' initial={false}>
      <motion.div
        key={swapKey}
        variants={variants}
        initial='enter'
        animate='visible'
        exit='exit'
        transition={TASK_SWAP_TRANSITION}
        className='flex min-w-0 flex-col gap-1.5'
      >
        {task && (
          <>
            <div className='flex min-w-0 items-center gap-2'>
              <IssueTypeGem type={task.type} />
              <span className='text-muted-foreground text-xs tabular-nums'>
                {task.number}
              </span>
              <StatusChipMenu
                status={task.status}
                taskNumber={task.number}
                onChange={changeStatus}
              />
            </div>
            <p className='line-clamp-2 text-[13px] leading-snug'>
              {task.title}
            </p>
          </>
        )}
        {!task && (
          <div className='flex items-center gap-3'>
            <AssignTaskMenu
              member={member}
              openTasks={openTasks}
              onAssign={assign}
            />
            <span className='text-muted-foreground hidden text-xs sm:inline'>
              No task in progress
            </span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function MemberMenu({
  member,
  actions,
}: {
  member: Member;
  actions: MemberActions;
}) {
  const task = member.task;
  const canRemove = !member.isCurrentUser;

  function unassign() {
    actions.unassignTask(member.id);
  }

  function changeRole(value: unknown) {
    if (isRole(value)) {
      actions.changeRole(member.id, value);
    }
  }

  function remove() {
    actions.removeMember(member.id);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={`Actions for ${member.name}`}
            className='text-muted-foreground'
          />
        }
      >
        <EllipsisIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-56'>
        {task && (
          <DropdownMenuItem onClick={unassign}>
            <XIcon />
            {`Unassign ${task.number}`}
          </DropdownMenuItem>
        )}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <ShieldCheckIcon />
            Change role
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={member.role}
              onValueChange={changeRole}
            >
              {ROLES.map((role) => (
                <DropdownMenuRadioItem key={role} value={role} closeOnClick>
                  {ROLE_LABEL[role]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant='destructive'
          disabled={!canRemove}
          onClick={remove}
        >
          <TrashIcon />
          Remove from team
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ActivityPanel({
  member,
  panelId,
  actions,
}: {
  member: Member;
  panelId: string;
  actions: MemberActions;
}) {
  const total = totalTodayOf(member);
  const task = member.task;
  const hasActivity = member.activity.length > 0;

  return (
    <div
      id={panelId}
      className='hairline-t border-border flex flex-col gap-3 border-dashed px-4 py-3'
    >
      <p className='text-muted-foreground text-xs font-medium'>Today</p>
      {!hasActivity && (
        <p className='text-muted-foreground text-[13px]'>
          No time tracked today
        </p>
      )}
      {hasActivity && (
        <ul className='flex flex-col gap-2.5'>
          {member.activity.map((entry) => {
            const share = shareOf(entry.minutes, total);
            const barStyle = { width: `${share}%` } as React.CSSProperties;

            return (
              <li
                key={entry.taskId}
                className='grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 sm:grid-cols-[minmax(0,1fr)_8rem_4.5rem_2.5rem]'
              >
                <span className='flex min-w-0 items-center gap-2 text-[13px]'>
                  <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
                    {entry.number}
                  </span>
                  <span className='truncate'>{entry.title}</span>
                </span>
                <span className='bg-foreground/[0.06] col-span-2 h-1 overflow-hidden rounded-full sm:col-span-1'>
                  <span
                    style={barStyle}
                    className='bg-primary block h-full rounded-full transition-[width] duration-300 ease-(--ease-out-strong)'
                  />
                </span>
                <SlidingValue
                  value={entry.minutes}
                  className='row-start-1 justify-end text-[13px] font-medium sm:row-auto'
                />
                <span className='text-muted-foreground hidden text-right text-xs tabular-nums sm:block'>
                  {`${share}%`}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {task && (
        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-muted-foreground text-xs'>
            {`Add time to ${task.number}`}
          </span>
          {QUICK_TIME.map((minutes) => {
            function addTime() {
              actions.addTime(member.id, minutes);
            }

            return (
              <Button
                key={minutes}
                variant='secondary'
                size='sm'
                onClick={addTime}
                className='tabular-nums'
              >
                {quickTimeLabelOf(minutes)}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}

type MemberCardProps = {
  member: Member;
  openTasks: MemberTask[];
  actions: MemberActions;
};

export function MemberCard({ member, openTasks, actions }: MemberCardProps) {
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const panelVariants = panelPresenceOf(shouldReduceMotion);
  const panelId = useId();
  const task = member.task;
  const worked = workedTodayOf(member);
  const total = totalTodayOf(member);
  const isManager = member.role === 'manager';
  const activityLabel = `Today’s activity of ${member.name}: ${formatDuration(total)}`;

  function toggleActivity() {
    setIsActivityOpen((isOpen) => !isOpen);
  }

  function changeEstimate(minutes: number) {
    actions.changeEstimate(member.id, minutes);
  }

  return (
    <div
      className={cn(
        MEMBER_GRID,
        MEMBER_CARD_HEIGHT,
        'bg-card hairline-ring ring-border relative rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        member.isCurrentUser && OWN_CARD
      )}
    >
      <div className='col-span-3 flex min-w-0 items-center gap-3 py-3 pr-12 pl-4 xl:col-span-1 xl:pr-4'>
        <PresenceAvatar member={member} />
        <div className='flex min-w-0 flex-col gap-0.5'>
          <p className='flex min-w-0 items-center gap-2 text-[13px] font-medium'>
            <span className='truncate'>{member.name}</span>
            {member.isCurrentUser && (
              <Chip color='var(--muted-foreground)'>You</Chip>
            )}
          </p>
          <p className='text-muted-foreground truncate text-xs'>
            {member.title}
            {isManager && ' · Manager'}
          </p>
        </div>
      </div>
      <div className='xl:hairline-l border-border col-span-3 flex min-w-0 items-center px-4 pb-3 xl:col-span-1 xl:py-3'>
        <TaskCell member={member} openTasks={openTasks} actions={actions} />
      </div>
      <div className='hairline-t xl:hairline-l border-border flex flex-col justify-center gap-1 border-dashed px-4 py-3 xl:items-center xl:border-t-0 xl:border-solid'>
        <span className={FIGURE_LABEL}>Worked today</span>
        <SlidingValue value={worked} className='text-[13px] font-medium' />
      </div>
      <div className='hairline-t hairline-l border-border flex flex-col justify-center gap-1 border-dashed px-4 py-3 xl:items-center xl:border-t-0 xl:border-solid'>
        <span className={FIGURE_LABEL}>Estimate</span>
        {task && (
          <EstimateField
            minutes={member.estimateMinutes}
            taskNumber={task.number}
            onChange={changeEstimate}
          />
        )}
        {!task && (
          <span className='text-muted-foreground text-[13px]'>
            <span aria-hidden='true'>–</span>
            <span className='sr-only'>No task</span>
          </span>
        )}
      </div>
      <div className='hairline-t hairline-l border-border flex flex-col justify-center gap-1 border-dashed px-4 py-3 xl:items-center xl:border-t-0 xl:border-solid'>
        <span className={FIGURE_LABEL}>Total today</span>
        <button
          type='button'
          aria-label={activityLabel}
          aria-expanded={isActivityOpen}
          aria-controls={controlsOf(isActivityOpen, panelId)}
          onClick={toggleActivity}
          className='bg-foreground/[0.04] hairline-ring ring-foreground/10 hover:bg-foreground/[0.07] aria-expanded:bg-foreground/[0.07] focus-visible:ring-ring/25 inline-flex h-7 w-fit cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-[13px] font-medium transition-[background-color,scale] duration-150 ease-(--ease-out-strong) outline-none focus-visible:ring-[3px] active:scale-[0.97]'
        >
          <ChartLineIcon className='text-muted-foreground size-3.5' />
          <SlidingValue value={total} />
          <ChevronDownIcon
            className={cn(
              'text-muted-foreground size-3.5 transition-transform duration-200 ease-(--ease-out-strong)',
              isActivityOpen && 'rotate-180'
            )}
          />
        </button>
      </div>
      <div className='xl:hairline-l border-border absolute top-2.5 right-2 flex items-center justify-center xl:static'>
        <MemberMenu member={member} actions={actions} />
      </div>
      <AnimatePresence initial={false}>
        {isActivityOpen && (
          <motion.div
            key='activity'
            variants={panelVariants}
            initial='hidden'
            animate='shown'
            exit='hidden'
            className='col-span-full overflow-hidden'
          >
            <ActivityPanel
              member={member}
              panelId={panelId}
              actions={actions}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
