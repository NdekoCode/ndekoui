'use client';

import { Menu } from '@base-ui/react/menu';

import { MENU_ITEM } from '@/registry/ndeko/lib/recipes';
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/registry/ndeko/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';

const HIDDEN_PAGES = ['Documentation', 'Themes', 'GitHub'];

const MENU_TRIGGER =
  'hover:text-foreground focus-visible:ring-ring/50 data-popup-open:text-foreground flex rounded-sm outline-none transition-colors focus-visible:ring-[3px]';

export default function Breadcrumb01() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href='#'>Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label='Show hidden pages'
              className={MENU_TRIGGER}
            >
              <BreadcrumbEllipsis />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {HIDDEN_PAGES.map((page) => (
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
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href='#'>Components</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
