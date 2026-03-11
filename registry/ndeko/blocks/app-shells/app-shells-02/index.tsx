'use client';

import { useCallback, useEffect, useState } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Sheet, SheetContent, SheetTitle } from '@/registry/ndeko/ui/sheet';

import { AppSidebar, type PageCounts } from './app-sidebar';
import {
  CURRENT_USER_ID,
  EMPTY_PAGES,
  NAV_GROUPS,
  NOTIFICATIONS,
  PEOPLE,
  PROJECTS,
  TASKS,
  WORKSPACES,
  personOf,
  type NavItem,
  type Notification,
  type PageId,
  type Project,
  type Task,
} from './data';
import {
  EmptyPageView,
  InboxPage,
  MembersPage,
  ProjectsPage,
  TaskListPage,
} from './page-views';
import type { CreateKind } from './quick-create-menu';
import { CommandPalette } from './search-palette';
import { TopBar } from './top-bar';

const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

const FIRST_TASK_NUMBER = 100;

function navItemOf(pageId: PageId): NavItem {
  const item = NAV_ITEMS.find((candidate) => candidate.id === pageId);
  if (item) {
    return item;
  }
  return NAV_ITEMS[0];
}

function ancestorOf(pageId: PageId, workspaceName: string) {
  const group = NAV_GROUPS.find((candidate) =>
    candidate.items.some((item) => item.id === pageId)
  );
  if (group?.team) {
    return group.team.name;
  }
  if (group?.label) {
    return workspaceName;
  }
  return undefined;
}

function workspaceOf(workspaceId: string) {
  const workspace = WORKSPACES.find(
    (candidate) => candidate.id === workspaceId
  );
  if (workspace) {
    return workspace;
  }
  return WORKSPACES[0];
}

function numberOf(task: Task) {
  const digits = task.number.replace(/\D/g, '');
  return Number(digits);
}

function draftTaskAfter(tasks: Task[]): Task {
  const numbers = tasks.map(numberOf);
  const nextNumber = Math.max(FIRST_TASK_NUMBER, ...numbers) + 1;
  return {
    id: `task-${nextNumber}`,
    number: `LAT-${nextNumber}`,
    title: 'Untitled task',
    projectId: 'onboarding',
    assigneeId: CURRENT_USER_ID,
    due: 'No date',
    isDone: false,
  };
}

function draftProjectAfter(projects: Project[]): Project {
  const draftNumber = projects.length + 1;
  return {
    id: `project-${draftNumber}`,
    name: 'Untitled project',
    color: 'var(--muted-foreground)',
    leadId: CURRENT_USER_ID,
  };
}

