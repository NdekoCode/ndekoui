import type { RegistryItemDefinition, RegistryItemFile } from './item-kit';

const SCENE_NUMBERS = ['01', '02', '03', '04', '05', '06', '07', '08'];

function publicFileOf(publicPath: string): RegistryItemFile {
  return {
    path: `public/${publicPath}`,
    type: 'registry:file',
    target: `public/${publicPath}`,
  };
}

function sceneFileOf(number: string) {
  return publicFileOf(`images/scenes/scene-${number}.svg`);
}

/**
 * The sample pictures the examples point at. They install into `public/` so an example shows the
 * same landscapes in any project, without reaching back to ui.ndekocode.dev.
 */
export const sampleAssetItems: RegistryItemDefinition[] = [
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
