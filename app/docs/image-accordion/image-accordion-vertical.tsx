import { ImageAccordion } from '@/components/core/image-accordion';

const ROOMS = [
  {
    id: 'loft',
    src: '/images/scenes/scene-02.svg',
    alt: 'Hills seen from the loft window',
    title: 'The loft',
    description: 'Two beds, a view on the hills',
  },
  {
    id: 'garden',
    src: '/images/scenes/scene-05.svg',
    alt: 'Hills behind the garden room',
    title: 'Garden room',
    description: 'Ground floor, opens on the orchard',
  },
  {
    id: 'tower',
    src: '/images/scenes/scene-07.svg',
    alt: 'The night sky from the tower',
    title: 'The tower',
    description: 'One bed, the best stars',
  },
];

export function ImageAccordionVertical() {
  return (
    <div className='w-full max-w-sm px-4 py-8'>
      <ImageAccordion items={ROOMS} orientation='vertical' className='h-96' />
    </div>
  );
}
