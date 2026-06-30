import type { RegistryItemDefinition, RegistryItemFile } from './item-kit';

const AVATAR_NUMBERS = ['03', '04', '05', '06', '07'];

const SCENE_NUMBERS = ['01', '02', '03', '04', '05', '06', '07', '08'];

function publicFileOf(publicPath: string): RegistryItemFile {
  return {
    path: `public/${publicPath}`,
    type: 'registry:file',
    target: `public/${publicPath}`,
  };
}

function avatarFileOf(number: string) {
  return publicFileOf(`avatars/avatar-${number}.svg`);
}

function sceneFileOf(number: string) {
  return publicFileOf(`images/scenes/scene-${number}.svg`);
}

/**
 * The sample pictures the examples point at. They install into `public/` so an example shows the
 * same faces and landscapes in any project, without reaching back to ui.ndekocode.dev.
 */
export const sampleAssetItems: RegistryItemDefinition[] = [
  {
    name: 'sample-avatars',
    type: 'registry:item',
    title: 'Sample avatars',
    description:
      'The illustrated avatars the examples use, copied into public/avatars.',
    files: AVATAR_NUMBERS.map(avatarFileOf),
    categories: ['foundations'],
  },
  {
    name: 'sample-scenes',
    type: 'registry:item',
    title: 'Sample scenes',
    description:
      'The flat landscapes the image examples use, copied into public/images/scenes.',
    files: SCENE_NUMBERS.map(sceneFileOf),
    categories: ['foundations'],
  },
];
