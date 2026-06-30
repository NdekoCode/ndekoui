'use client';

import { DatePicker } from '@/registry/ndeko/components/navbar/_parts/date-picker';
import { Filters } from '@/registry/ndeko/components/navbar/_parts/filters';
import { BookmarkIcon, HomeIcon } from '@/registry/ndeko/lib/icons';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/registry/ndeko/ui/breadcrumb';
import { Button } from '@/registry/ndeko/ui/button';

export default function Navbar17() {
  return (
    <header className='hairline-b border-border px-4 md:px-6'>
      <div className='flex h-16 items-center justify-between gap-2 sm:gap-4'>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href='#' aria-label='Home'>
                <HomeIcon className='size-4' />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Reports</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className='flex items-center gap-2'>
          <DatePicker />
          <Filters />
          <Button
            variant='outline'
            className='max-sm:aspect-square max-sm:px-0'
          >
            <BookmarkIcon className='text-muted-foreground' />
            <span className='max-sm:sr-only'>Saved</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
