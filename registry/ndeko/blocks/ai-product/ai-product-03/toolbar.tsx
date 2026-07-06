'use client';

import { SearchIcon } from '@/registry/ndeko/lib/icons';
import { Input } from '@/registry/ndeko/ui/input';
import { SelectNative } from '@/registry/ndeko/ui/select-native';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

import { OWNERS, STATUS_LABEL } from './data';
import type { OwnerFilter, StatusFilter } from './session';

const STATUS_SEGMENTS: Segment<StatusFilter>[] = [
  { value: 'all', label: 'All' },
  { value: 'new', label: STATUS_LABEL.new },
  { value: 'contacted', label: STATUS_LABEL.contacted },
  { value: 'qualified', label: STATUS_LABEL.qualified },
];

function ownerFilterOf(value: string): OwnerFilter | null {
  if (value === 'all') {
    return 'all';
  }
  const owner = OWNERS.find((candidate) => candidate.id === value);
  if (owner) {
    return owner.id;
  }
  return null;
}

type ToolbarProps = {
  query: string;
  status: StatusFilter;
  owner: OwnerFilter;
  onQuery: (text: string) => void;
  onStatus: (status: StatusFilter) => void;
  onOwner: (owner: OwnerFilter) => void;
};

export function Toolbar({
  query,
  status,
  owner,
  onQuery,
  onStatus,
  onOwner,
}: ToolbarProps) {
  function pickOwner(event: React.ChangeEvent<HTMLSelectElement>) {
    const picked = ownerFilterOf(event.target.value);
    if (picked) {
      onOwner(picked);
    }
  }

  return (
    <div className='flex flex-wrap items-center gap-2'>
      <div className='relative min-w-44 flex-1'>
        <SearchIcon className='text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2' />
        <Input
          type='search'
          aria-label='Search leads'
          data-leads-search
          autoComplete='off'
          placeholder='Search name, company or city'
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          className='ps-8'
        />
      </div>
      <Segments
        label='Status'
        value={status}
        segments={STATUS_SEGMENTS}
        onValueChange={onStatus}
      />
      <SelectNative
        aria-label='Owner'
        value={owner}
        onChange={pickOwner}
        className='w-36'
      >
        <option value='all'>All owners</option>
        {OWNERS.map((candidate) => (
          <option key={candidate.id} value={candidate.id}>
            {candidate.name}
          </option>
        ))}
      </SelectNative>
    </div>
  );
}
