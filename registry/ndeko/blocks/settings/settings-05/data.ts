import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';

export type ProviderId = 'google' | 'github' | 'gitlab';

export type LinkStatus = 'connected' | 'connecting' | 'disconnected';

export type Provider = {
  id: ProviderId;
  name: string;
  brand: BrandSlug;
  /** The account the provider signs in, once it is connected. */
  account: string;
  status: LinkStatus;
  connectedSince: string;
};

export type DeviceKind = 'laptop' | 'phone' | 'desktop' | 'tablet';

export type SignedInDevice = {
  id: string;
  device: string;
  kind: DeviceKind;
  /** Places are invented, like everyone in the sample. */
  place: string;
  lastActive: string;
  isThisDevice: boolean;
};

export const EMAIL = 'dana@tidewell.example';

export const TODAY = 'Nov 12, 2026';

export const CODE_LENGTH = 6;

/** A sample setup key: the word in it says it is one. */
const SETUP_KEY_GROUPS = ['SAMP', 'LE7K', 'Q4TW', 'DM2X'];

export const SETUP_KEY = SETUP_KEY_GROUPS.join(' ');

/** What an authenticator app takes when the key is pasted. */
export const SETUP_KEY_TEXT = SETUP_KEY_GROUPS.join('');

export const PROVIDERS: Provider[] = [
  {
    id: 'google',
    name: 'Google',
    brand: 'google',
    account: EMAIL,
    status: 'connected',
    connectedSince: 'Mar 3, 2024',
  },
  {
    id: 'github',
    name: 'GitHub',
    brand: 'github',
    account: 'dana-whitfield',
    status: 'disconnected',
    connectedSince: '',
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    brand: 'gitlab',
    account: 'dwhitfield',
    status: 'disconnected',
    connectedSince: '',
  },
];

export const DEVICES: SignedInDevice[] = [
  {
    id: 'macbook',
    device: 'Safari on a MacBook Air',
    kind: 'laptop',
    place: 'Port Calder',
    lastActive: 'Active now',
    isThisDevice: true,
  },
  {
    id: 'iphone',
    device: 'Tidewell app on an iPhone',
    kind: 'phone',
    place: 'Port Calder',
    lastActive: '2 hours ago',
    isThisDevice: false,
  },
  {
    id: 'windows',
    device: 'Firefox on Windows',
    kind: 'desktop',
    place: 'Lindenfeld',
    lastActive: 'Yesterday',
    isThisDevice: false,
  },
  {
    id: 'tablet',
    device: 'Chrome on an Android tablet',
    kind: 'tablet',
    place: 'Harrowgate Bay',
    lastActive: 'Oct 28',
    isThisDevice: false,
  },
];
