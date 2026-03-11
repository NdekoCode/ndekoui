'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useId } from 'react';

import { ArrowLeftIcon } from '@/registry/ndeko/lib/icons';

import { AccountMenu } from './account-menu';
import type {
  NavGroup,
  NavItem,
  PageId,
  Person,
  SettingsPageId,
  Workspace,
} from './data';
import { QuickCreateMenu, type CreateKind } from './quick-create-menu';
import { SearchTrigger } from './search-palette';
import { EntityTile, NAV_ROW, NavRow } from './sidebar-parts';
import { WorkspaceSwitcher } from './workspace-switcher';

export type PageCounts = Partial<Record<PageId, number>>;

export type SidebarMode = 'app' | 'settings';

const MODE_SHIFT_PX = 12;

const MODE_TRANSITION: Transition = {
  duration: 0.22,
  ease: [0.23, 1, 0.32, 1],
};

const MODE_VARIANTS: Variants = {
  enter: (direction: number) => {
    const offset = direction * MODE_SHIFT_PX;
    return { opacity: 0, x: offset };
  },
  visible: { opacity: 1, x: 0 },
  exit: (direction: number) => {
    const offset = direction * MODE_SHIFT_PX;
    return { opacity: 0, x: -offset };
  },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function modeVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return MODE_VARIANTS;
}

function navLabelOf(mode: SidebarMode) {
  if (mode === 'settings') {
    return 'Settings';
  }
  return 'Main';
}

function directionOf(mode: SidebarMode) {
  if (mode === 'settings') {
    return 1;
  }
  return -1;
}

type AppSidebarProps = {
  mode: SidebarMode;
  workspaces: Workspace[];
  workspace: Workspace;
  onWorkspaceChange: (workspaceId: string) => void;
  groups: NavGroup[];
  activePageId: PageId;
  counts: PageCounts;
  person: Person;
  onNavigate: (pageId: PageId) => void;
  onBackToApp: () => void;
  onOpenSettings: (pageId: SettingsPageId) => void;
  onOpenSearch: () => void;
  onCreate: (kind: CreateKind) => void;
};

function GroupLabel({ group }: { group: NavGroup }) {
  if (group.team) {
    return (
      <p className='text-muted-foreground flex h-6 items-center gap-2 px-2 text-xs font-medium'>
        <EntityTile entity={group.team} size='xs' />
        <span className='truncate'>{group.team.name}</span>
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
  mode,
  workspaces,
  workspace,
  onWorkspaceChange,
  groups,
  activePageId,
  counts,
  person,
  onNavigate,
  onBackToApp,
  onOpenSettings,
  onOpenSearch,
  onCreate,
}: AppSidebarProps) {
  const indicatorId = useId();
  const shouldReduceMotion = useReducedMotion();
  const modeVariants = modeVariantsOf(shouldReduceMotion);
  const direction = directionOf(mode);
  const isSettingsMode = mode === 'settings';
  const modeIndicatorId = `${indicatorId}-${mode}`;

  function selectItem(item: NavItem) {
    onNavigate(item.id);
  }

  function openWorkspaceSettings() {
    onOpenSettings('settings-team-general');
  }

  return (
    <div className='flex h-full min-h-0 flex-col gap-3'>
      <div className='flex flex-col gap-2'>
        <WorkspaceSwitcher
          workspaces={workspaces}
          current={workspace}
          onSelect={onWorkspaceChange}
          onOpenSettings={openWorkspaceSettings}
        />
        <div className='flex items-center gap-2'>
          <SearchTrigger onOpen={onOpenSearch} />
          <QuickCreateMenu onCreate={onCreate} />
        </div>
      </div>
      <div className='-mx-2 flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto px-2'>
        <AnimatePresence mode='popLayout' initial={false} custom={direction}>
          <motion.nav
            key={mode}
            custom={direction}
            variants={modeVariants}
            initial='enter'
            animate='visible'
            exit='exit'
            transition={MODE_TRANSITION}
            aria-label={navLabelOf(mode)}
            className='flex flex-col gap-4'
          >
            {isSettingsMode && (
              <button type='button' onClick={onBackToApp} className={NAV_ROW}>
                <ArrowLeftIcon />
                <span className='relative min-w-0 flex-1 truncate'>
                  Back to app
                </span>
              </button>
            )}
            {groups.map((group) => (
              <div key={group.id} className='flex flex-col gap-0.5'>
                <GroupLabel group={group} />
                <ul className='flex flex-col gap-px'>
                  {group.items.map((item) => (
                    <NavRow
                      key={item.id}
                      item={item}
                      isActive={item.id === activePageId}
                      indicatorId={modeIndicatorId}
                      count={counts[item.id]}
                      onSelect={selectItem}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </motion.nav>
        </AnimatePresence>
      </div>
      <AccountMenu person={person} onOpenSettings={onOpenSettings} />
    </div>
  );
}
