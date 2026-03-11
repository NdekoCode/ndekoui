'use client';

import { useCallback, useEffect, useState } from 'react';

import { Sheet, SheetContent, SheetTitle } from '@/registry/ndeko/ui/sheet';

import { AppSidebar, type PageCounts, type SidebarMode } from './app-sidebar';
import {
  CURRENT_USER_ID,
  EMPTY_PAGES,
  INITIAL_ROLES,
  LABELS,
  NAV_GROUPS,
  NOTIFICATIONS,
  PEOPLE,
  PRODUCT_TEAM,
  PROJECTS,
  SETTINGS_GROUPS,
  STATUSES,
  TASKS,
  WORKSPACES,
  personOf,
  type AppPageId,
  type NavGroup,
  type NavItem,
  type Notification,
  type PageId,
  type Project,
  type SettingsPageId,
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
import { SettingsView, type SettingsState } from './settings-pages';
import { TopBar } from './top-bar';

const NAV_ITEMS = [...NAV_GROUPS, ...SETTINGS_GROUPS].flatMap(
  (group) => group.items
);

const FIRST_TASK_NUMBER = 100;

const SETTINGS_ANCESTOR = 'Settings';

const INITIAL_USER = personOf(CURRENT_USER_ID);

const INITIAL_SETTINGS: SettingsState = {
  fullName: INITIAL_USER.name,
  email: 'amara@lattice.example',
  title: INITIAL_USER.role,
  timeZone: 'Africa/Lagos',
  weekStart: 'monday',
  remindToTrack: true,
  stopWhenIdle: false,
  showSeconds: false,
  mailAssignments: true,
  mailMentions: true,
  mailWeeklySummary: false,
  appComments: true,
  appStatusChanges: false,
  teamName: PRODUCT_TEAM.name,
  teamKey: 'LAT',
  visibility: 'private',
  roles: INITIAL_ROLES,
  statuses: STATUSES,
  labels: LABELS,
};

function isSettingsPage(pageId: PageId): pageId is SettingsPageId {
  return pageId.startsWith('settings-');
}

function navItemOf(pageId: PageId): NavItem {
  const item = NAV_ITEMS.find((candidate) => candidate.id === pageId);
  if (item) {
    return item;
  }
  return NAV_ITEMS[0];
}

function ancestorOf(pageId: PageId, workspaceName: string, teamName: string) {
  if (isSettingsPage(pageId)) {
    return SETTINGS_ANCESTOR;
  }
  const group = NAV_GROUPS.find((candidate) =>
    candidate.items.some((item) => item.id === pageId)
  );
  if (group?.team) {
    return teamName;
  }
  if (group?.label) {
    return workspaceName;
  }
  return undefined;
}

function withTeamName(groups: NavGroup[], teamName: string): NavGroup[] {
  return groups.map((group) => {
    if (!group.team) {
      return group;
    }
    const team = { ...group.team, name: teamName };
    return { ...group, team };
  });
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

function emptyPageOf(pageId: PageId) {
  if (isSettingsPage(pageId)) {
    return undefined;
  }
  return EMPTY_PAGES[pageId];
}

function modeOf(pageId: PageId): SidebarMode {
  if (isSettingsPage(pageId)) {
    return 'settings';
  }
  return 'app';
}

export default function AppShells03() {
  const [activePageId, setActivePageId] = useState<PageId>('settings-profile');
  const [lastAppPageId, setLastAppPageId] = useState<AppPageId>('my-tasks');
  const [workspaceId, setWorkspaceId] = useState(WORKSPACES[0].id);
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(TASKS);
  const [projects, setProjects] = useState<Project[]>(PROJECTS);
  const [notifications, setNotifications] =
    useState<Notification[]>(NOTIFICATIONS);
  const [settings, setSettings] = useState<SettingsState>(INITIAL_SETTINGS);

  const mode = modeOf(activePageId);
  const workspace = workspaceOf(workspaceId);
  const appGroups = withTeamName(NAV_GROUPS, settings.teamName);
  const settingsGroups = withTeamName(SETTINGS_GROUPS, settings.teamName);
  let sidebarGroups = appGroups;
  if (mode === 'settings') {
    sidebarGroups = settingsGroups;
  }
  const activePage = navItemOf(activePageId);
  const ancestor = ancestorOf(activePageId, workspace.name, settings.teamName);
  const currentUser = {
    ...INITIAL_USER,
    name: settings.fullName,
    role: settings.title,
  };
  const myTasks = tasks.filter((task) => task.assigneeId === CURRENT_USER_ID);
  const myOpenTasks = myTasks.filter((task) => !task.isDone);
  const teamOpenTasks = tasks.filter((task) => !task.isDone);
  const unreadNotifications = notifications.filter((note) => note.isUnread);
  const counts: PageCounts = {
    inbox: unreadNotifications.length,
    'my-tasks': myOpenTasks.length,
    'team-tasks': teamOpenTasks.length,
  };

  const createTask = useCallback(() => {
    setTasks((previous) => {
      const draft = draftTaskAfter(previous);
      return [draft, ...previous];
    });
    setActivePageId('my-tasks');
    setLastAppPageId('my-tasks');
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
    if (!isSettingsPage(pageId)) {
      setLastAppPageId(pageId);
    }
  }

  function backToApp() {
    navigate(lastAppPageId);
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
      navigate('projects');
      return;
    }
    navigate('settings-team-members');
  }

  function createProject() {
    create('project');
  }

  function openSearch() {
    setIsNavigationOpen(false);
    setIsPaletteOpen(true);
  }

  function openNavigation() {
    setIsNavigationOpen(true);
  }

  function changeSettings(patch: Partial<SettingsState>) {
    setSettings((previous) => ({ ...previous, ...patch }));
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
    mode,
    workspaces: WORKSPACES,
    workspace,
    onWorkspaceChange: setWorkspaceId,
    groups: sidebarGroups,
    activePageId,
    counts,
    person: currentUser,
    onNavigate: navigate,
    onBackToApp: backToApp,
    onOpenSettings: navigate,
    onOpenSearch: openSearch,
    onCreate: create,
  };
  const emptyPage = emptyPageOf(activePageId);

  return (
    <div className='bg-sidebar text-foreground flex h-dvh min-h-0 w-full md:p-2'>
      <aside
        aria-label='Sidebar'
        className='hidden w-60 shrink-0 pr-2 md:block'
      >
        <AppSidebar {...sidebarProps} />
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
          onOpenNavigation={openNavigation}
        />
        {isSettingsPage(activePageId) && (
          <SettingsView
            pageId={activePageId}
            settings={settings}
            onChange={changeSettings}
          />
        )}
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
            title={`${settings.teamName} tasks`}
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
            meta={`${settings.teamName} team`}
            icon={activePage.icon}
            page={emptyPage}
          />
        )}
      </main>
      <CommandPalette
        open={isPaletteOpen}
        onOpenChange={setIsPaletteOpen}
        groups={appGroups}
        onNavigate={navigate}
        onCreateTask={createTask}
      />
    </div>
  );
}
