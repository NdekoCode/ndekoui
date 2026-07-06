export type SocialKind = 'linkedin' | 'x' | 'github';

export type Social = {
  kind: SocialKind;
  href: string;
};

export type Member = {
  id: string;
  name: string;
  role: string;
  location: string;
  bio: string;
  socials: Social[];
};

export const SECTION = {
  label: 'Team',
  title: 'The people behind Ledgerline',
  lead: 'Accountants, engineers and designers in seven cities. Everyone answers support one morning a week.',
};

export const OPENING = {
  title: 'Your name here',
  text: 'We are hiring a support engineer, in Lisbon or remote.',
  linkLabel: 'See open roles',
  href: '#',
};

/** Invented people. */
export const MEMBERS: Member[] = [
  {
    id: 'clara',
    name: 'Clara Nyström',
    role: 'Co-founder and CEO',
    location: 'Stockholm',
    bio: 'Clara spent eight years closing the books at a shipping company before she started Ledgerline. She still reconciles one real account by hand every month to see where the product gets it wrong, and she reads every support message with the word refund in it. Outside work she rows on Lake Mälaren.',
    socials: [
      { kind: 'linkedin', href: '#' },
      { kind: 'x', href: '#' },
    ],
  },
  {
    id: 'kofi',
    name: 'Kofi Mensah',
    role: 'Co-founder and CTO',
    location: 'Accra',
    bio: 'Kofi built payment systems for mobile money before Ledgerline, which is why every amount in the product is stored in minor units and every rounding rule has a test with a name. He leads engineering, reviews the migrations himself and keeps a list of the bugs that taught him something.',
    socials: [
      { kind: 'linkedin', href: '#' },
      { kind: 'github', href: '#' },
      { kind: 'x', href: '#' },
    ],
  },
  {
    id: 'lea',
    name: 'Lea Fischer',
    role: 'Design lead',
    location: 'Berlin',
    bio: 'Lea designs the reconciliation screens, the part of the product people look at for hours at month end. She tests every change with three accountants before it ships and keeps a folder of the spreadsheets customers sent her, which she calls the real design system.',
    socials: [{ kind: 'linkedin', href: '#' }],
  },
  {
    id: 'arjun',
    name: 'Arjun Mehta',
    role: 'Machine learning engineer',
    location: 'Bengaluru',
    bio: 'Arjun trains the models that match bank lines to invoices. He measures them on the books of customers who agreed to share them, never on made-up data, and writes the release note of every model change in plain words an accountant can check.',
    socials: [
      { kind: 'github', href: '#' },
      { kind: 'linkedin', href: '#' },
    ],
  },
  {
    id: 'sofia',
    name: 'Sofía Paredes',
    role: 'Head of Customer Success',
    location: 'Mexico City',
    bio: 'Sofía moves every new customer from spreadsheets to Ledgerline, usually within a week. She has moved the books of a ferry company, two breweries and a chain of dental clinics, and turns the questions people ask during that week into the guides of the help center.',
    socials: [
      { kind: 'linkedin', href: '#' },
      { kind: 'x', href: '#' },
    ],
  },
  {
    id: 'patrick',
    name: 'Patrick Ilunga',
    role: 'Infrastructure engineer',
    location: 'Kinshasa',
    bio: 'Patrick keeps Ledgerline running at month end, when traffic triples in two days. He wrote the runbooks the whole team follows during an incident, and he is the reason every backup is restored once a week on a machine nobody uses, just to prove that it works.',
    socials: [{ kind: 'github', href: '#' }],
  },
  {
    id: 'mei',
    name: 'Mei Lin',
    role: 'Accountant in residence',
    location: 'Singapore',
    bio: 'Mei is a chartered accountant who works inside the product team. She checks every rule the product learns against how accountants really close a month, writes the test cases for the tax rules of eleven countries and says no more often than anyone else here.',
    socials: [{ kind: 'linkedin', href: '#' }],
  },
];
