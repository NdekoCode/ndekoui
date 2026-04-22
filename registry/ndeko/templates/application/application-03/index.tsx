'use client';

import { useEffect, useState } from 'react';

import { Sheet, SheetContent, SheetTitle } from '@/registry/ndeko/ui/sheet';

import { AppSidebar } from './app-sidebar';
import {
  CURRENT_USER_ID,
  INITIAL_NOTIFICATIONS,
  INITIAL_PROFILE,
  INITIAL_WORKSPACE,
  PEOPLE,
  SETTINGS_GROUPS,
  WORKSPACE_COLOR,
  WORKSPACE_FACTS,
  WORKSPACE_ID,
  type NavItem,
  type NotificationValues,
  type PageId,
  type Person,
  type ProfileValues,
  type Workspace,
  type WorkspaceValues,
} from './data';
import { NotificationsPage } from './notifications-page';
import { ProfilePage } from './profile-page';
import { CommandPalette } from './search-palette';
import { TopBar } from './top-bar';
import { WorkspacePage } from './workspace-page';

const NAV_ITEMS = SETTINGS_GROUPS.flatMap((group) => group.items);

const SETTINGS_ANCESTOR = 'Settings';

const MAX_INITIALS = 2;

function navItemOf(pageId: PageId): NavItem {
  const item = NAV_ITEMS.find((candidate) => candidate.id === pageId);
  if (item) {
    return item;
  }
  return NAV_ITEMS[0];
}

function initialsOf(name: string) {
  const words = name.trim().split(/\s+/);
  const firstLetters = words.map((word) => word.charAt(0));
  const initials = firstLetters.slice(0, MAX_INITIALS).join('');
  return initials.toUpperCase();
}

function personOf(personId: string) {
  const person = PEOPLE.find((candidate) => candidate.id === personId);
  if (person) {
    return person;
  }
  return PEOPLE[0];
}

function accountOf(profile: ProfileValues): Person {
  const person = personOf(CURRENT_USER_ID);
  return {
    ...person,
    name: profile.name,
    initials: initialsOf(profile.name),
    role: profile.title,
    avatar: profile.photo,
  };
}

function workspaceOf(values: WorkspaceValues): Workspace {
  return {
    id: WORKSPACE_ID,
    name: values.name,
    initials: initialsOf(values.name),
    color: WORKSPACE_COLOR,
    memberCount: WORKSPACE_FACTS.members,
  };
}

function isPaletteShortcut(event: KeyboardEvent) {
  const isKKey = event.key.toLowerCase() === 'k';
  const hasModifier = event.metaKey || event.ctrlKey;
  return isKKey && hasModifier;
}

export default function Application03() {
  const [activePageId, setActivePageId] = useState<PageId>('profile');
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileValues>(INITIAL_PROFILE);
  const [notifications, setNotifications] = useState<NotificationValues>(
    INITIAL_NOTIFICATIONS
  );
  const [workspaceValues, setWorkspaceValues] =
    useState<WorkspaceValues>(INITIAL_WORKSPACE);

  const activePage = navItemOf(activePageId);
  const account = accountOf(profile);
  const workspace = workspaceOf(workspaceValues);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isPaletteShortcut(event)) {
        event.preventDefault();
        setIsPaletteOpen((isOpen) => !isOpen);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  function navigate(pageId: PageId) {
    setActivePageId(pageId);
    setIsNavigationOpen(false);
  }

  function openSearch() {
    setIsNavigationOpen(false);
    setIsPaletteOpen(true);
  }

  function openNavigation() {
    setIsNavigationOpen(true);
  }

  const sidebarProps = {
    workspace,
    groups: SETTINGS_GROUPS,
    activePageId,
    person: account,
    onNavigate: navigate,
    onOpenSearch: openSearch,
  };

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
          ancestor={SETTINGS_ANCESTOR}
          people={PEOPLE}
          onOpenNavigation={openNavigation}
        />
        {activePageId === 'profile' && (
          <ProfilePage
            values={profile}
            workspaceName={workspace.name}
            onSaved={setProfile}
          />
        )}
        {activePageId === 'notifications' && (
          <NotificationsPage
            values={notifications}
            onSaved={setNotifications}
          />
        )}
        {activePageId === 'workspace' && (
          <WorkspacePage
            values={workspaceValues}
            onSaved={setWorkspaceValues}
          />
        )}
      </main>
      <CommandPalette
        open={isPaletteOpen}
        onOpenChange={setIsPaletteOpen}
        groups={SETTINGS_GROUPS}
        onNavigate={navigate}
      />
    </div>
  );
}
