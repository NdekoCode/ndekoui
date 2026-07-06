import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';

export type GridCell = {
  name: string;
  brand: BrandSlug;
  column: number;
  row: number;
};

export const HERO = {
  eyebrow: 'Integrations',
  title: 'Bring every app your team uses into one workspace',
  description:
    'Connect calendars, trackers, files and payments once. Each app keeps its own rules, and a single feed shows what changed across all of them.',
  primaryAction: 'Connect your first app',
  secondaryAction: 'Browse the integrations',
};

export const COLUMNS = 21;

export const CELLS: GridCell[] = [
  { name: 'Google Calendar', brand: 'googlecalendar', column: 2, row: 1 },
  { name: 'Gmail', brand: 'gmail', column: 4, row: 2 },
  { name: 'Notion', brand: 'notion', column: 3, row: 4 },
  { name: 'Google Drive', brand: 'googledrive', column: 5, row: 5 },
  { name: 'Zoom', brand: 'zoom', column: 2, row: 6 },
  { name: 'GitHub', brand: 'github', column: 18, row: 1 },
  { name: 'Linear', brand: 'linear', column: 16, row: 2 },
  { name: 'Figma', brand: 'figma', column: 17, row: 4 },
  { name: 'Stripe', brand: 'stripe', column: 15, row: 5 },
  { name: 'Jira', brand: 'jira', column: 18, row: 6 },
  { name: 'Sentry', brand: 'sentry', column: 8, row: 0 },
  { name: 'HubSpot', brand: 'hubspot', column: 12, row: 0 },
  { name: 'Shopify', brand: 'shopify', column: 9, row: 7 },
  { name: 'Zapier', brand: 'zapier', column: 11, row: 7 },
];

/**
 * The order in which cells light up, as indexes of `CELLS`. Any five cells in a row of this list,
 * the end of the list joining its start, are at least two cells apart, so two neighbours never
 * show a tile together, not even while one fades out and the next fades in.
 */
export const ORDER = [0, 5, 10, 13, 3, 8, 11, 12, 2, 7, 1, 6, 4, 9];

export const LIT_COUNT = 4;
