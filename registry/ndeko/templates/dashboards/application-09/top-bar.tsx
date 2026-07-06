'use client';

import { MenuIcon } from '@/registry/ndeko/lib/icons';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/registry/ndeko/ui/breadcrumb';
import { Button } from '@/registry/ndeko/ui/button';

import type { NavItem } from './data';
import { NotificationMenu } from './notification-menu';
import { SearchTrigger } from './search-palette';
import type { NotificationEntry } from './session';

type TopBarProps = {
  workspaceName: string;
  page: NavItem;
  notifications: NotificationEntry[];
  onOpenNavigation: () => void;
  onOpenSearch: () => void;
  onReadNotifications: () => void;
};

export function TopBar({
  workspaceName,
  page,
  notifications,
  onOpenNavigation,
  onOpenSearch,
  onReadNotifications,
}: TopBarProps) {
  const PageIcon = page.icon;

  return (
    <header className='hairline-b border-border flex h-11 shrink-0 items-center gap-2 px-3 @2xl/app:px-4'>
      <Button
        variant='ghost'
        size='icon-sm'
        aria-label='Open navigation'
        data-nav-open
        onClick={onOpenNavigation}
        className='text-muted-foreground @3xl/app:hidden'
      >
        <MenuIcon />
      </Button>
      <Breadcrumb className='min-w-0'>
        <BreadcrumbList className='flex-nowrap'>
          <li aria-hidden='true' className='flex'>
            <PageIcon className='text-muted-foreground size-4 shrink-0' />
          </li>
          <BreadcrumbItem className='hidden @xl/app:inline-flex'>
            {workspaceName}
          </BreadcrumbItem>
          <BreadcrumbSeparator className='hidden @xl/app:block' />
          <BreadcrumbItem className='min-w-0'>
            <BreadcrumbPage className='truncate'>{page.label}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className='ms-auto flex items-center gap-1.5'>
        <SearchTrigger onOpen={onOpenSearch} />
        <NotificationMenu
          notifications={notifications}
          onReadAll={onReadNotifications}
        />
      </div>
    </header>
  );
}
