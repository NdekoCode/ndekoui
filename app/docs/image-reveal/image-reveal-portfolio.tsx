import { ImageReveal } from '@/components/core/image-reveal';

const PROJECTS = [
  {
    id: 'harbour-light',
    title: 'Harbour Light',
    meta: '2026',
    src: '/images/scenes/scene-01.svg',
    href: '#harbour-light',
  },
  {
    id: 'meadow-school',
    title: 'Meadow School',
    meta: '2025',
    src: '/images/scenes/scene-02.svg',
    href: '#meadow-school',
  },
  {
    id: 'ridge-hut',
    title: 'The Ridge Hut',
    meta: '2025',
    src: '/images/scenes/scene-03.svg',
    href: '#ridge-hut',
  },
  {
    id: 'night-market',
    title: 'Night Market',
    meta: '2024',
    src: '/images/scenes/scene-07.svg',
    href: '#night-market',
  },
];

export function ImageRevealPortfolio() {
  return (
    <div className='w-full max-w-2xl px-4 py-8'>
      <ImageReveal items={PROJECTS} />
    </div>
  );
}
