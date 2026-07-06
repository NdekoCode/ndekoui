export type Person = {
  id: string;
  name: string;
};

export const PEOPLE = {
  amara: {
    id: 'amara',
    name: 'Amara Okafor',
  },
  leo: {
    id: 'leo',
    name: 'Léo Martin',
  },
  sana: {
    id: 'sana',
    name: 'Sana Iqbal',
  },
  tomas: {
    id: 'tomas',
    name: 'Tomás Rivera',
  },
  mei: {
    id: 'mei',
    name: 'Mei Lin',
  },
  jonas: { id: 'jonas', name: 'Jonas Weber' },
} satisfies Record<string, Person>;

export function firstNameOf(person: Person) {
  const [firstName] = person.name.split(' ');
  return firstName;
}
