export const OFFICES_ANCHOR = 'offices';

export const DIVISIONS_ANCHOR = 'divisions';

export const PLANNER_ANCHOR = 'planner';

export const NEWSROOM_ANCHOR = 'newsroom';

export type NavLink = {
  id: string;
  label: string;
  href: string;
};

export const NAV_LINKS: NavLink[] = [
  { id: 'offices', label: 'Offices', href: `#${OFFICES_ANCHOR}` },
  { id: 'divisions', label: 'Divisions', href: `#${DIVISIONS_ANCHOR}` },
  { id: 'planner', label: 'Planner', href: `#${PLANNER_ANCHOR}` },
  { id: 'newsroom', label: 'Newsroom', href: `#${NEWSROOM_ANCHOR}` },
];

export const BRAND = {
  name: 'Quillfield',
  copyright: '© 2026 Quillfield Media Group',
};

export const HEADER = {
  action: 'Plan a campaign',
  actionHref: `#${PLANNER_ANCHOR}`,
};

export const HERO = {
  eyebrow: 'Independent media group, six offices',
  headlines: [
    'News from Kinshasa',
    'Audio from Lagos',
    'Film from Nairobi',
    'Data from London',
  ],
  description:
    'Quillfield runs newsrooms and studios on four continents. Turn the globe to an office, plan a campaign across the divisions and read what the newsroom filed today.',
  primaryAction: 'Plan a campaign',
  secondaryAction: 'Meet the offices',
};

export type Office = {
  id: string;
  city: string;
  country: string;
  role: string;
  desk: string;
  timeZone: string;
  location: [latitude: number, longitude: number];
};

export const OFFICES_SECTION = {
  title: 'Six offices, one newsroom clock',
  description:
    'Pick an office and the globe turns to it. Drag the globe to look around.',
  hint: 'Drag the globe or use the arrow keys',
};

export const OFFICES: Office[] = [
  {
    id: 'kinshasa',
    city: 'Kinshasa',
    country: 'DR Congo',
    role: 'Headquarters',
    desk: 'Daily and Audio',
    timeZone: 'Africa/Kinshasa',
    location: [-4.32, 15.31],
  },
  {
    id: 'lagos',
    city: 'Lagos',
    country: 'Nigeria',
    role: 'Audio studio',
    desk: 'Audio',
    timeZone: 'Africa/Lagos',
    location: [6.52, 3.38],
  },
  {
    id: 'nairobi',
    city: 'Nairobi',
    country: 'Kenya',
    role: 'Film studio',
    desk: 'Studios and Daily',
    timeZone: 'Africa/Nairobi',
    location: [-1.29, 36.82],
  },
  {
    id: 'london',
    city: 'London',
    country: 'United Kingdom',
    role: 'Data desk',
    desk: 'Data and Daily',
    timeZone: 'Europe/London',
    location: [51.51, -0.13],
  },
  {
    id: 'new-york',
    city: 'New York',
    country: 'United States',
    role: 'Events and data',
    desk: 'Live and Data',
    timeZone: 'America/New_York',
    location: [40.71, -74.01],
  },
  {
    id: 'singapore',
    city: 'Singapore',
    country: 'Singapore',
    role: 'Events',
    desk: 'Live',
    timeZone: 'Asia/Singapore',
    location: [1.35, 103.82],
  },
];

export const OFFICE_HOURS = { opens: 8, closes: 18 };

export type Division = {
  id: string;
  name: string;
  short: string;
  line: string;
  where: string;
  perThousand: number;
};

export const DIVISIONS_SECTION = {
  title: 'Five divisions',
  description: 'Each one has its own desk, its own audience and its own pace.',
};

export const DIVISIONS: Division[] = [
  {
    id: 'daily',
    name: 'Quillfield Daily',
    short: 'Daily',
    line: 'A news desk working in French, English and Swahili',
    where: 'Kinshasa, Nairobi, London',
    perThousand: 3200,
  },
  {
    id: 'audio',
    name: 'Quillfield Audio',
    short: 'Audio',
    line: 'Podcasts and radio recorded in Lagos and Kinshasa',
    where: 'Lagos, Kinshasa',
    perThousand: 2100,
  },
  {
    id: 'studios',
    name: 'Quillfield Studios',
    short: 'Studios',
    line: 'Documentary and short film, shot and cut in Nairobi',
    where: 'Nairobi',
    perThousand: 900,
  },
  {
    id: 'data',
    name: 'Quillfield Data',
    short: 'Data',
    line: 'Research and visual reporting from the data desk',
    where: 'London, New York',
    perThousand: 1400,
  },
  {
    id: 'live',
    name: 'Quillfield Live',
    short: 'Live',
    line: 'Conferences and broadcasts produced on location',
    where: 'Singapore, New York',
    perThousand: 600,
  },
];

export const MAP_SECTION = {
  title: 'Where the work happens, and what time it is there',
  description:
    'The clock under each city shows its local time and whether the office is open.',
};

export const PLANNER_SECTION = {
  title: 'Plan a campaign across the divisions',
  description:
    'Set a budget and choose the divisions. The estimate of people reached follows the budget as you move it.',
  budgetLabel: 'Campaign budget',
  reachLabel: 'People reached',
  note: 'Illustrative estimate in US dollars, not a quote',
  action: 'Ask for a plan',
};

export const BUDGET_RANGE = { min: 10000, max: 200000, step: 5000 };

export const DEFAULT_BUDGET = 80000;

export type Story = {
  id: string;
  headline: string;
  desk: string;
  place: string;
  age: string;
};

export const NEWSROOM_SECTION = {
  title: 'Filed today',
  description: 'Sample headlines from each desk, newest first.',
  action: 'Open the newsroom',
};

export const STORIES: Story[] = [
  {
    id: 'cobalt',
    headline: 'Cobalt traders move to digital contracts as export rules change',
    desk: 'Daily',
    place: 'Kinshasa',
    age: '2h',
  },
  {
    id: 'buses',
    headline: 'A year of night buses in Lagos, told in sound',
    desk: 'Audio',
    place: 'Lagos',
    age: '4h',
  },
  {
    id: 'archive',
    headline: 'The last film cooperative in Nairobi opens its archive',
    desk: 'Studios',
    place: 'Nairobi',
    age: '6h',
  },
  {
    id: 'rents',
    headline: 'Rent and wages across 40 cities, charted',
    desk: 'Data',
    place: 'London',
    age: '9h',
  },
  {
    id: 'summit',
    headline: 'A Singapore stage hosts the regional media summit',
    desk: 'Live',
    place: 'Singapore',
    age: '1d',
  },
];

export type FooterLink = {
  label: string;
  href: string;
};

export const FOOTER_LINKS: FooterLink[] = [
  { label: 'Offices', href: `#${OFFICES_ANCHOR}` },
  { label: 'Newsroom', href: `#${NEWSROOM_ANCHOR}` },
  { label: 'Press', href: '#' },
  { label: 'Privacy', href: '#' },
  { label: 'Contact', href: '#' },
];
