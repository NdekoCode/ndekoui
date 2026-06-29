import {
  ImageTabs,
  ImageTabsDescription,
  ImageTabsFrame,
  ImageTabsImage,
  ImageTabsList,
  ImageTabsTab,
  ImageTabsTitle,
} from '@/components/core/image-tabs';

const FEATURES = [
  {
    value: 'route',
    title: 'Plan the route',
    description:
      'Drop the stops on a map and the days arrange themselves around the drive.',
    src: '/images/scenes/scene-02.svg',
    alt: 'Rolling hills under a pale sky',
  },
  {
    value: 'stays',
    title: 'Hold the cabins',
    description:
      'Rooms along the way stay held for 24 hours while the group decides.',
    src: '/images/scenes/scene-04.svg',
    alt: 'A valley with a sun low over the ridges',
  },
  {
    value: 'evenings',
    title: 'Know the evenings',
    description:
      'Sunset times and the last ferry for every stop, so nobody gets stranded.',
    src: '/images/scenes/scene-07.svg',
    alt: 'Hills at night under a large moon',
  },
  {
    value: 'album',
    title: 'Share one album',
    description:
      'Photos land in one album per day, sorted by the stop where they were taken.',
    src: '/images/scenes/scene-05.svg',
    alt: 'Layered hills in soft evening colours',
  },
];

export function ImageTabsFeatures() {
  return (
    <div className='w-full max-w-3xl px-4 py-8'>
      <ImageTabs
        defaultValue='route'
        className='items-center gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]'
      >
        <ImageTabsList aria-label='Trip planner features'>
          {FEATURES.map((feature) => (
            <ImageTabsTab key={feature.value} value={feature.value}>
              <ImageTabsTitle>{feature.title}</ImageTabsTitle>
              <ImageTabsDescription>{feature.description}</ImageTabsDescription>
            </ImageTabsTab>
          ))}
        </ImageTabsList>
        <ImageTabsFrame>
          {FEATURES.map((feature) => (
            <ImageTabsImage
              key={feature.value}
              value={feature.value}
              src={feature.src}
              alt={feature.alt}
            />
          ))}
        </ImageTabsFrame>
      </ImageTabs>
    </div>
  );
}
