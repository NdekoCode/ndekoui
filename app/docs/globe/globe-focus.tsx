'use client';

import { useState } from 'react';

import {
  Globe,
  type GlobeLocation,
  type GlobeMarker,
} from '@/components/core/globe';
import { ToggleGroup, ToggleGroupItem } from '@/registry/ndeko/ui/toggle-group';

type City = {
  name: string;
  location: GlobeLocation;
};

const CITIES: City[] = [
  { name: 'Kinshasa', location: [-4.44, 15.27] },
  { name: 'Montreal', location: [45.5, -73.57] },
  { name: 'Singapore', location: [1.35, 103.82] },
  { name: 'São Paulo', location: [-23.55, -46.63] },
];

const MARKERS: GlobeMarker[] = CITIES.map((city) => ({
  location: city.location,
  label: city.name,
}));

function locationOf(name: string | undefined) {
  const city = CITIES.find((candidate) => candidate.name === name);
  if (!city) {
    return null;
  }
  return city.location;
}

export function GlobeFocus() {
  const [chosen, setChosen] = useState<string[]>(['Kinshasa']);
  const focus = locationOf(chosen[0]);

  return (
    <div className='flex w-full flex-col items-center gap-4 py-6'>
      <ToggleGroup
        variant='outline'
        size='sm'
        value={chosen}
        onValueChange={setChosen}
        aria-label='City to show'
      >
        {CITIES.map((city) => (
          <ToggleGroupItem key={city.name} value={city.name}>
            {city.name}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <Globe
        markers={MARKERS}
        focus={focus}
        label='Globe turning to the chosen city'
        className='max-w-[380px]'
      />
      <p className='text-muted-foreground text-xs'>
        Press the chosen city again to let the globe turn on its own
      </p>
    </div>
  );
}
