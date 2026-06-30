'use client';

import { GlobeIcon } from '@/registry/ndeko/lib/icons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';

import { LANGUAGES } from './data';

export function LanguageSelect() {
  return (
    <Select items={LANGUAGES} defaultValue='en'>
      <SelectTrigger size='sm' className='w-36' aria-label='Language'>
        <GlobeIcon className='text-muted-foreground size-3.5' />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LANGUAGES.map((language) => (
          <SelectItem key={language.value} value={language.value}>
            {language.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
