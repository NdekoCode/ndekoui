'use client';

import { useCallback, useEffect, useState } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Sheet, SheetContent, SheetTitle } from '@/registry/ndeko/ui/sheet';

import { AppSidebar, type PageCounts } from './app-sidebar';
import { BoardPage } from './board-page';
import { tasksInColumnsOf, type Columns } from './board-model';
import {
  CURRENT_USER_ID,
  INBOX,
  NAV_GROUPS,
  PEOPLE,
  TASKS,
  WORKSPACES,
  type FeedComment,
  type InboxItem,
  type NavItem,
  type PageId,
  type StatusId,
  type Task,
} from './data';
import { InboxPage } from './inbox-page';
import { InboxPopover } from './inbox-popover';
import type { CreateKind } from './quick-create-menu';
import { CommandPalette } from './search-palette';
import { TaskDrawer } from './task-drawer';
import { newTaskOf, patchedTask, withComment } from './task-edits';
import { NEW_TASK_STATUS, TaskListPage } from './task-list-page';
import { currentUser, isAssignedTo, nextNumberOf } from './task-model';
import { TeamPage } from './team-page';
import { TopBar } from './top-bar';
import { useTeam } from './use-team';

const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

function navItemOf(pageId: PageId): NavItem {
  const item = NAV_ITEMS.find((candidate) => candidate.id === pageId);
  if (item) {
    return item;
  }
  return NAV_ITEMS[0];
}

function ancestorOf(pageId: PageId) {
  const group = NAV_GROUPS.find((candidate) =>
    candidate.items.some((item) => item.id === pageId)
  );
  return group?.team?.name;
}

function replacedTask(
  tasks: Task[],
  taskId: string,
  update: (task: Task) => Task
) {
  return tasks.map((task) => {
    if (task.id !== taskId) {
      return task;
    }
    return update(task);
  });
}

function withRead(items: InboxItem[], itemId: string, isUnread: boolean) {
  return items.map((item) => {
    if (item.id !== itemId) {
      return item;
    }
    return { ...item, isUnread };
  });
}

function inboxSequenceOf(items: InboxItem[], tasks: Task[]) {
  const ids: string[] = [];
  for (const item of items) {
    const task = tasks.find(
      (candidate) => candidate.number === item.taskNumber
    );
    const isNew = task !== undefined && !ids.includes(task.id);
    if (task && isNew) {
      ids.push(task.id);
    }
  }
  return ids;
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const isField = target.matches('input, textarea, select');
  return isField || target.isContentEditable;
}

function isPaletteShortcut(event: KeyboardEvent) {
  const isKKey = event.key.toLowerCase() === 'k';
  const hasModifier = event.metaKey || event.ctrlKey;
  return isKKey && hasModifier;
}

function isCreateShortcut(event: KeyboardEvent) {
  const isCKey = event.key.toLowerCase() === 'c';
  const hasModifier = event.metaKey || event.ctrlKey || event.altKey;
  const isTyping = isTypingTarget(event.target);
  return isCKey && !hasModifier && !isTyping;
}

function keepWorkspace() {
  return undefined;
}

