import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';

export type ToolId = 'github' | 'linear';

export type Tool = {
  id: ToolId;
  name: string;
  brand: BrandSlug;
};

export const HERO = {
  announcement: {
    label: '4.2',
    text: 'Every run now replays step by step',
    href: '#',
  },
  titleStart: 'Let an agent write your',
  /** The last word of the title turns over; the run beside it writes the first one. */
  titleWords: ['release notes', 'changelogs', 'migration guides', 'test plans'],
  titleSpoken: 'release notes, changelogs, migration guides and test plans',
  description:
    'Quillrun reads your repository and your tracker, plans the work and opens a pull request for you to review. Nothing merges without you.',
  primaryAction: 'Start building',
  secondaryAction: 'Read the docs',
  command: 'npx quillrun init',
};

export const AGENT = {
  id: 'writer',
  name: 'Writer',
};

export const TOOLS: Record<ToolId, Tool> = {
  github: { id: 'github', name: 'GitHub', brand: 'github' },
  linear: { id: 'linear', name: 'Linear', brand: 'linear' },
};

export const RUN_TITLE = 'Release notes for 4.2';
