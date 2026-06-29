import {
  MagnifiedDoc,
  MagnifiedDocDock,
  MagnifiedDocImage,
  MagnifiedDocItem,
  MagnifiedDocStage,
} from '@/components/core/magnified-doc';

const WALLPAPERS = [
  { value: 'bay', label: 'Bay', src: '/images/scenes/scene-01.svg' },
  { value: 'meadow', label: 'Meadow', src: '/images/scenes/scene-02.svg' },
  { value: 'ridge', label: 'Ridge', src: '/images/scenes/scene-03.svg' },
  { value: 'valley', label: 'Valley', src: '/images/scenes/scene-04.svg' },
  { value: 'dunes', label: 'Dunes', src: '/images/scenes/scene-06.svg' },
  { value: 'night', label: 'Night', src: '/images/scenes/scene-07.svg' },
];

export function MagnifiedDocWallpapers() {
  return (
    <div className='w-full max-w-2xl px-4 py-8'>
      <MagnifiedDoc defaultValue='valley'>
        <MagnifiedDocStage transition='clip'>
          {WALLPAPERS.map((wallpaper) => (
            <MagnifiedDocImage
              key={wallpaper.value}
              value={wallpaper.value}
              src={wallpaper.src}
              alt={`${wallpaper.label} wallpaper`}
            />
          ))}
        </MagnifiedDocStage>
        <MagnifiedDocDock aria-label='Wallpapers' magnification={1.7}>
          {WALLPAPERS.map((wallpaper) => (
            <MagnifiedDocItem
              key={wallpaper.value}
              value={wallpaper.value}
              label={wallpaper.label}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- plain img keeps the example portable */}
              <img
                src={wallpaper.src}
                alt=''
                draggable={false}
                className='size-full object-cover'
              />
            </MagnifiedDocItem>
          ))}
        </MagnifiedDocDock>
      </MagnifiedDoc>
    </div>
  );
}
