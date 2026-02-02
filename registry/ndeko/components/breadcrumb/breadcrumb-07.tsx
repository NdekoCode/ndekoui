'use client';

import { HomeIcon } from '@/registry/ndeko/lib/icons';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/registry/ndeko/ui/breadcrumb';

export default function Breadcrumb07() {
  return (
    <Breadcrumb>
      <BreadcrumbList className='bg-card hairline-ring ring-border rounded-lg px-3 py-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
        <BreadcrumbItem>
          <BreadcrumbLink href='#' aria-label='Home'>
            <HomeIcon className='size-4' />
          </BreadcrumbLink>
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
