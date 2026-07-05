import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';

export type LabId = 'anthropic' | 'openai' | 'google';

export type Lab = {
  id: LabId;
  name: string;
  brand: BrandSlug;
};

export const LABS: Lab[] = [
  { id: 'anthropic', name: 'Anthropic', brand: 'claude' },
  { id: 'openai', name: 'OpenAI', brand: 'openai' },
  { id: 'google', name: 'Google', brand: 'gemini' },
];

const FALLBACK_LAB = LABS[0];

export function labOf(id: LabId) {
  const lab = LABS.find((candidate) => candidate.id === id);
  return lab ?? FALLBACK_LAB;
}
