import type { CSSProperties } from 'react';

import { hashOf, pickedFrom } from '@/registry/ndeko/lib/seeded';

/** The custom properties the `mesh-fill` utility reads. */
export type MeshStyle = CSSProperties & {
  '--mesh': string;
  '--mesh-key': string;
  '--mesh-shade': string;
  '--mesh-rim': string;
};

type Lights = { key: string; shade: string; rim: string };

/** One arrangement of the three lights, turned twelve times around the centre. */
const LIGHTS: Lights[] = [
  { key: '23% 23%', shade: '83% 83%', rim: '88% 18%' },
  { key: '40% 13%', shade: '62% 94%', rim: '99% 41%' },
  { key: '60% 13%', shade: '38% 94%', rim: '97% 67%' },
  { key: '77% 23%', shade: '17% 83%', rim: '82% 88%' },
  { key: '87% 40%', shade: '6% 62%', rim: '59% 99%' },
  { key: '87% 60%', shade: '6% 38%', rim: '33% 97%' },
  { key: '77% 77%', shade: '17% 17%', rim: '12% 82%' },
  { key: '60% 87%', shade: '38% 6%', rim: '1% 59%' },
  { key: '40% 87%', shade: '62% 6%', rim: '3% 33%' },
  { key: '23% 77%', shade: '83% 17%', rim: '18% 12%' },
  { key: '13% 60%', shade: '94% 38%', rim: '41% 1%' },
  { key: '13% 40%', shade: '94% 62%', rim: '67% 3%' },
];

/**
 * Hues that stay clean under the three lights, two for each of five families (coral, amber, mint,
 * blue, violet), so a list of people never reads as one colour. Yellow-greens are left out: they
 * turn muddy under a warm light.
 */
const HUES = [15, 45, 70, 160, 190, 220, 250, 280, 310, 340];

/** An odd multiplier: names that differ by a few letters land far apart in the list of hues. */
const HUE_MIX = 0x22bfb891;
const UINT32_RANGE = 2 ** 32;

/** A name drifts a few degrees around its hue, so two names on the same hue still differ. */
const HUE_DRIFT = 7;

/** The drift and the lights are read from different bits of the hash. */
const DRIFT_SHIFT = 13;
const LIGHTS_SHIFT = 9;

function hueOf(hash: number) {
  const mixed = Math.imul(hash, HUE_MIX) >>> 0;
  const position = mixed / UINT32_RANGE;
  const index = Math.floor(position * HUES.length);
  const span = HUE_DRIFT * 2 + 1;
  const drift = (hash >>> DRIFT_SHIFT) % span;
  return HUES[index] + drift - HUE_DRIFT;
}

function styleOf(body: string, lights: Lights): MeshStyle {
  return {
    '--mesh': body,
    '--mesh-key': lights.key,
    '--mesh-shade': lights.shade,
    '--mesh-rim': lights.rim,
  };
}

/** The picture of a name: a soft hue of its own, lit from a side of its own. */
export function meshOf(seed: string) {
  const hash = hashOf(seed);
  const hue = hueOf(hash);
  const body = `oklch(0.77 0.125 ${hue})`;
  const lights = pickedFrom(LIGHTS, hash, LIGHTS_SHIFT);
  return styleOf(body, lights);
}

/** The same picture in a colour that already means something: a series slot, the colour of a team. */
export function meshIn(color: string, seed = color) {
  const hash = hashOf(seed);
  const lights = pickedFrom(LIGHTS, hash, LIGHTS_SHIFT);
  return styleOf(color, lights);
}
