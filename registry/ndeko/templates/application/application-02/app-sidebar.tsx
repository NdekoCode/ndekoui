'use client';

import { useId } from 'react';

import { LayoutIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

import { AccountMenu } from './account-menu';
import type { NavGroup, NavItem, PageId, Person, Workspace } from './data';
import { SearchTrigger } from './search-palette';
import { EntityTile, NavRow } from './sidebar-parts';
import { WorkspaceSwitcher } from './workspace-switcher';

export type PageCounts = Partial<Record<PageId, number>>;

type AppSidebarProps = {
  workspaces: Workspace[];
  workspace: Workspace;
  onWorkspaceChange: (workspaceId: string) => void;
  groups: NavGroup[];
  activePageId: PageId;
  counts: PageCounts;
  person: Person;
  onNavigate: (pageId: PageId) => void;
  onOpenSearch: () => void;
  onHide?: () => void;
};

function GroupLabel({ group }: { group: NavGroup }) {
  if (group.team) {
    return (
      <p className='text-muted-foreground flex h-6 items-center gap-2 px-2 text-xs font-medium'>
        <EntityTile entity={group.team} size='xs' />
        {group.team.name}
      </p>
    );
  }
  if (group.label) {
    return (
      <p className='text-muted-foreground flex h-6 items-center px-2 text-xs font-medium'>
        {group.label}
      </p>
    );
  }
  return null;
}

export function AppSidebar({
  workspaces,
  workspace,
  onWorkspaceChange,
  groups,
  activePageId,
  counts,
  person,
  onNavigate,
  onOpenSearch,
  onHide,
}: AppSidebarProps) {
  const indicatorId = useId();
  const canHide = Boolean(onHide);

  function selectItem(item: NavItem) {
    onNavigate(item.id);
  }

  return (
    <div className='flex h-full min-h-0 flex-col gap-3'>
      <div className='flex flex-col gap-2'>
        <div className='flex items-center gap-1'>
          <WorkspaceSwitcher
            workspaces={workspaces}
            current={workspace}
            onSelect={onWorkspaceChange}
          />
          {canHide && (
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label='Hide sidebar'
              onClick={onHide}
              className='text-muted-foreground'
            >
              <LayoutIcon />
            </Button>
          )}
        </div>
        <div className='flex items-center'>
          <SearchTrigger onOpen={onOpenSearch} />
        </div>
      </div>
      <nav
        aria-label='Main'
        className='-mx-2 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-2'
      >
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
