'use client';

import { motion } from 'motion/react';
import { useId, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  ArchiveIcon,
  ChartLineIcon,
  ChevronDownIcon,
  ChevronsUpDownIcon,
  CircleCheckIcon,
  ClockIcon,
  FoldersIcon,
  InboxIcon,
  LogOutIcon,
  PlusIcon,
  SettingsIcon,
  UserIcon,
  UsersIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';
import { Kbd } from '@/registry/ndeko/ui/kbd';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';

import {
  AsideCloseButton,
  AsidePreview,
  AsideTitle,
} from './_parts/aside-frame';
import { travelOf } from './_parts/motion';
import { PEOPLE } from './_parts/people';
import { PersonAvatar } from './_parts/person-avatar';
import { Swap } from './_parts/swap';

type Workspace = { id: string; name: string; plan: string; color: string };

type NavItem = { id: string; label: string; icon: Icon; count?: number };

type Project = {
  id: string;
  name: string;
  color: string;
  openTasks: number;
  isTracked: boolean;
};

const WORKSPACES: Workspace[] = [
  {
    id: 'lattice',
    name: 'Lattice',
    plan: 'Team plan',
    color: 'var(--primary)',
  },
  {
    id: 'northfield',
    name: 'Northfield',
    plan: 'Free plan',
    color: 'var(--info)',
  },
];

const NAV_ITEMS: NavItem[] = [
  { id: 'inbox', label: 'Inbox', icon: InboxIcon, count: 3 },
  { id: 'tasks', label: 'My tasks', icon: CircleCheckIcon },
  { id: 'timesheets', label: 'Timesheets', icon: ClockIcon },
  { id: 'reports', label: 'Reports', icon: ChartLineIcon },
  { id: 'team', label: 'Team', icon: UsersIcon },
];

const PROJECTS: Project[] = [
  {
    id: 'atlas',
    name: 'Atlas redesign',
    color: 'var(--primary)',
    openTasks: 21,
    isTracked: true,
  },
  {
    id: 'billing',
    name: 'Billing API',
    color: 'var(--info)',
    openTasks: 9,
    isTracked: false,
  },
  {
    id: 'mobile',
    name: 'Mobile timer',
    color: 'var(--success)',
    openTasks: 14,
    isTracked: false,
  },
];

const ALL_PROJECTS_COUNT = 12;

const ARCHIVED_COUNT = 3;

const ACCOUNT = PEOPLE[0];

const ROW =
  'relative flex h-8 w-full cursor-pointer items-center gap-2.5 rounded-md px-2 text-left text-[13px] outline-none transition-colors duration-150 hover:bg-foreground/[0.04] focus-visible:ring-[3px] focus-visible:ring-ring/25';

function isWorkspaceId(value: unknown): value is string {
  return WORKSPACES.some((workspace) => workspace.id === value);
}

function WorkspaceTile({ workspace }: { workspace: Workspace }) {
  return <CompanyMark seed={workspace.name} size='lg' />;
}

function ActiveIndicator({ layoutId }: { layoutId: string }) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const transition = travelOf(shouldReduceMotion);

  return (
    <motion.span
      layoutId={layoutId}
      transition={transition}
      aria-hidden='true'
      className='bg-foreground/[0.07] absolute inset-0 -z-10 rounded-md'
    />
  );
}

