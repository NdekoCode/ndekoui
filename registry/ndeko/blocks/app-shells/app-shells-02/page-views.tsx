'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useState } from 'react';

import {
  CircleCheckIcon,
  CircleIcon,
  FolderIcon,
  InboxIcon,
  PlusIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Chip } from '@/registry/ndeko/ui/chip';
import { Tabs, TabsList, TabsTab } from '@/registry/ndeko/ui/tabs';

import {
  CURRENT_USER_ID,
  personOf,
  projectOf,
  type EmptyPage,
  type Notification,
  type Person,
  type Project,
  type Task,
} from './data';
import { PersonAvatar } from './sidebar-parts';

const NEUTRAL_CHIP = 'var(--muted-foreground)';

const LIST_SURFACE =
  'bg-card hairline-ring ring-border hairline-divide-y divide-border overflow-hidden rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]';

const PRESENCE_IN: Transition = { duration: 0.2, ease: [0.23, 1, 0.32, 1] };

const PRESENCE_OUT: Transition = { duration: 0.14, ease: [0.23, 1, 0.32, 1] };

const ROW_PRESENCE: Variants = {
  hidden: { height: 0, opacity: 0, transition: PRESENCE_OUT },
  shown: { height: 'auto', opacity: 1, transition: PRESENCE_IN },
};

const ROW_FADE: Variants = {
  hidden: { opacity: 0, transition: PRESENCE_OUT },
  shown: { opacity: 1, transition: PRESENCE_IN },
};

function rowVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return ROW_FADE;
  }
  return ROW_PRESENCE;
}

function countLabel(count: number, singular: string, plural: string) {
  if (count === 1) {
    return `1 ${singular}`;
  }
  return `${count} ${plural}`;
}

function PresenceRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  const variants = rowVariantsOf(shouldReduceMotion);

  return (
    <motion.li
      variants={variants}
      initial='hidden'
      animate='shown'
      exit='hidden'
      className={cn('overflow-hidden', className)}
    >
      {children}
    </motion.li>
  );
}

function PageToolbar({
  title,
  meta,
  children,
}: {
  title: string;
  meta: string;
  children?: React.ReactNode;
}) {
  return (
    <div className='hairline-b border-border flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 md:px-6'>
      <div className='flex min-w-0 items-baseline gap-2'>
        <h1 className='truncate text-lg font-semibold text-balance'>{title}</h1>
        <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
          {meta}
        </span>
      </div>
      <div className='ml-auto flex items-center gap-2'>{children}</div>
    </div>
  );
}

function PageBody({ children }: { children: React.ReactNode }) {
  return (
    <div className='min-h-0 flex-1 overflow-y-auto p-4 md:p-6'>
      <div className='mx-auto w-full max-w-4xl'>{children}</div>
    </div>
  );
}

function EmptyState({
  icon: StateIcon,
  title,
  line,
  children,
}: {
  icon: Icon;
  title: string;
  line: string;
  children?: React.ReactNode;
}) {
  return (
    <div className='flex flex-col items-center gap-3 px-4 py-16 text-center'>
      <span className='keycap-3d text-muted-foreground flex size-10 items-center justify-center rounded-lg'>
        <StateIcon className='size-5' />
      </span>
      <div className='flex flex-col gap-1'>
        <p className='text-sm font-medium text-balance'>{title}</p>
        <p className='text-muted-foreground max-w-xs text-[13px] text-balance'>
          {line}
        </p>
      </div>
      {children}
    </div>
  );
}

type Scope = 'active' | 'done';

function isScope(value: unknown): value is Scope {
  const isActive = value === 'active';
  const isDone = value === 'done';
  return isActive || isDone;
}

function isInScope(task: Task, scope: Scope) {
  if (scope === 'done') {
    return task.isDone;
  }
  return !task.isDone;
}

function toggleLabelOf(task: Task) {
  if (task.isDone) {
    return `Reopen ${task.number}`;
  }
  return `Mark ${task.number} as done`;
}

function StatusGlyph({ isDone }: { isDone: boolean }) {
  if (isDone) {
    return <CircleCheckIcon className='text-success-foreground size-4' />;
  }
  return <CircleIcon className='text-muted-foreground size-4' />;
}

function TaskRow({
  task,
  showAssignee,
  onToggle,
}: {
  task: Task;
  showAssignee: boolean;
  onToggle: (taskId: string) => void;
}) {
  const project = projectOf(task.projectId);
  const assignee = personOf(task.assigneeId);

  function toggleTask() {
    onToggle(task.id);
  }

  return (
    <div className='flex h-10 items-center gap-3 px-3'>
      <button
        type='button'
        aria-label={toggleLabelOf(task)}
        onClick={toggleTask}
        className='hover:bg-foreground/5 focus-visible:ring-ring/25 -m-1 flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md outline-none focus-visible:ring-[3px]'
      >
        <StatusGlyph isDone={task.isDone} />
      </button>
      <span className='text-muted-foreground w-14 shrink-0 text-xs tabular-nums'>
        {task.number}
      </span>
      <span
        className={cn(
          'min-w-0 flex-1 truncate text-[13px]',
          task.isDone && 'text-muted-foreground'
        )}
      >
        {task.title}
      </span>
      <Chip color={NEUTRAL_CHIP} className='hidden sm:inline-flex'>
        {project.name}
      </Chip>
      <span className='text-muted-foreground hidden w-20 shrink-0 text-right text-xs md:block'>
        {task.due}
      </span>
      {showAssignee && (
        <PersonAvatar person={assignee} className='size-6 text-[10px]' />
      )}
    </div>
  );
}

