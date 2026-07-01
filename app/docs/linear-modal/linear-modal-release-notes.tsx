import {
  LinearModal,
  type LinearModalFeature,
} from '@/components/core/linear-modal';

const RELEASES: LinearModalFeature[] = [
  {
    id: 'release-4-2',
    title: 'Offline drafts',
    summary: 'Version 4.2, 28 October',
    description:
      'Issues you write on a train or a plane are kept on your device and sent when the connection comes back. A small mark on the issue shows it is still waiting.',
    image: {
      src: '/images/scenes/scene-07.svg',
      alt: 'Flat illustration of dark hills under the moon at night',
    },
  },
  {
    id: 'release-4-1',
    title: 'Faster search',
    summary: 'Version 4.1, 9 October',
    description:
      'Search now starts with the issues you opened last and narrows as you type, even in the largest workspaces.',
    image: {
      src: '/images/scenes/scene-04.svg',
      alt: 'Flat illustration of grey blue hills under a pale sun',
    },
  },
];

export function LinearModalReleaseNotes() {
  return (
    <div className='bg-foreground/[0.035] w-full max-w-sm rounded-2xl p-3'>
      <LinearModal
        features={RELEASES}
        closeLabel='Close release note'
        className='sm:grid-cols-1'
      />
    </div>
  );
}
