import { ImageReveal } from '@/components/core/image-reveal';

const CABINS = [
  {
    id: 'pine',
    title: 'Pine cabin',
    meta: '2 guests',
    src: '/images/scenes/scene-04.svg',
    href: '#pine-cabin',
  },
  {
    id: 'lake',
    title: 'Lake house',
    meta: '6 guests',
    src: '/images/scenes/scene-08.svg',
    href: '#lake-house',
  },
  {
    id: 'dune',
    title: 'Dune shelter',
    meta: '1 guest',
    src: '/images/scenes/scene-06.svg',
    href: '#dune-shelter',
  },
  {
    id: 'orchard',
    title: 'Orchard barn',
    meta: '4 guests',
    src: '/images/scenes/scene-05.svg',
    href: '#orchard-barn',
  },
];

export function ImageRevealCompact() {
  return (
    <div className='w-full max-w-md px-4 py-8'>
      <ImageReveal
        items={CABINS}
        rowClassName='py-2'
        titleClassName='text-base font-medium sm:text-base'
        imageClassName='aspect-[3/4] w-40'
      />
    </div>
  );
}
