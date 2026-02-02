'use client';

import { Menu } from '@base-ui/react/menu';

import { GhostSelect } from '@/registry/ndeko/components/navbar/_parts/ghost-select';
import { Logo } from '@/registry/ndeko/components/navbar/_parts/logo';
import { NotificationMenu } from '@/registry/ndeko/components/navbar/_parts/notification-menu';
import { UserMenu } from '@/registry/ndeko/components/navbar/_parts/user-menu';
import { MENU_ITEM } from '@/registry/ndeko/lib/recipes';
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/registry/ndeko/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';

const PARENT_PAGES = ['Personal account', 'Projects'];

const PROJECTS = [
  { value: 'main', label: 'Main project' },
  { value: 'side', label: 'Side project' },
];

const MENU_TRIGGER =
  'hover:text-foreground focus-visible:ring-ring/50 data-popup-open:text-foreground flex rounded-sm outline-none transition-colors focus-visible:ring-[3px]';

export default function Navbar07() {
  return (
    <header className='hairline-b border-border px-4 md:px-6'>
      <div className='flex h-16 items-center justify-between gap-4'>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                href='#'
                aria-label='Home'
                className='text-foreground flex rounded-[9px]'
              >
                <Logo />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbItem className='md:hidden'>
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label='Show parent pages'
                  className={MENU_TRIGGER}
                >
                  <BreadcrumbEllipsis />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {PARENT_PAGES.map((page) => (
                    <Menu.LinkItem
                      key={page}
                      href='#'
                      closeOnClick
                      className={MENU_ITEM}
                    >
                      {page}
                    </Menu.LinkItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
            <BreadcrumbItem className='max-md:hidden'>
              <BreadcrumbLink href='#'>Personal account</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className='max-md:hidden'>
              /
            </BreadcrumbSeparator>
            <BreadcrumbItem className='max-md:hidden'>
              <BreadcrumbLink href='#'>Projects</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <GhostSelect
                items={PROJECTS}
                defaultValue='main'
                label='Select project'
                className='px-1.5'
              />
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className='flex items-center gap-4'>
          <NotificationMenu />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
