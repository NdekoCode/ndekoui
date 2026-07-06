export type Team = {
  id: string;
  name: string;
  /** The colour the team picked for its tile. */
  color: string;
  memberIds: string[];
  memberCount: number;
};

export const TEAMS: Team[] = [
  {
    id: 'atlas',
    name: 'Atlas Redesign',
    color: 'var(--info)',
    memberIds: ['amara', 'leo', 'sana', 'tomas', 'mei', 'jonas'],
    memberCount: 6,
  },
  {
    id: 'field',
    name: 'Field App',
    color: 'var(--success)',
    memberIds: ['leo', 'sana', 'jonas'],
    memberCount: 5,
  },
  {
    id: 'growth',
    name: 'Growth',
    color: 'var(--warning)',
    memberIds: ['mei', 'amara'],
    memberCount: 4,
  },
  {
    id: 'platform',
    name: 'Platform',
    color: 'var(--primary)',
    memberIds: ['sana', 'tomas', 'jonas'],
    memberCount: 7,
  },
  {
    id: 'research',
    name: 'Research',
    color: 'var(--muted-foreground)',
    memberIds: ['mei'],
    memberCount: 1,
  },
];

export function memberCountLabelOf(count: number) {
  if (count === 1) {
    return '1 member';
  }
  return `${count} members`;
}