type TaskListPageProps = {
  title: string;
  tasks: Task[];
  showAssignee: boolean;
  onToggleTask: (taskId: string) => void;
  onCreateTask: () => void;
};

export function TaskListPage({
  title,
  tasks,
  showAssignee,
  onToggleTask,
  onCreateTask,
}: TaskListPageProps) {
  const [scope, setScope] = useState<Scope>('active');
  const activeTasks = tasks.filter((task) => !task.isDone);
  const doneTasks = tasks.filter((task) => task.isDone);
  const visibleTasks = tasks.filter((task) => isInScope(task, scope));
  const isEmpty = visibleTasks.length === 0;
  const isActiveScope = scope === 'active';
  const showsActiveEmpty = isEmpty && isActiveScope;
  const showsDoneEmpty = isEmpty && !isActiveScope;
  const meta = countLabel(activeTasks.length, 'open task', 'open tasks');

  function changeScope(value: unknown) {
    if (isScope(value)) {
      setScope(value);
    }
  }

  function showDone() {
    setScope('done');
  }

  function showActive() {
    setScope('active');
  }

  return (
    <>
      <PageToolbar title={title} meta={meta}>
        <Tabs value={scope} onValueChange={changeScope}>
          <TabsList variant='segmented' aria-label='Tasks to show'>
            <TabsTab value='active'>
              Active
              <span className='text-muted-foreground text-xs tabular-nums'>
                {activeTasks.length}
              </span>
            </TabsTab>
            <TabsTab value='done'>
              Done
              <span className='text-muted-foreground text-xs tabular-nums'>
                {doneTasks.length}
              </span>
            </TabsTab>
          </TabsList>
        </Tabs>
        <Button onClick={onCreateTask}>
          <PlusIcon />
          New task
        </Button>
      </PageToolbar>
      <PageBody>
        {showsActiveEmpty && (
          <EmptyState
            icon={CircleCheckIcon}
            title='Nothing left to do'
            line='Every task on this list is done'
          >
            <Button variant='outline' onClick={showDone}>
              Show done tasks
            </Button>
          </EmptyState>
        )}
        {showsDoneEmpty && (
          <EmptyState
            icon={CircleIcon}
            title='No finished task yet'
            line='Tasks you mark as done move here'
          >
            <Button variant='outline' onClick={showActive}>
              Show active tasks
            </Button>
          </EmptyState>
        )}
        {!isEmpty && (
          <ul className={LIST_SURFACE}>
            <AnimatePresence initial={false}>
              {visibleTasks.map((task) => (
                <PresenceRow key={task.id}>
                  <TaskRow
                    task={task}
                    showAssignee={showAssignee}
                    onToggle={onToggleTask}
                  />
                </PresenceRow>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </PageBody>
    </>
  );
}

type InboxScope = 'unread' | 'all';

function isInboxScope(value: unknown): value is InboxScope {
  const isUnread = value === 'unread';
  const isAll = value === 'all';
  return isUnread || isAll;
}

function NotificationRow({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: (notificationId: string) => void;
}) {
  const actor = personOf(notification.actorId);

  function readNotification() {
    onRead(notification.id);
  }

  return (
    <button
      type='button'
      onClick={readNotification}
      className='hover:bg-foreground/[0.025] focus-visible:ring-ring/25 flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-inset'
    >
      <span className='flex w-1.5 shrink-0 justify-center'>
        {notification.isUnread && (
          <span className='bg-primary size-1.5 rounded-full'>
            <span className='sr-only'>Unread</span>
          </span>
        )}
      </span>
      <PersonAvatar person={actor} className='size-7 text-[10px]' />
      <span className='min-w-0 flex-1'>
        <span className='block truncate text-[13px]'>
          <span className='font-medium'>{actor.name}</span>{' '}
          {notification.action}
        </span>
        <span className='text-muted-foreground block truncate text-xs'>
          {notification.subject}
        </span>
      </span>
      <span className='text-muted-foreground shrink-0 text-xs'>
        {notification.time}
      </span>
    </button>
  );
}

type InboxPageProps = {
  notifications: Notification[];
  onRead: (notificationId: string) => void;
  onReadAll: () => void;
};

export function InboxPage({
  notifications,
  onRead,
  onReadAll,
}: InboxPageProps) {
  const [scope, setScope] = useState<InboxScope>('unread');
  const unreadNotifications = notifications.filter((note) => note.isUnread);
  const unreadCount = unreadNotifications.length;
  const hasUnread = unreadCount > 0;
  const isUnreadScope = scope === 'unread';
  let visibleNotifications = notifications;
  if (isUnreadScope) {
    visibleNotifications = unreadNotifications;
  }
  const isEmpty = visibleNotifications.length === 0;
  const meta = countLabel(unreadCount, 'unread', 'unread');

  function changeScope(value: unknown) {
    if (isInboxScope(value)) {
      setScope(value);
    }
  }

  function showAll() {
    setScope('all');
  }

  return (
    <>
      <PageToolbar title='Inbox' meta={meta}>
        <Tabs value={scope} onValueChange={changeScope}>
          <TabsList variant='segmented' aria-label='Notifications to show'>
            <TabsTab value='unread'>Unread</TabsTab>
            <TabsTab value='all'>All</TabsTab>
          </TabsList>
        </Tabs>
        <Button variant='outline' disabled={!hasUnread} onClick={onReadAll}>
          Mark all as read
        </Button>
      </PageToolbar>
      <PageBody>
        {isEmpty && (
          <EmptyState
            icon={InboxIcon}
            title='You are all caught up'
            line='Earlier notifications stay under All'
          >
            <Button variant='outline' onClick={showAll}>
              Show all notifications
            </Button>
          </EmptyState>
        )}
        {!isEmpty && (
          <ul className={LIST_SURFACE}>
            <AnimatePresence initial={false}>
              {visibleNotifications.map((notification) => (
                <PresenceRow key={notification.id}>
                  <NotificationRow
                    notification={notification}
                    onRead={onRead}
                  />
                </PresenceRow>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </PageBody>
    </>
  );
}

type ProjectsPageProps = {
  projects: Project[];
  tasks: Task[];
  onCreateProject: () => void;
};

export function ProjectsPage({
  projects,
  tasks,
  onCreateProject,
}: ProjectsPageProps) {
  const meta = countLabel(projects.length, 'project', 'projects');

  function openCountOf(projectId: string) {
    const openTasks = tasks.filter((task) => {
      const isOfProject = task.projectId === projectId;
      return isOfProject && !task.isDone;
    });
    return openTasks.length;
  }

  return (
    <>
      <PageToolbar title='Projects' meta={meta}>
        <Button onClick={onCreateProject}>
          <PlusIcon />
          New project
        </Button>
      </PageToolbar>
      <PageBody>
        <ul className={LIST_SURFACE}>
          <AnimatePresence initial={false}>
            {projects.map((project) => {
              const lead = personOf(project.leadId);
              const openCount = openCountOf(project.id);
              return (
                <PresenceRow key={project.id}>
                  <div className='flex h-12 items-center gap-3 px-3'>
                    <span className='keycap-3d text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-md'>
                      <FolderIcon className='size-4' />
                    </span>
                    <span className='min-w-0 flex-1 truncate text-[13px] font-medium'>
                      {project.name}
                    </span>
                    <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
                      {countLabel(openCount, 'open task', 'open tasks')}
                    </span>
                    <span className='hidden w-36 shrink-0 items-center gap-2 sm:flex'>
                      <PersonAvatar
                        person={lead}
                        className='size-6 text-[10px]'
                      />
                      <span className='text-muted-foreground truncate text-xs'>
                        {lead.name}
                      </span>
                    </span>
                  </div>
                </PresenceRow>
              );
            })}
          </AnimatePresence>
        </ul>
      </PageBody>
    </>
  );
}

export function MembersPage({ people }: { people: Person[] }) {
  const meta = countLabel(people.length, 'member', 'members');

  return (
    <>
      <PageToolbar title='Members' meta={meta} />
      <PageBody>
        <ul className={LIST_SURFACE}>
          {people.map((person) => {
            const isCurrentUser = person.id === CURRENT_USER_ID;

            return (
              <li key={person.id} className='flex h-12 items-center gap-3 px-3'>
                <PersonAvatar person={person} className='size-7 text-[10px]' />
                <span className='flex min-w-0 flex-1 items-center gap-2'>
                  <span className='truncate text-[13px] font-medium'>
                    {person.name}
                  </span>
                  {isCurrentUser && (
                    <Chip color='var(--muted-foreground)'>You</Chip>
                  )}
                </span>
                <span className='text-muted-foreground truncate text-xs'>
                  {person.role}
                </span>
              </li>
            );
          })}
        </ul>
      </PageBody>
    </>
  );
}

export function EmptyPageView({
  title,
  icon,
  page,
}: {
  title: string;
  icon: Icon;
  page: EmptyPage;
}) {
  return (
    <>
      <PageToolbar title={title} meta='Product team' />
      <PageBody>
        <EmptyState icon={icon} title={page.title} line={page.line} />
      </PageBody>
    </>
  );
}
