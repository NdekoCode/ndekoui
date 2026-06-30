import {
  CheckIcon,
  ClockIcon,
  MinusIcon,
  MoonIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';

export type Presence = 'tracking' | 'online' | 'away' | 'offline';

export type Role = 'manager' | 'member' | 'viewer';

export type Member = {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
  email: string;
  title: string;
  role: Role;
  presence: Presence;
  isYou: boolean;
};

type PresenceMeta = { label: string; color: string; glyph: Icon };

export const PRESENCE_META: Record<Presence, PresenceMeta> = {
  tracking: {
    label: 'Tracking time',
    color: 'var(--primary)',
    glyph: ClockIcon,
  },
  online: { label: 'Online', color: 'var(--success)', glyph: CheckIcon },
  away: { label: 'Away', color: 'var(--warning)', glyph: MoonIcon },
  offline: {
    label: 'Offline',
    color: 'var(--muted-foreground)',
    glyph: MinusIcon,
  },
};

type RoleMeta = { label: string; description: string; color: string };

export const ROLE_META: Record<Role, RoleMeta> = {
  manager: {
    label: 'Manager',
    description: 'Edits the team, its members and their plans',
    color: 'var(--primary)',
  },
  member: {
    label: 'Member',
    description: 'Works on tasks and tracks time',
    color: 'var(--info)',
  },
  viewer: {
    label: 'Viewer',
    description: 'Sees tasks and reports, changes nothing',
    color: 'var(--muted-foreground)',
  },
};

export const ROLE_ORDER: Role[] = ['manager', 'member', 'viewer'];

export function isRole(value: unknown): value is Role {
  return ROLE_ORDER.some((role) => role === value);
}

export const MEMBERS: Member[] = [
  {
    id: 'amara',
    name: 'Amara Okafor',
    initials: 'AO',
    avatar: '/avatars/avatar-03.svg',
    email: 'amara@example.com',
    title: 'Product designer',
    role: 'manager',
    presence: 'tracking',
    isYou: true,
  },
  {
    id: 'leo',
    name: 'Léo Martin',
    initials: 'LM',
    avatar: '/avatars/avatar-04.svg',
    email: 'leo@example.com',
    title: 'Frontend engineer',
    role: 'member',
    presence: 'online',
    isYou: false,
  },
  {
    id: 'sana',
    name: 'Sana Iqbal',
    initials: 'SI',
    avatar: '/avatars/avatar-05.svg',
    email: 'sana@example.com',
    title: 'Backend engineer',
    role: 'member',
    presence: 'tracking',
    isYou: false,
  },
  {
    id: 'tomas',
    name: 'Tomás Rivera',
    initials: 'TR',
    avatar: '/avatars/avatar-06.svg',
    email: 'tomas@example.com',
    title: 'QA engineer',
    role: 'member',
    presence: 'away',
    isYou: false,
  },
  {
    id: 'mei',
    name: 'Mei Lin',
    initials: 'ML',
    avatar: '/avatars/avatar-07.svg',
    email: 'mei@example.com',
    title: 'Content designer',
    role: 'viewer',
    presence: 'offline',
    isYou: false,
  },
  {
    id: 'jonas',
    name: 'Jonas Weber',
    initials: 'JW',
    email: 'jonas@example.com',
    title: 'Data analyst',
    role: 'member',
    presence: 'online',
    isYou: false,
  },
];

export function memberById(memberId: string) {
  const found = MEMBERS.find((member) => member.id === memberId);
  if (found) {
    return found;
  }
  return MEMBERS[0];
}
