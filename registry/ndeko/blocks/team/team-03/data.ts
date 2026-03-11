export type Role = 'manager' | 'member' | 'viewer';

export type Member = {
  id: string;
  name: string;
  initials: string;
  email: string;
  title: string;
  role: Role;
  avatar?: string;
};

export type Invitation = {
  id: string;
  email: string;
  role: Role;
  invitedBy: string;
  sentLabel: string;
};

export const TEAM_NAME = 'Product';

export const CURRENT_USER_NAME = 'Amara Okafor';

export const ROLE_OPTIONS: { value: Role; label: string; line: string }[] = [
  {
    value: 'member',
    label: 'Member',
    line: 'Creates tasks, tracks time and edits the board',
  },
  {
    value: 'manager',
    label: 'Manager',
    line: 'Also invites people and changes the team’s settings',
  },
  {
    value: 'viewer',
    label: 'Viewer',
    line: 'Reads tasks and reports without editing them',
  },
];

export const ROLE_LABEL: Record<Role, string> = {
  manager: 'Manager',
  member: 'Member',
  viewer: 'Viewer',
};

export const MEMBERS: Member[] = [
  {
    id: 'amara',
    name: 'Amara Okafor',
    initials: 'AO',
    email: 'amara@lattice.example',
    title: 'Product designer',
    role: 'manager',
    avatar: '/avatars/avatar-03.svg',
  },
  {
    id: 'lucas',
    name: 'Lucas Moreau',
    initials: 'LM',
    email: 'lucas@lattice.example',
    title: 'Engineering lead',
    role: 'manager',
    avatar: '/avatars/avatar-04.svg',
  },
  {
    id: 'priya',
    name: 'Priya Raman',
    initials: 'PR',
    email: 'priya@lattice.example',
    title: 'Frontend engineer',
    role: 'member',
    avatar: '/avatars/avatar-05.svg',
  },
  {
    id: 'mateo',
    name: 'Mateo Silva',
    initials: 'MS',
    email: 'mateo@lattice.example',
    title: 'Backend engineer',
    role: 'member',
    avatar: '/avatars/avatar-06.svg',
  },
  {
    id: 'hana',
    name: 'Hana Kobayashi',
    initials: 'HK',
    email: 'hana@lattice.example',
    title: 'Product manager',
    role: 'member',
    avatar: '/avatars/avatar-07.svg',
  },
  {
    id: 'jonas',
    name: 'Jonas Weber',
    initials: 'JW',
    email: 'jonas@lattice.example',
    title: 'QA engineer',
    role: 'viewer',
  },
];

export const INVITATIONS: Invitation[] = [
  {
    id: 'invite-noor',
    email: 'noor.haddad@lattice.example',
    role: 'member',
    invitedBy: 'Lucas Moreau',
    sentLabel: 'Sent 2 days ago',
  },
  {
    id: 'invite-kofi',
    email: 'kofi.mensah@lattice.example',
    role: 'viewer',
    invitedBy: 'Amara Okafor',
    sentLabel: 'Sent this morning',
  },
  {
    id: 'invite-ines',
    email: 'ines.carvalho@northfield.example',
    role: 'member',
    invitedBy: 'Amara Okafor',
    sentLabel: 'Sent last week',
  },
];
