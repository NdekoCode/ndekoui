import { BRANDS, type BrandSlug } from '@/registry/ndeko/lib/brand-logos';

export type CategoryId = 'communication' | 'files' | 'finance' | 'developer';

export type ViewId = 'all' | 'connected' | CategoryId;

export type Integration = {
  id: string;
  brand: BrandSlug;
  category: CategoryId;
  description: string;
  /** The first attempt asks for an owner's approval, so the block can show its error state. */
  needsApproval?: boolean;
};

export const PAGE = {
  title: 'Integrations',
  description:
    'Connect the tools Fernhollow Studio already uses. Each one only reads what its card says.',
};

export const CATEGORIES: Record<CategoryId, { label: string }> = {
  communication: { label: 'Communication' },
  files: { label: 'Files and docs' },
  finance: { label: 'Finance' },
  developer: { label: 'Developer' },
};

export const VIEWS: { id: ViewId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'connected', label: 'Connected' },
  { id: 'communication', label: 'Communication' },
  { id: 'files', label: 'Files and docs' },
  { id: 'finance', label: 'Finance' },
  { id: 'developer', label: 'Developer' },
];

export const APPROVER = 'Rosa Ilunga';

export const INTEGRATIONS: Integration[] = [
  {
    id: 'element',
    brand: 'element',
    category: 'communication',
    description:
      'Posts task updates to an Element room and links each one back to its task.',
  },
  {
    id: 'gmail',
    brand: 'gmail',
    category: 'communication',
    description:
      'Turns emails sent to a project address into tasks, attachments included.',
  },
  {
    id: 'zoom',
    brand: 'zoom',
    category: 'communication',
    description:
      'Adds a call link to a task and logs the call on its timeline when it ends.',
  },
  {
    id: 'google-drive',
    brand: 'googledrive',
    category: 'files',
    description: 'Attaches files from shared drives without copying them.',
  },
  {
    id: 'notion',
    brand: 'notion',
    category: 'files',
    description: 'Links pages to tasks and keeps their titles in sync.',
  },
  {
    id: 'dropbox',
    brand: 'dropbox',
    category: 'files',
    description:
      'Saves the files people drop on a task into the project’s folder.',
  },
  {
    id: 'quickbooks',
    brand: 'quickbooks',
    category: 'finance',
    description:
      'Sends approved hours to draft invoices, one line per project.',
    needsApproval: true,
  },
  {
    id: 'stripe',
    brand: 'stripe',
    category: 'finance',
    description:
      'Marks a Fernhollow invoice as paid once its payment comes through.',
  },
  {
    id: 'xero',
    brand: 'xero',
    category: 'finance',
    description: 'Copies logged expenses into your books with their receipts.',
  },
  {
    id: 'github',
    brand: 'github',
    category: 'developer',
    description:
      'Closes a task when the pull request that mentions it is merged.',
  },
  {
    id: 'linear',
    brand: 'linear',
    category: 'developer',
    description:
      'Keeps the status of an issue and its linked task the same, both ways.',
  },
  {
    id: 'sentry',
    brand: 'sentry',
    category: 'developer',
    description:
      'Opens a task for a new error, with a link to the first event.',
  },
];

export const INITIALLY_CONNECTED = ['element', 'github'];

export function nameOf(integration: Integration) {
  return BRANDS[integration.brand].title;
}
