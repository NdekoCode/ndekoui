import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';

export type StepId = 'workspace' | 'source' | 'team' | 'review';

export type WizardStep = {
  id: StepId;
  /** The name of the step in the stepper. */
  label: string;
  /** The heading of the step, which takes the focus when the step shows. */
  title: string;
  lead: string;
  /** An optional step can be skipped. */
  isOptional: boolean;
};

export const STEPS: WizardStep[] = [
  {
    id: 'workspace',
    label: 'Workspace',
    title: 'Name your workspace',
    lead: 'Your team finds it under this name and this address',
    isOptional: false,
  },
  {
    id: 'source',
    label: 'Data source',
    title: 'Connect a data source',
    lead: 'Agents read from it. You can connect more later',
    isOptional: true,
  },
  {
    id: 'team',
    label: 'Team',
    title: 'Invite your team',
    lead: 'Each address gets an email with a link to join',
    isOptional: true,
  },
  {
    id: 'review',
    label: 'Review',
    title: 'Review and create',
    lead: 'Nothing is created until you press the button',
    isOptional: false,
  },
];

const FALLBACK_STEP = STEPS[0];

export function stepOf(id: StepId) {
  const step = STEPS.find((candidate) => candidate.id === id);
  return step ?? FALLBACK_STEP;
}

export function indexOfStep(id: StepId) {
  return STEPS.findIndex((candidate) => candidate.id === id);
}

export type SourceId = 'postgresql' | 'supabase' | 'airtable' | 'hubspot';

export type Source = {
  id: SourceId;
  name: string;
  kind: string;
  brand: BrandSlug;
};

/** Known products, under their own name and mark. Nothing else is said about them. */
export const SOURCES: Source[] = [
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    kind: 'Database',
    brand: 'postgresql',
  },
  { id: 'supabase', name: 'Supabase', kind: 'Database', brand: 'supabase' },
  { id: 'airtable', name: 'Airtable', kind: 'Tables', brand: 'airtable' },
  { id: 'hubspot', name: 'HubSpot', kind: 'CRM', brand: 'hubspot' },
];

export function sourceOf(id: SourceId | null) {
  const source = SOURCES.find((candidate) => candidate.id === id);
  return source ?? null;
}

export type RoleId = 'member' | 'admin' | 'viewer';

export type Role = {
  value: RoleId;
  label: string;
};

export const ROLES: Role[] = [
  { value: 'member', label: 'Member' },
  { value: 'admin', label: 'Admin' },
  { value: 'viewer', label: 'Viewer' },
];

export function roleLabelOf(id: RoleId) {
  const role = ROLES.find((candidate) => candidate.value === id);
  return role?.label ?? '';
}

/** The address a workspace is reached at, before its own part. An invented host. */
export const URL_PREFIX = 'app.example/';

export type Fields = {
  name: string;
  slug: string;
  /** Once a person types the address themselves, it stops following the name. */
  isSlugEdited: boolean;
  source: SourceId | null;
  connection: string;
  invites: string[];
  /** What the address box holds before it becomes a chip. */
  inviteDraft: string;
  role: RoleId;
};

export const EMPTY_FIELDS: Fields = {
  name: '',
  slug: '',
  isSlugEdited: false,
  source: null,
  connection: 'Production',
  invites: [],
  inviteDraft: '',
  role: 'member',
};
