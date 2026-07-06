'use client';

import { LayoutIcon, MenuIcon } from '@/registry/ndeko/lib/icons';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/registry/ndeko/ui/breadcrumb';
import { Button } from '@/registry/ndeko/ui/button';

import type { NavItem, Person } from './data';
import { PersonAvatar } from './task-glyphs';

const STACK_LIMIT = 4;

function AvatarStack({ people }: { people: Person[] }) {
  const shown = people.slice(0, STACK_LIMIT);
  const hiddenCount = people.length - shown.length;
  const hasHidden = hiddenCount > 0;

  return (
    <div
      role='group'
      aria-label='Team members'
      className='hidden items-center sm:flex'
    >
      {shown.map((person) => (
        <PersonAvatar
          key={person.id}
          person={person}
          className='ring-background -ml-1.5 size-6 text-[10px] ring-2 first:ml-0'
        />
      ))}
      {hasHidden && (
        <span className='bg-muted text-muted-foreground ring-background -ml-1.5 inline-flex size-6 items-center justify-center rounded-full text-[10px] font-medium tabular-nums ring-2'>
          +{hiddenCount}
        </span>
      )}
    </div>
  );
}

type TopBarProps = {
  page: NavItem;
  ancestor?: string;
  people: Person[];
  isSidebarHidden: boolean;
  onShowSidebar: () => void;
  onOpenNavigation: () => void;
  children?: React.ReactNode;
};

export function TopBar({
  page,
  ancestor,
  people,
  isSidebarHidden,
  onShowSidebar,
  onOpenNavigation,
  children,
}: TopBarProps) {
  const PageIcon = page.icon;
  const hasAncestor = Boolean(ancestor);

  return (
    <header className='hairline-b border-border flex h-11 shrink-0 items-center gap-2 px-3 md:px-4'>
      <Button
        variant='ghost'
        size='icon-sm'
        aria-label='Open navigation'
        onClick={onOpenNavigation}
        className='text-muted-foreground md:hidden'
      >
        <MenuIcon />
      </Button>
      {isSidebarHidden && (
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label='Show sidebar'
          onClick={onShowSidebar}
          className='text-muted-foreground hidden md:inline-flex'
        >
          <LayoutIcon />
        </Button>
      )}
      <Breadcrumb className='min-w-0'>
        <BreadcrumbList className='flex-nowrap'>
          <li aria-hidden='true' className='flex'>
            <PageIcon className='text-muted-foreground size-4 shrink-0' />
          </li>
          {hasAncestor && (
            <>
              <BreadcrumbItem className='hidden sm:inline-flex'>
                {ancestor}
              </BreadcrumbItem>
              <BreadcrumbSeparator className='hidden sm:block' />
            </>
          )}
          <BreadcrumbItem className='min-w-0'>
            <BreadcrumbPage className='truncate'>{page.label}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className='ml-auto flex items-center gap-2'>
        <AvatarStack people={people} />
        {children}
      </div>
    </header>
  );
}
