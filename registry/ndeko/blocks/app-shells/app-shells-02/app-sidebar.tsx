'use client';

import { motion } from 'motion/react';
import { useId } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';

import { AccountMenu } from './account-menu';
import type { NavGroup, NavItem, PageId, Person, Workspace } from './data';
import { QuickCreateMenu, type CreateKind } from './quick-create-menu';
import { SearchTrigger } from './search-palette';
import { EntityTile, NavRow, morphOf } from './sidebar-parts';
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
  isCollapsed: boolean;
  onNavigate: (pageId: PageId) => void;
  onOpenSearch: () => void;
  onCreate: (kind: CreateKind) => void;
};

function labelTextOf(group: NavGroup) {
  if (group.team) {
    return group.team.name;
  }
  return group.label;
}

function GroupLabel({
  group,
  isCollapsed,
}: {
  group: NavGroup;
  isCollapsed: boolean;
}) {
  const labelText = labelTextOf(group);
  if (!labelText) {
    return null;
  }

  return (
    <p className='text-muted-foreground flex h-6 items-center gap-2 px-2 text-xs font-medium'>
      {group.team && <EntityTile entity={group.team} size='xs' />}
      <span className={cn('truncate', isCollapsed && 'sr-only')}>
        {labelText}
      </span>
    </p>
  );
}

export function AppSidebar({
  workspaces,
  workspace,
  onWorkspaceChange,
  groups,
  activePageId,
  counts,
  person,
  isCollapsed,
  onNavigate,
  onOpenSearch,
  onCreate,
}: AppSidebarProps) {
  const indicatorId = useId();
  const shouldReduceMotion = usePrefersReducedMotion();
  const morph = morphOf(shouldReduceMotion);

  function selectItem(item: NavItem) {
    onNavigate(item.id);
  }

  return (
    <div className='flex h-full min-h-0 flex-col gap-3'>
      <div className='flex flex-col gap-2'>
        <motion.div layout='position' transition={morph} className='flex'>
          <WorkspaceSwitcher
            workspaces={workspaces}
            current={workspace}
            isCollapsed={isCollapsed}
            onSelect={onWorkspaceChange}
          />
        </motion.div>
        <div className={cn('flex gap-2', isCollapsed && 'flex-col')}>
          <motion.div
            layout='position'
            transition={morph}
            className='flex min-w-0 flex-1'
          >
            <SearchTrigger isCollapsed={isCollapsed} onOpen={onOpenSearch} />
          </motion.div>
          <motion.div layout='position' transition={morph} className='flex'>
            <QuickCreateMenu isCollapsed={isCollapsed} onCreate={onCreate} />
          </motion.div>
        </div>
      </div>
      <motion.nav
        layout='position'
        transition={morph}
        aria-label='Main'
        className='-mx-2 flex min-h-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto px-2'
      >
        {groups.map((group) => (
          <div key={group.id} className='flex flex-col gap-0.5'>
            <GroupLabel group={group} isCollapsed={isCollapsed} />
            <ul className='flex flex-col gap-px'>
              {group.items.map((item) => (
                <NavRow
                  key={item.id}
                  item={item}
                  isActive={item.id === activePageId}
                  isCollapsed={isCollapsed}
                  indicatorId={indicatorId}
                  count={counts[item.id]}
                  onSelect={selectItem}
                />
              ))}
            </ul>
          </div>
        ))}
      </motion.nav>
      <AccountMenu person={person} isCollapsed={isCollapsed} />
    </div>
  );
}
