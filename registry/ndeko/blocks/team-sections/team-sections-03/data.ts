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
  email: string;
  bio: string;
  topics: string[];
  socials: Social[];
};

export const SECTION = {
  label: 'Team',
  title: 'Meet the people who answer when a clinic writes in',
  lead: 'Five of us build Sundial and every one of us reads support. Pick someone to see what to ask them about.',
};

/** Invented people. The addresses use a domain reserved for examples, so nothing is ever sent. */
export const MEMBERS: Member[] = [
  {
    id: 'amelia',
    name: 'Amelia Hart',
    role: 'Founder',
    location: 'London',
    email: 'amelia@sundial.example',
    bio: 'Amelia ran the front desk of a physiotherapy clinic for five years and built the first version of Sundial in its back office. She still spends one day a month on a clinic front desk, watching how people really book.',
    topics: ['Pricing', 'Partnerships', 'Clinic workflows'],
    socials: [
      { kind: 'linkedin', href: '#' },
      { kind: 'x', href: '#' },
    ],
  },
  {
    id: 'tunde',
    name: 'Tunde Bakare',
    role: 'Engineering lead',
    location: 'Lagos',
    email: 'tunde@sundial.example',
    bio: 'Tunde leads the engineers who keep calendars in sync across every booking channel. He has a rule that no reminder goes out without a test that sends it to his own phone first.',
    topics: ['Calendar sync', 'Uptime', 'Joining the team'],
    socials: [
      { kind: 'github', href: '#' },
      { kind: 'linkedin', href: '#' },
    ],
  },
  {
    id: 'ingrid',
    name: 'Ingrid Solberg',
    role: 'Product designer',
    location: 'Oslo',
    email: 'ingrid@sundial.example',
    bio: 'Ingrid designs the booking flow patients see on their phones. She tests it with people over seventy every quarter, and every change she ships has to work with a screen reader before it works with a mouse.',
    topics: ['Booking flow', 'Accessibility', 'Research sessions'],
    socials: [{ kind: 'linkedin', href: '#' }],
  },
  {
    id: 'rahul',
    name: 'Rahul Varma',
    role: 'Data engineer',
    location: 'Pune',
    email: 'rahul@sundial.example',
    bio: 'Rahul builds the forecasts that warn a clinic about likely no-shows a day ahead. Patient data never leaves the region it was collected in, and he wrote the export that lets a clinic take all of it with them.',
    topics: ['No-show forecasts', 'Data exports', 'Privacy'],
    socials: [
      { kind: 'github', href: '#' },
      { kind: 'x', href: '#' },
    ],
  },
  {
    id: 'chloe',
    name: 'Chloé Mwamba',
    role: 'Customer lead',
    location: 'Kinshasa',
    email: 'chloe@sundial.example',
    bio: 'Chloé sets up every new clinic and trains their front desk, in French, English or Lingala. The feature requests she brings back from those sessions decide a good part of what the team builds next.',
    topics: ['Onboarding', 'Training', 'Feature requests'],
    socials: [{ kind: 'linkedin', href: '#' }],
  },
];
