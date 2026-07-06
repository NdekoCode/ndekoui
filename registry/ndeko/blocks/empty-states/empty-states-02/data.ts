export type RoleId = 'owner' | 'admin' | 'member' | 'guest';

export type Role = {
  id: RoleId;
  name: string;
};

export type Member = {
  id: string;
  name: string;
  email: string;
  roleId: RoleId;
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
    email: 'amara@example.com',
    roleId: 'owner',
  },
  {
    id: 'leo',
    name: 'Léo Martin',
    email: 'leo@example.com',
    roleId: 'admin',
  },
  {
    id: 'sana',
    name: 'Sana Iqbal',
    email: 'sana@example.com',
    roleId: 'member',
  },
  {
    id: 'tomas',
    name: 'Tomás Rivera',
    email: 'tomas@example.com',
    roleId: 'member',
  },
  {
    id: 'mei',
    name: 'Mei Lin',
    email: 'mei@example.com',
    roleId: 'admin',
  },
  {
    id: 'ines',
    name: 'Inês Duarte',
    email: 'ines@example.com',
    roleId: 'guest',
  },
];

export const INITIAL_QUERY = 'Rafael';

export const INITIAL_ROLES: RoleId[] = ['admin'];
