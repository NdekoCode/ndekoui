'use client';

import { useState } from 'react';

import { Safari } from '@/components/core/safari';
import { ToggleGroup, ToggleGroupItem } from '@/registry/ndeko/ui/toggle-group';

type Page = {
  id: string;
  label: string;
  url: string;
  src: string;
};

const PAGES: Page[] = [
  {
    id: 'home',
    label: 'Home',
    url: 'tidewell.studio',
    src: '/images/scenes/scene-01.svg',
  },
  {
    id: 'pricing',
    label: 'Pricing',
    url: 'tidewell.studio/pricing',
    src: '/images/scenes/scene-03.svg',
  },
  {
    id: 'changelog',
    label: 'Changelog',
    url: 'tidewell.studio/changelog',
    src: '/images/scenes/scene-08.svg',
  },
];

function pageOf(id: string) {
  const match = PAGES.find((page) => page.id === id);
  return match ?? PAGES[0];
}

export function SafariPages() {
  const [pageId, setPageId] = useState(PAGES[0].id);
  const page = pageOf(pageId);

  function selectPage(values: string[]) {
    const [next] = values;
    if (next === undefined) {
      return;
    }
    setPageId(next);
  }

  return (
    <div className='flex w-full max-w-2xl flex-col items-center gap-6 px-4 py-10'>
      <Safari
        url={page.url}
        imageSrc={page.src}
        label={`The ${page.label} page of Tidewell Studio in a browser`}
      />
      <ToggleGroup
        travel
        variant='outline'
        size='sm'
        aria-label='Page'
        value={[pageId]}
        onValueChange={selectPage}
      >
        {PAGES.map((option) => (
          <ToggleGroupItem key={option.id} value={option.id}>
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
