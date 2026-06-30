'use client';

import { useState } from 'react';

import { Android, type AndroidStatusBar } from '@/components/core/android';
import { ToggleGroup, ToggleGroupItem } from '@/registry/ndeko/ui/toggle-group';

import { AndroidLockScreen, type LockScreenTone } from './lock-screen';

type Wallpaper = {
  id: string;
  label: string;
  src: string;
  tone: LockScreenTone;
  statusBar: AndroidStatusBar;
};

const WALLPAPERS: Wallpaper[] = [
  {
    id: 'blush',
    label: 'Blush',
    src: '/images/scenes/scene-05.svg',
    tone: 'dark',
    statusBar: 'dark',
  },
  {
    id: 'sky',
    label: 'Sky',
    src: '/images/scenes/scene-08.svg',
    tone: 'dark',
    statusBar: 'dark',
  },
  {
    id: 'night',
    label: 'Night',
    src: '/images/scenes/scene-07.svg',
    tone: 'light',
    statusBar: 'light',
  },
];

function wallpaperOf(id: string) {
  const match = WALLPAPERS.find((wallpaper) => wallpaper.id === id);
  return match ?? WALLPAPERS[0];
}

export function AndroidScreens() {
  const [wallpaperId, setWallpaperId] = useState(WALLPAPERS[0].id);
  const wallpaper = wallpaperOf(wallpaperId);

  function selectWallpaper(values: string[]) {
    const [next] = values;
    if (next === undefined) {
      return;
    }
    setWallpaperId(next);
  }

  return (
    <div className='flex w-full flex-col items-center gap-6 px-4 py-10'>
      <Android
        className='w-[280px]'
        imageSrc={wallpaper.src}
        statusBar={wallpaper.statusBar}
        time=''
        label={`Lock screen with the ${wallpaper.label} wallpaper`}
      >
        <AndroidLockScreen tone={wallpaper.tone} />
      </Android>
      <ToggleGroup
        travel
        variant='outline'
        size='sm'
        aria-label='Wallpaper'
        value={[wallpaperId]}
        onValueChange={selectWallpaper}
      >
        {WALLPAPERS.map((option) => (
          <ToggleGroupItem key={option.id} value={option.id}>
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
