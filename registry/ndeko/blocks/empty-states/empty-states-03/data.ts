export type Person = {
  id: string;
  name: string;
};

export type OpenTask = {
  id: string;
  key: string;
  title: string;
  isDone: boolean;
};

export type TeamMember = {
  personId: string;
  focus?: string;
};

export type ActivityEntry = {
  id: string;
  personId: string;
  text: string;
  age: string;
};

export const LOAD_DURATION_MS = 900;

export const PEOPLE: Person[] = [
  {
    id: 'amara',
    name: 'Amara Okafor',
  },
  {
    id: 'leo',
    name: 'Léo Martin',
  },
  {
    id: 'sana',
    name: 'Sana Iqbal',
  },
  {
    id: 'tomas',
    name: 'Tomás Rivera',
  },
  {
    id: 'mei',
    name: 'Mei Lin',
  },
];

export const OPEN_TASKS: OpenTask[] = [
  {
    id: 'mos-155',
    key: 'MOS-155',
    title: 'Empty states for the plant library',
    isDone: false,
  },
  {
    id: 'mos-152',
    key: 'MOS-152',
    title: 'Offline drafts for field notes',
    isDone: false,
  },
  {
    id: 'mos-164',
    key: 'MOS-164',
    title: 'Copy for the weekly digest email',
    isDone: false,
  },
  {
    id: 'mos-133',
    key: 'MOS-133',
    title: 'Tag colours in the sidebar',
    isDone: true,
  },
];

export const TEAM: TeamMember[] = [
  { personId: 'leo', focus: 'MOS-148 Booking calendar on Safari' },
  { personId: 'sana', focus: 'MOS-139 Rate limit share links' },
  { personId: 'tomas', focus: 'MOS-152 Offline drafts' },
  { personId: 'mei' },
];

export const ACTIVITY: ActivityEntry[] = [
  {
    id: 'a-1',
    personId: 'mei',
    text: 'commented on MOS-148',
    age: '12m',
  },
  {
    id: 'a-2',
    personId: 'leo',
    text: 'set an estimate on MOS-148',
    age: '1h',
  },
  {
    id: 'a-3',
    personId: 'sana',
    text: 'moved MOS-139 to In review',
    age: '3h',
  },
  {
    id: 'a-4',
    personId: 'tomas',
    text: 'added the label Mobile to MOS-152',
    age: 'Yesterday',
  },
];