export default function Application01() {
  const [activePageId, setActivePageId] = useState<PageId>('my-tasks');
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(TASKS);
  const [inbox, setInbox] = useState<InboxItem[]>(INBOX);
  const [draftStatus, setDraftStatus] = useState<StatusId | null>(null);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [shownTaskId, setShownTaskId] = useState<string | null>(null);
  const [sequence, setSequence] = useState<string[]>([]);
  const team = useTeam();

  const workspace = WORKSPACES[0];
  const activePage = navItemOf(activePageId);
  const ancestor = ancestorOf(activePageId);
  const me = currentUser();
  const myTasks = tasks.filter((task) => isAssignedTo(task, CURRENT_USER_ID));
  const myOpenTasks = myTasks.filter((task) => task.status !== 'done');
  const unreadItems = inbox.filter((item) => item.isUnread);
  const isDrawerOpen = openTaskId !== null;
  const counts: PageCounts = {
    inbox: unreadItems.length,
    'my-tasks': myOpenTasks.length,
  };

  const startNewTask = useCallback(() => {
    setIsNavigationOpen(false);
    setActivePageId('my-tasks');
    setDraftStatus(NEW_TASK_STATUS);
  }, []);

  const showTask = useCallback((taskId: string) => {
    setOpenTaskId(taskId);
    setShownTaskId(taskId);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isPaletteShortcut(event)) {
        event.preventDefault();
        setIsPaletteOpen((isOpen) => !isOpen);
        return;
      }
      if (isDrawerOpen) {
        return;
      }
      if (isCreateShortcut(event)) {
        event.preventDefault();
        startNewTask();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, startNewTask]);

  function navigate(pageId: PageId) {
    setActivePageId(pageId);
    setIsNavigationOpen(false);
  }

  function create(kind: CreateKind) {
    if (kind === 'task') {
      startNewTask();
      return;
    }
    navigate('team');
  }

  function openSearch() {
    setIsNavigationOpen(false);
    setIsPaletteOpen(true);
  }

  function hideSidebar() {
    setIsSidebarHidden(true);
  }

  function showSidebar() {
    setIsSidebarHidden(false);
  }

  function openNavigation() {
    setIsNavigationOpen(true);
  }

  function openTask(taskId: string, nextSequence: string[]) {
    setSequence(nextSequence);
    showTask(taskId);
  }

  function closeDrawer() {
    setOpenTaskId(null);
  }

  function patchTask(taskId: string, patch: Partial<Task>) {
    setTasks((current) =>
      replacedTask(current, taskId, (task) => patchedTask(task, patch))
    );
  }

  function commentOnTask(taskId: string, comment: FeedComment) {
    setTasks((current) =>
      replacedTask(current, taskId, (task) => withComment(task, comment))
    );
  }

  function addTask(status: StatusId, title: string, assigneeIds: string[]) {
    const number = nextNumberOf(tasks);
    const task = newTaskOf(number, status, title, assigneeIds);
    setTasks((current) => [task, ...current]);
    return task.id;
  }

  function createMyTask(status: StatusId, title: string) {
    addTask(status, title, [CURRENT_USER_ID]);
  }

  function createBoardTask(status: StatusId, title: string) {
    return addTask(status, title, []);
  }

  function applyColumns(columns: Columns) {
    setTasks((current) => tasksInColumnsOf(current, columns));
  }

  function openInboxItem(itemId: string) {
    const item = inbox.find((entry) => entry.id === itemId);
    setInbox((current) => withRead(current, itemId, false));
    if (!item) {
      return;
    }
    const task = tasks.find((entry) => entry.number === item.taskNumber);
    if (!task) {
      return;
    }
    openTask(task.id, inboxSequenceOf(inbox, tasks));
  }

  function toggleRead(itemId: string) {
    const item = inbox.find((entry) => entry.id === itemId);
    if (!item) {
      return;
    }
    setInbox((current) => withRead(current, itemId, !item.isUnread));
  }

  function archive(itemId: string) {
    setInbox((current) => current.filter((item) => item.id !== itemId));
  }

  function markAllRead() {
    setInbox((current) =>
      current.map((item) => ({ ...item, isUnread: false }))
    );
  }

  const sidebarProps = {
    workspaces: WORKSPACES,
    workspace,
    onWorkspaceChange: keepWorkspace,
    groups: NAV_GROUPS,
    activePageId,
    counts,
    person: me,
    onNavigate: navigate,
    onOpenSearch: openSearch,
    onCreate: create,
  };

  const inboxActions = {
    onOpen: openInboxItem,
    onToggleRead: toggleRead,
    onArchive: archive,
    onMarkAllRead: markAllRead,
  };

  return (
    <div className='bg-sidebar text-foreground flex h-dvh min-h-0 w-full md:p-2'>
      <aside aria-label='Sidebar' className='hidden shrink-0 md:block'>
        <AnimatedSize
          axis='width'
          inert={isSidebarHidden}
          className='m-0 h-full'
          contentClassName={cn('h-full p-0', isSidebarHidden && 'w-0')}
        >
          <div className='h-full w-60 pr-2'>
            <AppSidebar {...sidebarProps} onHide={hideSidebar} />
          </div>
        </AnimatedSize>
      </aside>
      <Sheet open={isNavigationOpen} onOpenChange={setIsNavigationOpen}>
        <SheetContent
          side='left'
          showCloseButton={false}
          className='bg-sidebar w-72 gap-0 p-2'
        >
          <SheetTitle className='sr-only'>Navigation</SheetTitle>
          <AppSidebar {...sidebarProps} />
        </SheetContent>
      </Sheet>
      <main className='bg-background md:hairline-ring md:ring-border flex min-w-0 flex-1 flex-col overflow-clip md:rounded-xl md:shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
        <TopBar
          page={activePage}
          ancestor={ancestor}
          people={PEOPLE}
          isSidebarHidden={isSidebarHidden}
          onShowSidebar={showSidebar}
          onOpenNavigation={openNavigation}
        >
          <InboxPopover items={inbox} {...inboxActions} />
        </TopBar>
        {activePageId === 'inbox' && (
          <InboxPage items={inbox} {...inboxActions} />
        )}
        {activePageId === 'my-tasks' && (
          <TaskListPage
            tasks={myTasks}
            openTaskId={openTaskId}
            draftStatus={draftStatus}
            onDraftStatusChange={setDraftStatus}
            onOpenTask={openTask}
            onPatchTask={patchTask}
            onCreateTask={createMyTask}
          />
        )}
        {activePageId === 'board' && (
          <BoardPage
            tasks={tasks}
            onColumnsChange={applyColumns}
            onCreateTask={createBoardTask}
          />
        )}
        {activePageId === 'team' && <TeamPage team={team} />}
      </main>
      <TaskDrawer
        tasks={tasks}
        sequence={sequence}
        openTaskId={openTaskId}
        shownTaskId={shownTaskId}
        onOpenTask={showTask}
        onClose={closeDrawer}
        onPatch={patchTask}
        onComment={commentOnTask}
      />
      <CommandPalette
        open={isPaletteOpen}
        onOpenChange={setIsPaletteOpen}
        groups={NAV_GROUPS}
        onNavigate={navigate}
        onCreateTask={startNewTask}
      />
    </div>
  );
}
