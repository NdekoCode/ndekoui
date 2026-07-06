export type Presence = 'tracking' | 'online' | 'away' | 'offline';

export type Person = {
  id: string;
  name: string;
  email: string;
  title: string;
  presence: Presence;
};

export const WORKSPACE_NAME = 'Lattice';

export const TEAM_NAME = 'Product';

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
  {
    id: 'theo',
    name: 'Théo Laurent',
    email: 'theo@lattice.example',
    title: 'Data analyst',
    presence: 'away',
  },
  {
    id: 'sana',
    name: 'Sana Iqbal',
    email: 'sana@lattice.example',
    title: 'Support lead',
    presence: 'offline',
  },
];

/** The person a preview is seen by. */
export const CURRENT_USER: Person = PEOPLE[0];

export function personById(id: string) {
  return PEOPLE.find((person) => person.id === id);
}

export function firstNameOf(person: Person) {
  const [firstName] = person.name.split(' ');
  return firstName;
}
