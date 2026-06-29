'use client';

import { useState } from 'react';

import {
  SwapGrid,
  type SwapGridItem,
  type SwapGridSlots,
} from '@/components/core/swap-grid';

type Scene = {
  id: string;
  name: string;
  src: string;
  alt: string;
};

const SCENES: Scene[] = [
  {
    id: 'dawn',
    name: 'Dawn',
    src: '/images/scenes/scene-03.svg',
    alt: 'Flat illustration of warm hills under a coral sun',
  },
  {
    id: 'meadow',
    name: 'Meadow',
    src: '/images/scenes/scene-06.svg',
    alt: 'Flat illustration of olive hills under a yellow sun',
  },
  {
    id: 'mist',
    name: 'Mist',
    src: '/images/scenes/scene-04.svg',
    alt: 'Flat illustration of grey blue hills under a pale sun',
  },
  {
    id: 'night',
    name: 'Night',
    src: '/images/scenes/scene-07.svg',
    alt: 'Flat illustration of dark hills under the moon at night',
  },
];

function SceneTile({ scene }: { scene: Scene }) {
  return (
    <figure className='relative size-full overflow-hidden rounded-xl'>
      {/* eslint-disable-next-line @next/next/no-img-element -- registry examples land in any React app, where next/image may not exist */}
      <img
        src={scene.src}
        alt={scene.alt}
        draggable={false}
        className='pointer-events-none size-full object-cover'
      />
      <figcaption className='surface-raised absolute bottom-2 left-2 rounded-md px-2 py-0.5 text-xs'>
        {scene.name}
      </figcaption>
    </figure>
  );
}

const ITEMS: SwapGridItem[] = SCENES.map((scene) => ({
  id: scene.id,
  label: scene.name,
  content: <SceneTile scene={scene} />,
}));

const LAYOUT: SwapGridSlots = ['dawn', 'meadow', 'mist', null, 'night', null];

function coverOf(slots: SwapGridSlots) {
  const firstId = slots[0];
  const scene = SCENES.find((candidate) => candidate.id === firstId);
  return scene?.name ?? 'No cover yet';
}

export function SwapGridMoodboard() {
  const [slots, setSlots] = useState(LAYOUT);

  return (
    <div className='flex w-full max-w-lg flex-col gap-3'>
      <SwapGrid
        aria-label='Moodboard'
        items={ITEMS}
        columns={3}
        defaultSlots={LAYOUT}
        onSlotsChange={setSlots}
        className='auto-rows-[112px]'
      />
      <p className='text-muted-foreground text-xs'>
        Cover image: <span className='text-foreground'>{coverOf(slots)}</span>
      </p>
    </div>
  );
}
