export type Person = {
  id: string;
  name: string;
  firstName: string;
  initials: string;
  avatar?: string;
};

export const CURRENT_USER_ID = 'amara';

export const PEOPLE: Person[] = [
  {
    id: 'amara',
    name: 'Amara Okafor',
    firstName: 'Amara',
    initials: 'AO',
    avatar: '/avatars/avatar-03.svg',
  },
  {
    id: 'leo',
    name: 'Léo Martin',
    firstName: 'Léo',
    initials: 'LM',
    avatar: '/avatars/avatar-04.svg',
  },
  {
    id: 'sana',
    name: 'Sana Iqbal',
    firstName: 'Sana',
    initials: 'SI',
    avatar: '/avatars/avatar-05.svg',
  },
  {
    id: 'tomas',
    name: 'Tomás Rivera',
    firstName: 'Tomás',
    initials: 'TR',
    avatar: '/avatars/avatar-06.svg',
  },
  {
    id: 'mei',
    name: 'Mei Lin',
    firstName: 'Mei',
    initials: 'ML',
    avatar: '/avatars/avatar-07.svg',
  },
  {
    id: 'jonah',
    name: 'Jonah Brandt',
    firstName: 'Jonah',
    initials: 'JB',
  },
];

export function personOf(id: string) {
  const found = PEOPLE.find((person) => person.id === id);
  if (found) {
    return found;
  }
  return PEOPLE[0];
}

export function isCurrentUser(id: string) {
  return id === CURRENT_USER_ID;
}

export function actorNameOf(id: string) {
  if (isCurrentUser(id)) {
    return 'You';
  }
  return personOf(id).name;
}

export function currentUser() {
  return personOf(CURRENT_USER_ID);
}
