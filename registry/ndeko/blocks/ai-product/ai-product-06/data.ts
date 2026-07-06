import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';

export const SECTION = {
  label: 'Connected apps',
  title: 'The apps your agent can use',
  lead: 'Point at an app to see what the agent does with it, then connect it.',
};

export type AppId = 'notion' | 'linear' | 'github' | 'calendar' | 'gmail';

export type App = {
  id: AppId;
  name: string;
  brand: BrandSlug;
  line: string;
};

export const APPS: App[] = [
  {
    id: 'notion',
    name: 'Notion',
    brand: 'notion',
    line: 'Reads your pages and writes the weekly summary',
  },
  {
    id: 'linear',
    name: 'Linear',
    brand: 'linear',
    line: 'Opens issues and moves them when the work is done',
  },
  {
    id: 'github',
    name: 'GitHub',
    brand: 'github',
    line: 'Reviews pull requests and drafts release notes',
  },
  {
    id: 'calendar',
    name: 'Google Calendar',
    brand: 'googlecalendar',
    line: 'Finds a slot that suits everyone you invite',
  },
  {
    id: 'gmail',
    name: 'Gmail',
    brand: 'gmail',
    line: 'Drafts replies and waits for your go before sending',
  },
];

export const RESTING_ID: AppId = 'linear';

export const DEMO_CONNECT: AppId = 'github';

export function appOf(id: AppId) {
  const app = APPS.find((candidate) => candidate.id === id);
  return app ?? APPS[0];
}
