'use client';

import { Menu } from '@base-ui/react/menu';

import { FoldersIcon } from '@/registry/ndeko/lib/icons';
import { MENU_ITEM } from '@/registry/ndeko/lib/recipes';
import {
  Breadcrumb,
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
  'hover:text-foreground focus-visible:ring-ring/50 data-popup-open:text-foreground flex size-5 items-center justify-center rounded-sm outline-none transition-colors focus-visible:ring-[3px]';

export default function Breadcrumb02() {
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
              aria-label='Show hidden folders'
              className={MENU_TRIGGER}
            >
              <FoldersIcon className='size-4' />
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
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
