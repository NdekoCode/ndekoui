'use client';

import {
  BlocksIcon,
  BrainIcon,
  CpuIcon,
  DatabaseIcon,
  GlobeIcon,
  LayoutIcon,
  LineChartIcon,
  NetworkIcon,
  SearchIcon,
  ServerIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxSelectTrigger,
  ComboboxValue,
} from '@/registry/ndeko/ui/combobox';
import { Field, FieldLabel } from '@/registry/ndeko/ui/field';

type Service = {
  value: string;
  label: string;
  icon: Icon;
  count: number;
};

const SERVICES: Service[] = [
  {
    value: 'analytics',
    label: 'Analytics platform',
    icon: LineChartIcon,
    count: 2451,
  },
  { value: 'ai', label: 'AI services', icon: BrainIcon, count: 1832 },
  {
    value: 'databases',
    label: 'Database systems',
    icon: DatabaseIcon,
    count: 1654,
  },
  { value: 'compute', label: 'Compute resources', icon: CpuIcon, count: 943 },
  {
    value: 'network',
    label: 'Network services',
    icon: NetworkIcon,
    count: 832,
  },
  { value: 'web', label: 'Web services', icon: GlobeIcon, count: 654 },
  {
    value: 'monitoring',
    label: 'Monitoring tools',
    icon: SearchIcon,
    count: 432,
  },
  {
    value: 'servers',
    label: 'Server management',
    icon: ServerIcon,
    count: 321,
  },
  {
    value: 'infrastructure',
    label: 'Infrastructure',
    icon: BlocksIcon,
    count: 234,
  },
  {
    value: 'frontend',
    label: 'Frontend services',
    icon: LayoutIcon,
    count: 123,
  },
];

const COUNT_FORMAT = new Intl.NumberFormat('en-US');

function ServiceName({ service }: { service: Service }) {
  const ServiceIcon = service.icon;

  return (
    <span className='flex min-w-0 items-center gap-2'>
      <ServiceIcon className='text-muted-foreground size-4 shrink-0' />
      <span className='truncate'>{service.label}</span>
    </span>
  );
}

function selectedServiceOf(service: Service | null) {
  if (!service) {
    return 'Pick a service category';
  }
  return <ServiceName service={service} />;
}

export default function Select45() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Service category</FieldLabel>
      <Combobox items={SERVICES}>
        <ComboboxSelectTrigger>
          <ComboboxValue>{selectedServiceOf}</ComboboxValue>
        </ComboboxSelectTrigger>
        <ComboboxContent className='flex flex-col p-0'>
          <div className='hairline-b border-border flex h-10 shrink-0 items-center gap-2 px-3'>
            <SearchIcon className='text-muted-foreground size-4 shrink-0' />
            <ComboboxInput
              aria-label='Search services'
              placeholder='Search services'
              className='h-full px-0'
            />
          </div>
          <ComboboxEmpty>No service matches your search.</ComboboxEmpty>
          <ComboboxList className='max-h-72 overflow-y-auto p-1 empty:hidden'>
            {(service: Service) => (
              <ComboboxItem key={service.value} value={service}>
                <ServiceName service={service} />
                <span className='keycap-3d text-muted-foreground ms-auto inline-flex h-5 shrink-0 items-center rounded-[5px] px-1.5 text-[11px] font-medium tabular-nums'>
                  {COUNT_FORMAT.format(service.count)}
                </span>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}
