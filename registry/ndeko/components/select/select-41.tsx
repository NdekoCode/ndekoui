'use client';

import { SearchIcon } from '@/registry/ndeko/lib/icons';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxSelectTrigger,
} from '@/registry/ndeko/ui/combobox';
import { Field, FieldLabel } from '@/registry/ndeko/ui/field';

type Framework = {
  value: string;
  label: string;
};

const FRAMEWORKS: Framework[] = [
  { value: 'nextjs', label: 'Next.js' },
  { value: 'sveltekit', label: 'SvelteKit' },
  { value: 'nuxt', label: 'Nuxt' },
  { value: 'remix', label: 'Remix' },
  { value: 'astro', label: 'Astro' },
  { value: 'angular', label: 'Angular' },
  { value: 'vue', label: 'Vue.js' },
  { value: 'react', label: 'React' },
  { value: 'ember', label: 'Ember.js' },
  { value: 'gatsby', label: 'Gatsby' },
  { value: 'eleventy', label: 'Eleventy' },
  { value: 'solid', label: 'SolidJS' },
  { value: 'preact', label: 'Preact' },
  { value: 'qwik', label: 'Qwik' },
  { value: 'alpine', label: 'Alpine.js' },
  { value: 'lit', label: 'Lit' },
];

export default function Select41() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Framework</FieldLabel>
      <Combobox items={FRAMEWORKS}>
        <ComboboxSelectTrigger placeholder='Pick a framework' />
        <ComboboxContent className='flex flex-col p-0'>
          <div className='hairline-b border-border flex h-10 shrink-0 items-center gap-2 px-3'>
            <SearchIcon className='text-muted-foreground size-4 shrink-0' />
            <ComboboxInput
              aria-label='Search frameworks'
              placeholder='Search frameworks'
              className='h-full px-0'
            />
          </div>
          <ComboboxEmpty>No framework matches your search.</ComboboxEmpty>
          <ComboboxList className='max-h-64 overflow-y-auto p-1 empty:hidden'>
            {(framework: Framework) => (
              <ComboboxItem key={framework.value} value={framework}>
                {framework.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}
