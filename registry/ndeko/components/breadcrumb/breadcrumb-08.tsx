'use client';

import { DatabaseIcon } from '@/registry/ndeko/lib/icons';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/registry/ndeko/ui/breadcrumb';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';

const DATABASES = [
  { value: 'orion', label: 'Orion' },
  { value: 'sigma', label: 'Sigma' },
  { value: 'dorado', label: 'Dorado' },
];

export default function Breadcrumb08() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href='#'>Databases</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <Select items={DATABASES} defaultValue='orion'>
            <SelectTrigger
              aria-label='Select database'
              className='w-fit min-w-36'
            >
              <DatabaseIcon className='text-muted-foreground' />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATABASES.map((database) => (
                <SelectItem key={database.value} value={database.value}>
                  {database.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