function SidebarRow({
  isActive,
  indicatorId,
  onSelect,
  children,
}: {
  isActive: boolean;
  indicatorId: string;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  let current: 'page' | undefined;
  if (isActive) {
    current = 'page';
  }

  return (
    <button
      type='button'
      aria-current={current}
      onClick={onSelect}
      className={cn(ROW, isActive && 'font-medium')}
    >
      {isActive && <ActiveIndicator layoutId={indicatorId} />}
      {children}
    </button>
  );
}

function CountCap({ count, label }: { count: number; label: string }) {
  return (
    <span className='ml-auto flex'>
      <Kbd aria-hidden='true'>{count}</Kbd>
      <span className='sr-only'>{label}</span>
    </span>
  );
}

function WorkspaceSwitcher() {
  const [workspaceId, setWorkspaceId] = useState('lattice');
  const workspace =
    WORKSPACES.find((candidate) => candidate.id === workspaceId) ??
    WORKSPACES[0];

  function changeWorkspace(value: unknown) {
    if (isWorkspaceId(value)) {
      setWorkspaceId(value);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type='button'
            className='hover:bg-foreground/[0.04] focus-visible:ring-ring/25 data-popup-open:bg-foreground/[0.05] flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-lg p-1.5 text-left outline-none focus-visible:ring-[3px]'
          />
        }
      >
        <Swap swapKey={workspace.id}>
          <WorkspaceTile workspace={workspace} />
        </Swap>
        <span className='flex min-w-0 flex-1 flex-col'>
          <span className='truncate text-[13px] leading-tight font-semibold'>
            {workspace.name}
          </span>
          <span className='text-muted-foreground truncate text-xs'>
            {workspace.plan}
          </span>
        </span>
        <ChevronsUpDownIcon className='text-muted-foreground size-3.5 shrink-0' />
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56'>
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={workspaceId}
          onValueChange={changeWorkspace}
        >
          {WORKSPACES.map((item) => (
            <DropdownMenuRadioItem key={item.id} value={item.id} closeOnClick>
              <WorkspaceTile workspace={item} />
              {item.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AccountMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type='button'
            className='hover:bg-foreground/[0.04] focus-visible:ring-ring/25 data-popup-open:bg-foreground/[0.05] flex w-full cursor-pointer items-center gap-2.5 rounded-lg p-1.5 text-left outline-none focus-visible:ring-[3px]'
          />
        }
      >
        <PersonAvatar person={ACCOUNT} presence={ACCOUNT.presence} />
        <span className='flex min-w-0 flex-1 flex-col'>
          <span className='truncate text-[13px] font-medium'>
            {ACCOUNT.name}
          </span>
          <span className='text-muted-foreground truncate text-xs'>
            {ACCOUNT.email}
          </span>
        </span>
        <ChevronsUpDownIcon className='text-muted-foreground size-3.5 shrink-0' />
      </DropdownMenuTrigger>
      <DropdownMenuContent side='top' className='w-56'>
        <DropdownMenuItem>
          <UserIcon />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem>
          <SettingsIcon />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant='destructive'>
          <LogOutIcon />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function WorkspaceSidebar() {
  const [activeId, setActiveId] = useState('tasks');
  const [areProjectsOpen, setAreProjectsOpen] = useState(true);
  const indicatorId = useId();
  const projectsListId = useId();

  function toggleProjects() {
    setAreProjectsOpen((previous) => !previous);
  }

  return (
    <nav aria-label='Workspace' className='flex min-h-full flex-col gap-4 p-3'>
      <AsideTitle className='sr-only'>Navigation</AsideTitle>
      <div className='flex items-center gap-1'>
        <WorkspaceSwitcher />
        <AsideCloseButton label='Close navigation' />
      </div>
      <ul className='isolate flex flex-col gap-px'>
        {NAV_ITEMS.map((item) => {
          const ItemGlyph = item.icon;
          const isActive = activeId === item.id;

          function select() {
            setActiveId(item.id);
          }

          return (
            <li key={item.id}>
              <SidebarRow
                isActive={isActive}
                indicatorId={indicatorId}
                onSelect={select}
              >
                <ItemGlyph className='text-muted-foreground size-4 shrink-0' />
                {item.label}
                {item.count !== undefined && (
                  <CountCap count={item.count} label={`${item.count} unread`} />
                )}
              </SidebarRow>
            </li>
          );
        })}
      </ul>
      <section aria-label='Projects' className='flex flex-col gap-px'>
        <div className='flex items-center gap-0.5'>
          <button
            type='button'
            aria-expanded={areProjectsOpen}
            aria-controls={projectsListId}
            onClick={toggleProjects}
            className='text-muted-foreground hover:text-foreground focus-visible:ring-ring/25 flex h-7 flex-1 cursor-pointer items-center gap-1 rounded-md px-2 text-left text-xs font-medium outline-none focus-visible:ring-[3px]'
          >
            Projects
            <ChevronDownIcon
              className={cn(
                'size-3 transition-transform duration-200 ease-(--ease-out-strong)',
                !areProjectsOpen && '-rotate-90'
              )}
            />
          </button>
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label='Create project'
            className='text-muted-foreground'
          >
            <PlusIcon />
          </Button>
        </div>
        <AnimatedSize>
          {areProjectsOpen && (
            <ul id={projectsListId} className='isolate flex flex-col gap-px'>
              {PROJECTS.map((project) => {
                const isActive = activeId === project.id;

                function select() {
                  setActiveId(project.id);
                }

                return (
                  <li key={project.id}>
                    <SidebarRow
                      isActive={isActive}
                      indicatorId={indicatorId}
                      onSelect={select}
                    >
                      <MeshTile
                        seed={project.name}
                        color={project.color}
                        size='sm'
                      />
                      <span className='min-w-0 flex-1 truncate'>
                        {project.name}
                      </span>
                      {project.isTracked && (
                        <span className='text-primary-ink flex items-center'>
                          <ClockIcon className='size-3.5' strokeWidth={2.25} />
                          <span className='sr-only'>Timer running</span>
                        </span>
                      )}
                      <CountCap
                        count={project.openTasks}
                        label={`${project.openTasks} open tasks`}
                      />
                    </SidebarRow>
                  </li>
                );
              })}
              <li>
                <SidebarRow
                  isActive={activeId === 'all-projects'}
                  indicatorId={indicatorId}
                  onSelect={() => setActiveId('all-projects')}
                >
                  <FoldersIcon className='text-muted-foreground size-4 shrink-0' />
                  All projects
                  <CountCap
                    count={ALL_PROJECTS_COUNT}
                    label={`${ALL_PROJECTS_COUNT} projects`}
                  />
                </SidebarRow>
              </li>
              <li>
                <SidebarRow
                  isActive={activeId === 'archived'}
                  indicatorId={indicatorId}
                  onSelect={() => setActiveId('archived')}
                >
                  <ArchiveIcon className='text-muted-foreground size-4 shrink-0' />
                  Archived
                  <CountCap
                    count={ARCHIVED_COUNT}
                    label={`${ARCHIVED_COUNT} archived projects`}
                  />
                </SidebarRow>
              </li>
            </ul>
          )}
        </AnimatedSize>
      </section>
      <div className='mt-auto pt-6'>
        <AccountMenu />
      </div>
    </nav>
  );
}

export default function Aside06() {
  return (
    <AsidePreview
      triggerLabel='Open navigation'
      side='left'
      className='max-w-72'
    >
      <WorkspaceSidebar />
    </AsidePreview>
  );
}
