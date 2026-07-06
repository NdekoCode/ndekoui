import { SEED_SECTION, type LightId } from './data';

export function callOf(light: LightId, seed: number) {
  return [
    'aperline.take({',
    `  brief: "${SEED_SECTION.brief}",`,
    `  light: "${light}",`,
    `  seed: ${seed},`,
    '})',
  ].join('\n');
}
