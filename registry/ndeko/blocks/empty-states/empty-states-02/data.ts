export type RoleId = 'owner' | 'admin' | 'member' | 'guest';

export type Role = {
  id: RoleId;
  name: string;
};

export type Member = {
  id: string;
  name: string;
  initials: string;
  email: string;
  roleId: RoleId;
  avatar?: string;
};

export const TEAM_NAME = 'Mossline Web';

export const ROLES: Role[] = [
  { id: 'owner', name: 'Owner' },
  { id: 'admin', name: 'Admin' },
  { id: 'member', name: 'Member' },
  { id: 'guest', name: 'Guest' },
];

export const MEMBERS: Member[] = [
  {
    id: 'amara',
    name: 'Amara Okafor',
    initials: 'AO',
    email: 'amara@example.com',
    roleId: 'owner',
    avatar: '/avatars/avatar-03.svg',
  },
  {
    id: 'leo',
    name: 'Léo Martin',
    initials: 'LM',
    email: 'leo@example.com',
    roleId: 'admin',
    avatar: '/avatars/avatar-04.svg',
  },
  {
    id: 'sana',
    name: 'Sana Iqbal',
    initials: 'SI',
    email: 'sana@example.com',
    roleId: 'member',
    avatar: '/avatars/avatar-05.svg',
  },
  {
    id: 'tomas',
    name: 'Tomás Rivera',
    initials: 'TR',
    email: 'tomas@example.com',
    roleId: 'member',
    avatar: '/avatars/avatar-06.svg',
  },
  {
    id: 'mei',
    name: 'Mei Lin',
    initials: 'ML',
    email: 'mei@example.com',
    roleId: 'admin',
    avatar: '/avatars/avatar-07.svg',
  },
  {
    id: 'ines',
    name: 'Inês Duarte',
    initials: 'ID',
    email: 'ines@example.com',
    roleId: 'guest',
  },
];

export const INITIAL_QUERY = 'Rafael';

export const INITIAL_ROLES: RoleId[] = ['admin'];
