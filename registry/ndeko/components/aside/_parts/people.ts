export type Presence = 'tracking' | 'online' | 'away' | 'offline';

export type Person = {
  id: string;
  name: string;
  initials: string;
  email: string;
  title: string;
  presence: Presence;
  avatar?: string;
};

export const PEOPLE: Person[] = [
  {
    id: 'amara',
    name: 'Amara Okafor',
    initials: 'AO',
    email: 'amara@lattice.example',
    title: 'Product designer',
    presence: 'tracking',
    avatar: '/avatars/avatar-03.svg',
  },
  {
    id: 'lucas',
    name: 'Lucas Moreau',
    initials: 'LM',
    email: 'lucas@lattice.example',
    title: 'Engineering lead',
    presence: 'online',
    avatar: '/avatars/avatar-04.svg',
  },
  {
    id: 'priya',
    name: 'Priya Raman',
    initials: 'PR',
    email: 'priya@lattice.example',
    title: 'Frontend engineer',
    presence: 'online',
    avatar: '/avatars/avatar-05.svg',
  },
  {
    id: 'mateo',
    name: 'Mateo Silva',
    initials: 'MS',
    email: 'mateo@lattice.example',
    title: 'Backend engineer',
    presence: 'away',
    avatar: '/avatars/avatar-06.svg',
  },
  {
    id: 'hana',
    name: 'Hana Kobayashi',
    initials: 'HK',
    email: 'hana@lattice.example',
    title: 'Product manager',
    presence: 'tracking',
    avatar: '/avatars/avatar-07.svg',
  },
  {
    id: 'jonas',
    name: 'Jonas Weber',
    initials: 'JW',
    email: 'jonas@lattice.example',
    title: 'QA engineer',
    presence: 'offline',
  },
  {
    id: 'zola',
    name: 'Zola Mbeki',
    initials: 'ZM',
    email: 'zola@lattice.example',
    title: 'Content designer',
    presence: 'online',
  },
];

function isKnownPerson(person: Person | undefined): person is Person {
  return person !== undefined;
}

export function peopleByIds(ids: string[]) {
  const found = ids.map((id) => PEOPLE.find((person) => person.id === id));
  return found.filter(isKnownPerson);
}

export function firstNameOf(person: Person) {
  const [firstName] = person.name.split(' ');
  return firstName;
}
