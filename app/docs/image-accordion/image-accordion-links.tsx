import { ImageAccordion } from '@/components/core/image-accordion';

const STORIES = [
  {
    id: 'coast',
    src: '/images/scenes/scene-08.svg',
    alt: 'A quiet shore in the morning',
    title: 'Walking the coast in four days',
    description: 'A route with a ferry at both ends',
    href: '#walking-the-coast',
  },
  {
    id: 'valley',
    src: '/images/scenes/scene-04.svg',
    alt: 'A valley with the sun low over the ridges',
    title: 'Where the valley ends',
    description: 'Three cabins, no road',
    href: '#where-the-valley-ends',
  },
  {
    id: 'hills',
    src: '/images/scenes/scene-05.svg',
    alt: 'Layered hills in soft evening colours',
    title: 'Hills after the rain',
    description: 'Short loops for wet weeks',
    href: '#hills-after-the-rain',
  },
];

export function ImageAccordionLinks() {
  return (
    <div className='w-full max-w-3xl px-4 py-8'>
      <ImageAccordion items={STORIES} className='sm:h-72' />
    </div>
  );
}
