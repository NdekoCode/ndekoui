export type Person = {
  id: string;
  name: string;
  firstName: string;
};

export const CURRENT_USER_ID = 'amara';

export const PEOPLE: Person[] = [
  {
    id: 'amara',
    name: 'Amara Okafor',
    firstName: 'Amara',
  },
  {
    id: 'leo',
    name: 'Léo Martin',
    firstName: 'Léo',
  },
  {
    id: 'sana',
    name: 'Sana Iqbal',
    firstName: 'Sana',
  },
  {
    id: 'tomas',
    name: 'Tomás Rivera',
    firstName: 'Tomás',
  },
  {
    id: 'mei',
    name: 'Mei Lin',
    firstName: 'Mei',
  },
  {
    id: 'jonah',
    name: 'Jonah Brandt',
    firstName: 'Jonah',
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
