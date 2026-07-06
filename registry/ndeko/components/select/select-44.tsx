'use client';

import { Combobox as ComboboxPrimitive } from '@base-ui/react/combobox';

import { SearchIcon } from '@/registry/ndeko/lib/icons';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxSelectTrigger,
  ComboboxValue,
} from '@/registry/ndeko/ui/combobox';
import { Field, FieldLabel } from '@/registry/ndeko/ui/field';

type Country = {
  value: string;
  label: string;
};

type Continent = {
  continent: string;
  items: Country[];
};

const CONTINENTS: Continent[] = [
  {
    continent: 'America',
    items: [
      { value: 'US', label: 'United States' },
      { value: 'CA', label: 'Canada' },
      { value: 'MX', label: 'Mexico' },
    ],
  },
  {
    continent: 'Africa',
    items: [
      { value: 'CD', label: 'DR Congo' },
      { value: 'ZA', label: 'South Africa' },
      { value: 'NG', label: 'Nigeria' },
      { value: 'MA', label: 'Morocco' },
    ],
  },
  {
    continent: 'Asia',
    items: [
      { value: 'CN', label: 'China' },
      { value: 'JP', label: 'Japan' },
      { value: 'IN', label: 'India' },
    ],
  },
  {
    continent: 'Europe',
    items: [
      { value: 'GB', label: 'United Kingdom' },
      { value: 'FR', label: 'France' },
      { value: 'DE', label: 'Germany' },
    ],
  },
  {
    continent: 'Oceania',
    items: [
      { value: 'AU', label: 'Australia' },
      { value: 'NZ', label: 'New Zealand' },
    ],
  },
];

function CountryName({ country }: { country: Country }) {
  return (
    <span className='flex min-w-0 items-center gap-2'>
      <span
        aria-hidden='true'
        className='bg-foreground/[0.06] text-muted-foreground inline-flex h-4 w-6 shrink-0 items-center justify-center rounded-sm text-[10px] font-medium'
      >
        {country.value}
      </span>
      <span className='truncate'>{country.label}</span>
    </span>
  );
}

function selectedCountryOf(country: Country | null) {
  if (!country) {
    return 'Pick a country';
  }
  return <CountryName country={country} />;
}

export default function Select44() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Country</FieldLabel>
      <Combobox items={CONTINENTS}>
        <ComboboxSelectTrigger>
          <ComboboxValue>{selectedCountryOf}</ComboboxValue>
        </ComboboxSelectTrigger>
        <ComboboxContent className='flex flex-col p-0'>
          <div className='hairline-b border-border flex h-10 shrink-0 items-center gap-2 px-3'>
            <SearchIcon className='text-muted-foreground size-4 shrink-0' />
            <ComboboxInput
              aria-label='Search countries'
              placeholder='Search countries'
              className='h-full px-0'
            />
          </div>
          <ComboboxEmpty>No country matches your search.</ComboboxEmpty>
          <ComboboxList className='max-h-72 overflow-y-auto p-1 empty:hidden'>
            {(group: Continent) => (
              <ComboboxGroup key={group.continent} items={group.items}>
                <ComboboxGroupLabel>{group.continent}</ComboboxGroupLabel>
                <ComboboxPrimitive.Collection>
                  {(country: Country) => (
                    <ComboboxItem key={country.value} value={country}>
                      <CountryName country={country} />
                    </ComboboxItem>
                  )}
                </ComboboxPrimitive.Collection>
              </ComboboxGroup>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}
