'use client';

import { useId } from 'react';

import { ArrowLeftIcon } from '@/registry/ndeko/lib/icons';

import { AccountMenu } from './account-menu';
import type { NavGroup, NavItem, PageId, Person, Workspace } from './data';
import { SearchTrigger } from './search-palette';
import { NAV_ROW, NavRow } from './sidebar-parts';
import { WorkspaceSwitcher } from './workspace-switcher';

type AppSidebarProps = {
  workspace: Workspace;
  groups: NavGroup[];
  activePageId: PageId;
  person: Person;
  onNavigate: (pageId: PageId) => void;
  onOpenSearch: () => void;
};

function GroupLabel({ group }: { group: NavGroup }) {
  if (!group.label) {
    return null;
  }
  return (
    <p className='text-muted-foreground flex h-6 items-center px-2 text-xs font-medium'>
      {group.label}
    </p>
  );
}

function keepWorkspace() {
  return undefined;
}

/** The settings rail. Back to app is a plain link, so the template can point it at the app it lives in. */
export function AppSidebar({
  workspace,
  groups,
  activePageId,
  person,
  onNavigate,
  onOpenSearch,
}: AppSidebarProps) {
  const indicatorId = useId();

  function selectItem(item: NavItem) {
    onNavigate(item.id);
  }

  function openWorkspaceSettings() {
    onNavigate('workspace');
  }

  return (
    <div className='flex h-full min-h-0 flex-col gap-3'>
      <div className='flex flex-col gap-2'>
        <WorkspaceSwitcher
          workspaces={[workspace]}
          current={workspace}
          onSelect={keepWorkspace}
          onOpenSettings={openWorkspaceSettings}
        />
        <div className='flex items-center'>
          <SearchTrigger onOpen={onOpenSearch} />
        </div>
      </div>
      <nav
        aria-label='Settings'
        className='-mx-2 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-2'
      >
        <a href='#' className={NAV_ROW}>
          <ArrowLeftIcon />
          <span className='relative min-w-0 flex-1 truncate'>Back to app</span>
        </a>
        {groups.map((group) => (
          <div key={group.id} className='flex flex-col gap-0.5'>
            <GroupLabel group={group} />
            <ul className='flex flex-col gap-px'>
              {group.items.map((item) => (
                <NavRow
                  key={item.id}
                  item={item}
                  isActive={item.id === activePageId}
                  indicatorId={indicatorId}
                  onSelect={selectItem}
                />
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <AccountMenu person={person} onOpenSettings={onNavigate} />
    </div>
  );
}