function sidebarWidthOf(isCollapsed: boolean) {
  if (isCollapsed) {
    return 'w-10';
  }
  return 'w-60';
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

export default function AppShells02() {
  const [activePageId, setActivePageId] = useState<PageId>('my-tasks');
  const [workspaceId, setWorkspaceId] = useState(WORKSPACES[0].id);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(TASKS);
  const [projects, setProjects] = useState<Project[]>(PROJECTS);
  const [notifications, setNotifications] =
    useState<Notification[]>(NOTIFICATIONS);

  const workspace = workspaceOf(workspaceId);
  const activePage = navItemOf(activePageId);
  const ancestor = ancestorOf(activePageId, workspace.name);
  const currentUser = personOf(CURRENT_USER_ID);
  const myTasks = tasks.filter((task) => task.assigneeId === CURRENT_USER_ID);
  const myOpenTasks = myTasks.filter((task) => !task.isDone);
  const teamOpenTasks = tasks.filter((task) => !task.isDone);
  const unreadNotifications = notifications.filter((note) => note.isUnread);
  const counts: PageCounts = {
    inbox: unreadNotifications.length,
    'my-tasks': myOpenTasks.length,
    'team-tasks': teamOpenTasks.length,
  };
  const emptyPage = EMPTY_PAGES[activePageId];

  const createTask = useCallback(() => {
    setTasks((previous) => {
      const draft = draftTaskAfter(previous);
      return [draft, ...previous];
    });
    setActivePageId('my-tasks');
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isPaletteShortcut(event)) {
        event.preventDefault();
        setIsPaletteOpen((isOpen) => !isOpen);
        return;
      }
      if (isCreateShortcut(event)) {
        event.preventDefault();
        createTask();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [createTask]);

  function navigate(pageId: PageId) {
    setActivePageId(pageId);
    setIsNavigationOpen(false);
  }

  function create(kind: CreateKind) {
    setIsNavigationOpen(false);
    if (kind === 'task') {
      createTask();
      return;
    }
    if (kind === 'project') {
      setProjects((previous) => {
        const draft = draftProjectAfter(previous);
        return [...previous, draft];
      });
      setActivePageId('projects');
      return;
    }
    setActivePageId('members');
  }

  function createProject() {
    create('project');
  }

  function openSearch() {
    setIsNavigationOpen(false);
    setIsPaletteOpen(true);
  }

  function toggleSidebar() {
    setIsSidebarCollapsed((isCollapsed) => !isCollapsed);
  }

  function openNavigation() {
    setIsNavigationOpen(true);
  }

  function toggleTask(taskId: string) {
    setTasks((previous) =>
      previous.map((task) => {
        if (task.id !== taskId) {
          return task;
        }
        return { ...task, isDone: !task.isDone };
      })
    );
  }

  function readNotification(notificationId: string) {
    setNotifications((previous) =>
      previous.map((note) => {
        if (note.id !== notificationId) {
          return note;
        }
        return { ...note, isUnread: false };
      })
    );
  }

  function readAllNotifications() {
    setNotifications((previous) =>
      previous.map((note) => ({ ...note, isUnread: false }))
    );
  }

  const sidebarProps = {
    workspaces: WORKSPACES,
    workspace,
    onWorkspaceChange: setWorkspaceId,
    groups: NAV_GROUPS,
    activePageId,
    counts,
    person: currentUser,
    onNavigate: navigate,
    onOpenSearch: openSearch,
    onCreate: create,
  };

  return (
    <div className='bg-sidebar text-foreground flex h-dvh min-h-0 w-full md:p-2'>
      <aside aria-label='Sidebar' className='hidden shrink-0 md:block'>
        <AnimatedSize
          axis='width'
          className='m-0 h-full'
          contentClassName='h-full p-0'
        >
          <div
            className={cn('h-full pr-2', sidebarWidthOf(isSidebarCollapsed))}
          >
            <AppSidebar {...sidebarProps} isCollapsed={isSidebarCollapsed} />
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
          <AppSidebar {...sidebarProps} isCollapsed={false} />
        </SheetContent>
      </Sheet>
      <main className='bg-background md:hairline-ring md:ring-border flex min-w-0 flex-1 flex-col overflow-clip md:rounded-xl md:shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
        <TopBar
          page={activePage}
          ancestor={ancestor}
          people={PEOPLE}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={toggleSidebar}
          onOpenNavigation={openNavigation}
        />
        {activePageId === 'inbox' && (
          <InboxPage
            notifications={notifications}
            onRead={readNotification}
            onReadAll={readAllNotifications}
          />
        )}
        {activePageId === 'my-tasks' && (
          <TaskListPage
            key='my-tasks'
            title='My tasks'
            tasks={myTasks}
            showAssignee={false}
            onToggleTask={toggleTask}
            onCreateTask={createTask}
          />
        )}
        {activePageId === 'team-tasks' && (
          <TaskListPage
            key='team-tasks'
            title='Product tasks'
            tasks={tasks}
            showAssignee
            onToggleTask={toggleTask}
            onCreateTask={createTask}
          />
        )}
        {activePageId === 'projects' && (
          <ProjectsPage
            projects={projects}
            tasks={tasks}
            onCreateProject={createProject}
          />
        )}
        {activePageId === 'members' && <MembersPage people={PEOPLE} />}
        {emptyPage && (
          <EmptyPageView
            title={activePage.label}
            icon={activePage.icon}
            page={emptyPage}
          />
        )}
      </main>
      <CommandPalette
        open={isPaletteOpen}
        onOpenChange={setIsPaletteOpen}
        groups={NAV_GROUPS}
        onNavigate={navigate}
        onCreateTask={createTask}
      />
    </div>
  );
}
