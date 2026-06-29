import {
  ImageTabs,
  ImageTabsDescription,
  ImageTabsFrame,
  ImageTabsImage,
  ImageTabsList,
  ImageTabsTab,
  ImageTabsTitle,
} from '@/components/core/image-tabs';

const SEASONS = [
  {
    value: 'spring',
    title: 'Spring',
    meta: 'March to May, 14 trails open',
    src: '/images/scenes/scene-02.svg',
    alt: 'Green hills in spring light',
  },
  {
    value: 'summer',
    title: 'Summer',
    meta: 'June to August, all 22 trails open',
    src: '/images/scenes/scene-01.svg',
    alt: 'A bright sun over the bay',
  },
  {
    value: 'autumn',
    title: 'Autumn',
    meta: 'September to November, 18 trails open',
    src: '/images/scenes/scene-06.svg',
    alt: 'Warm hills in autumn',
  },
  {
    value: 'night',
    title: 'Night walks',
    meta: 'Guided, every full moon',
    src: '/images/scenes/scene-07.svg',
    alt: 'The valley under a full moon',
  },
];

export function ImageTabsSeasons() {
  return (
    <div className='w-full max-w-3xl px-4 py-8'>
      <ImageTabs
        defaultValue='summer'
        className='items-center gap-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]'
      >
        <ImageTabsFrame transition='clip' className='aspect-[4/3]'>
          {SEASONS.map((season) => (
            <ImageTabsImage
              key={season.value}
              value={season.value}
              src={season.src}
              alt={season.alt}
            />
          ))}
        </ImageTabsFrame>
        <ImageTabsList aria-label='Seasons'>
          {SEASONS.map((season) => (
            <ImageTabsTab key={season.value} value={season.value}>
              <ImageTabsTitle>{season.title}</ImageTabsTitle>
              <ImageTabsDescription className='tabular-nums'>
                {season.meta}
              </ImageTabsDescription>
            </ImageTabsTab>
          ))}
        </ImageTabsList>
      </ImageTabs>
    </div>
  );
}
