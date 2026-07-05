import type { SeriesSlot } from '@/registry/ndeko/lib/agent-run';

export type LabId = 'lumen' | 'quarry' | 'halden';

export type Lab = {
  id: LabId;
  name: string;
  initial: string;
  series: SeriesSlot;
};

export const LABS: Lab[] = [
  { id: 'lumen', name: 'Lumen', initial: 'L', series: 1 },
  { id: 'quarry', name: 'Quarry', initial: 'Q', series: 2 },
  { id: 'halden', name: 'Halden', initial: 'H', series: 3 },
];

const FALLBACK_LAB = LABS[0];

export function labOf(id: LabId) {
  const lab = LABS.find((candidate) => candidate.id === id);
  return lab ?? FALLBACK_LAB;
}
