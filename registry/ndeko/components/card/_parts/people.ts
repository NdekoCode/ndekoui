export type Person = {
  id: string;
  name: string;
  role: string;
  company: string;
};

/** The invented people of the card demos. The same person keeps the same picture on every card. */
export const PEOPLE = {
  amara: {
    id: 'amara',
    name: 'Amara Diallo',
    role: 'Product lead',
    company: 'Halden Works',
  },
  jonas: {
    id: 'jonas',
    name: 'Jonas Weber',
    role: 'Staff engineer',
    company: 'Brightwater',
  },
  mei: {
    id: 'mei',
    name: 'Mei Tanaka',
    role: 'Design director',
    company: 'Kiln Studio',
  },
  rafael: {
    id: 'rafael',
    name: 'Rafael Ortega',
    role: 'Head of support',
    company: 'Tallyard',
  },
  ingrid: {
    id: 'ingrid',
    name: 'Ingrid Solheim',
    role: 'Finance manager',
    company: 'Quillhouse',
  },
} satisfies Record<string, Person>;
