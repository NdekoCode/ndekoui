export type Presence = 'tracking' | 'online' | 'away' | 'offline';

export type Person = {
  id: string;
  name: string;
  email: string;
  title: string;
  presence: Presence;
};

export const PEOPLE: Person[] = [
  {
    id: 'amara',
    name: 'Amara Okafor',
    email: 'amara@lattice.example',
    title: 'Product designer',
    presence: 'tracking',
  },
  {
    id: 'lucas',
    name: 'Lucas Moreau',
    email: 'lucas@lattice.example',
    title: 'Engineering lead',
    presence: 'online',
  },
  {
    id: 'priya',
    name: 'Priya Raman',
    email: 'priya@lattice.example',
    title: 'Frontend engineer',
    presence: 'online',
  },
  {
    id: 'mateo',
    name: 'Mateo Silva',
    email: 'mateo@lattice.example',
    title: 'Backend engineer',
    presence: 'away',
  },
  {
    id: 'hana',
    name: 'Hana Kobayashi',
    email: 'hana@lattice.example',
    title: 'Product manager',
    presence: 'tracking',
  },
  {
    id: 'jonas',
    name: 'Jonas Weber',
    email: 'jonas@lattice.example',
    title: 'QA engineer',
    presence: 'offline',
  },
  {
    id: 'zola',
    name: 'Zola Mbeki',
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
