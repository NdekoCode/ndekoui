'use client';

import { useId } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

import { AccountMenu } from './account-menu';
import type { NavGroup, NavItem, PageId, Person, Workspace } from './data';
import { NavRow } from './sidebar-parts';
import { WorkspaceSwitcher } from './workspace-switcher';

export type PageCounts = Partial<Record<PageId, number>>;

type AppSidebarProps = {
  workspaces: Workspace[];
  workspace: Workspace;
  groups: NavGroup[];
  activePageId: PageId;
  counts: PageCounts;
  person: Person;
  className?: string;
  onWorkspaceChange: (workspaceId: string) => void;
  onNavigate: (pageId: PageId) => void;
};

function GroupLabel({ label }: { label: string }) {
  return (
    <p className='text-muted-foreground flex h-6 items-center px-2 text-xs font-medium'>
      {label}
    </p>
  );
}

export function AppSidebar({
  workspaces,
  workspace,
  groups,
  activePageId,
  counts,
  person,
  className,
  onWorkspaceChange,
  onNavigate,
}: AppSidebarProps) {
  const indicatorId = useId();

  function selectItem(item: NavItem) {
    onNavigate(item.id);
  }

  return (
    <div className={cn('flex min-h-0 flex-col gap-3', className)}>
      <WorkspaceSwitcher
        workspaces={workspaces}
        current={workspace}
        onSelect={onWorkspaceChange}
      />
      <nav
        aria-label='Main'
        className='-mx-2 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-2'
      >
        {groups.map((group) => (
          <div key={group.id} className='flex flex-col gap-0.5'>
            {group.label && <GroupLabel label={group.label} />}
            <ul className='flex flex-col gap-px'>
              {group.items.map((item) => (
                <NavRow
                  key={item.id}
                  item={item}
                  isActive={item.id === activePageId}
                  indicatorId={indicatorId}
                  count={counts[item.id]}
                  onSelect={selectItem}
                />
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <AccountMenu person={person} />
    </div>
  );
}
