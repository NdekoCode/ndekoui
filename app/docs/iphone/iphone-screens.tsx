'use client';

import { useState } from 'react';

import { Iphone, type IphoneStatusBar } from '@/components/core/iphone';
import { ToggleGroup, ToggleGroupItem } from '@/registry/ndeko/ui/toggle-group';

import { IphoneLockScreen, type LockScreenTone } from './lock-screen';

type Wallpaper = {
  id: string;
  label: string;
  src: string;
  tone: LockScreenTone;
  statusBar: IphoneStatusBar;
};

const WALLPAPERS: Wallpaper[] = [
  {
    id: 'lavender',
    label: 'Lavender',
    src: '/images/scenes/scene-01.svg',
    tone: 'dark',
    statusBar: 'dark',
  },
  {
    id: 'mint',
    label: 'Mint',
    src: '/images/scenes/scene-02.svg',
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

export function IphoneScreens() {
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
      <Iphone
        className='w-[280px]'
        imageSrc={wallpaper.src}
        statusBar={wallpaper.statusBar}
        time=''
        label={`Lock screen with the ${wallpaper.label} wallpaper`}
      >
        <IphoneLockScreen tone={wallpaper.tone} />
      </Iphone>
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
