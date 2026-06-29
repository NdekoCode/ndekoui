import {
  ImageTabs,
  ImageTabsFrame,
  ImageTabsImage,
  ImageTabsList,
  ImageTabsTab,
} from '@/components/core/image-tabs';

const PHOTOS = [
  {
    value: 'harbour',
    label: 'Harbour at noon',
    src: '/images/scenes/scene-01.svg',
  },
  { value: 'meadow', label: 'Meadow road', src: '/images/scenes/scene-02.svg' },
  { value: 'ridge', label: 'North ridge', src: '/images/scenes/scene-03.svg' },
  { value: 'valley', label: 'Low valley', src: '/images/scenes/scene-04.svg' },
  {
    value: 'dunes',
    label: 'Dunes at dusk',
    src: '/images/scenes/scene-06.svg',
  },
  { value: 'night', label: 'Night camp', src: '/images/scenes/scene-07.svg' },
];

export function ImageTabsThumbnails() {
  return (
    <div className='w-full max-w-xl px-4 py-8'>
      <ImageTabs
        defaultValue='harbour'
        orientation='horizontal'
        className='gap-3'
      >
        <ImageTabsFrame transition='clip'>
          {PHOTOS.map((photo) => (
            <ImageTabsImage
              key={photo.value}
              value={photo.value}
              src={photo.src}
              alt={photo.label}
            />
          ))}
        </ImageTabsFrame>
        <ImageTabsList variant='thumbnails' aria-label='Photos'>
          {PHOTOS.map((photo) => (
            <ImageTabsTab
              key={photo.value}
              value={photo.value}
              aria-label={photo.label}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- plain img keeps the example portable */}
              <img
                src={photo.src}
                alt=''
                draggable={false}
                className='size-full object-cover'
              />
            </ImageTabsTab>
          ))}
        </ImageTabsList>
      </ImageTabs>
    </div>
  );
}
