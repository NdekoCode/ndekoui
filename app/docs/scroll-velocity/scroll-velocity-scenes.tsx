import {
  ScrollVelocity,
  ScrollVelocityRow,
} from '@/components/core/scroll-velocity';

type Scene = {
  src: string;
  alt: string;
};

const FIRST_ROW: Scene[] = [
  {
    src: '/images/scenes/scene-01.svg',
    alt: 'Lavender hills under a yellow sun',
  },
  {
    src: '/images/scenes/scene-02.svg',
    alt: 'Green hills under an orange sun',
  },
  {
    src: '/images/scenes/scene-03.svg',
    alt: 'Terracotta hills under a red sun',
  },
  { src: '/images/scenes/scene-04.svg', alt: 'Grey hills under a pale sun' },
];

const SECOND_ROW: Scene[] = [
  { src: '/images/scenes/scene-05.svg', alt: 'Mauve hills under a pink sun' },
  { src: '/images/scenes/scene-06.svg', alt: 'Olive hills under a yellow sun' },
  { src: '/images/scenes/scene-07.svg', alt: 'Indigo hills under the moon' },
  { src: '/images/scenes/scene-08.svg', alt: 'Blue hills under a yellow sun' },
];

function SceneTiles({ scenes }: { scenes: readonly Scene[] }) {
  return (
    <div className='flex gap-4 py-px'>
      {scenes.map((scene) => (
        <div
          key={scene.src}
          className='bg-muted h-28 w-44 shrink-0 overflow-hidden rounded-xl'
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- registry examples land in any React app, where next/image may not exist */}
          <img
            src={scene.src}
            alt={scene.alt}
            width={176}
            height={112}
            loading='lazy'
            className='size-full object-cover'
          />
        </div>
      ))}
    </div>
  );
}

export function ScrollVelocityScenes() {
  return (
    <ScrollVelocity lean={false} className='w-full gap-4 py-10'>
      <ScrollVelocityRow speed={24} gap={16}>
        <SceneTiles scenes={FIRST_ROW} />
      </ScrollVelocityRow>
      <ScrollVelocityRow speed={24} gap={16} direction='right'>
        <SceneTiles scenes={SECOND_ROW} />
      </ScrollVelocityRow>
    </ScrollVelocity>
  );
}
