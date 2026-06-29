import { ImageAccordion } from '@/components/core/image-accordion';

const STOPS = [
  {
    id: 'harbour',
    src: '/images/scenes/scene-01.svg',
    alt: 'A bright sun over the bay',
    title: 'The harbour',
    description: 'Day 1, ferry at 08:30',
  },
  {
    id: 'meadow',
    src: '/images/scenes/scene-02.svg',
    alt: 'Green hills in spring light',
    title: 'Meadow road',
    description: 'Day 2, 14 km on foot',
  },
  {
    id: 'ridge',
    src: '/images/scenes/scene-03.svg',
    alt: 'The north ridge at midday',
    title: 'North ridge',
    description: 'Day 3, the long climb',
  },
  {
    id: 'dunes',
    src: '/images/scenes/scene-06.svg',
    alt: 'Warm dunes at the end of the day',
    title: 'The dunes',
    description: 'Day 4, sunset at 18:45',
  },
  {
    id: 'night',
    src: '/images/scenes/scene-07.svg',
    alt: 'The valley under a full moon',
    title: 'Night camp',
    description: 'Day 5, the last evening',
  },
];

export function ImageAccordionBasic() {
  return (
    <div className='w-full max-w-3xl px-4 py-8'>
      <ImageAccordion items={STOPS} defaultValue='ridge' />
    </div>
  );
}
