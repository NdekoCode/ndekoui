import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';

export type ProviderId = 'google' | 'github';

export type Provider = {
  id: ProviderId;
  name: string;
  brand: BrandSlug;
  /** The account the provider hands back once it lets the person in. */
  account: string;
};

export type Workspace = {
  id: string;
  name: string;
  members: number;
};

export const PRODUCT_NAME = 'Tidewell';

export const PERSON_NAME = 'Dana Whitfield';

export const CODE_LENGTH = 6;

/** The preview sends no email, so it says which code it accepts. */
export const PREVIEW_CODE = '428913';

export const PREVIEW_CODE_LABEL = '428 913';

export const EMAIL_PLACEHOLDER = 'name@company.com';

export const WORKSPACE_NAME_MAX_LENGTH = 40;

export const PROVIDERS: Provider[] = [
  {
    id: 'google',
    name: 'Google',
    brand: 'google',
    account: 'dana@tidewell.example',
  },
  {
    id: 'github',
    name: 'GitHub',
    brand: 'github',
    account: 'dana-whitfield on GitHub',
  },
];

export const WORKSPACES: Workspace[] = [
  { id: 'brightmoor', name: 'Brightmoor', members: 24 },
  { id: 'saltmarsh-press', name: 'Saltmarsh Press', members: 6 },
  { id: 'kettle-and-pine', name: 'Kettle and Pine', members: 1 },
];
