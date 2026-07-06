'use client';

import { useEffect, useState } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Sheet, SheetContent, SheetTitle } from '@/registry/ndeko/ui/sheet';

import { AppSidebar } from './app-sidebar';
import {
  CURRENT_USER_ID,
  NAV_GROUPS,
  PEOPLE,
  WORKSPACES,
  personOf,
  type NavItem,
  type PageId,
} from './data';
import { OverviewPage } from './overview-page';
import { ProjectHealthPage } from './project-health-page';
import { CommandPalette } from './search-palette';
import { TopBar } from './top-bar';
import { WeeklyReportPage } from './weekly-report-page';

const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

const NO_COUNTS = {};

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

function isPaletteShortcut(event: KeyboardEvent) {
  const isKKey = event.key.toLowerCase() === 'k';
  const hasModifier = event.metaKey || event.ctrlKey;
  return isKKey && hasModifier;
}

function keepWorkspace() {
  return undefined;
}

export default function Application02() {
  const [activePageId, setActivePageId] = useState<PageId>('overview');
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  const workspace = WORKSPACES[0];
  const activePage = navItemOf(activePageId);
  const ancestor = ancestorOf(activePageId, workspace.name);
  const currentUser = personOf(CURRENT_USER_ID);

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

  function hideSidebar() {
    setIsSidebarHidden(true);
  }

  function showSidebar() {
    setIsSidebarHidden(false);
  }

  function openNavigation() {
    setIsNavigationOpen(true);
  }

  const sidebarProps = {
    workspaces: WORKSPACES,
    workspace,
    onWorkspaceChange: keepWorkspace,
    groups: NAV_GROUPS,
    activePageId,
    counts: NO_COUNTS,
    person: currentUser,
    onNavigate: navigate,
    onOpenSearch: openSearch,
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
        />
        {activePageId === 'overview' && <OverviewPage />}
        {activePageId === 'weekly-report' && <WeeklyReportPage />}
        {activePageId === 'project-health' && <ProjectHealthPage />}
      </main>
      <CommandPalette
        open={isPaletteOpen}
        onOpenChange={setIsPaletteOpen}
        groups={NAV_GROUPS}
        onNavigate={navigate}
      />
    </div>
  );
}
