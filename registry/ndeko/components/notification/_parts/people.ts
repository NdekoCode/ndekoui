export type Person = {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
};

export const PEOPLE = {
  amara: {
    id: 'amara',
    name: 'Amara Okafor',
    initials: 'AO',
    avatar: '/avatars/avatar-03.svg',
  },
  leo: {
    id: 'leo',
    name: 'Léo Martin',
    initials: 'LM',
    avatar: '/avatars/avatar-04.svg',
  },
  sana: {
    id: 'sana',
    name: 'Sana Iqbal',
    initials: 'SI',
    avatar: '/avatars/avatar-05.svg',
  },
  tomas: {
    id: 'tomas',
    name: 'Tomás Rivera',
    initials: 'TR',
    avatar: '/avatars/avatar-06.svg',
  },
  mei: {
    id: 'mei',
    name: 'Mei Lin',
    initials: 'ML',
    avatar: '/avatars/avatar-07.svg',
  },
  jonas: { id: 'jonas', name: 'Jonas Weber', initials: 'JW' },
} satisfies Record<string, Person>;

export function firstNameOf(person: Person) {
  const [firstName] = person.name.split(' ');
  return firstName;
}
