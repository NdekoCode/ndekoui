export type RequestStatus = 'open' | 'planned' | 'building' | 'shipped';

export type FeatureRequest = {
  id: string;
  title: string;
  /** The customer who asked first; the others who asked are counted. */
  company: string;
  others: number;
  votes: number;
  status: RequestStatus;
};

export type NavItem = {
  id: 'inbox' | 'requests' | 'roadmap' | 'changelog' | 'customers';
  label: string;
  count?: number;
};

export const HERO = {
  eyebrow: 'Feedback, roadmap and changelog in one place',
  title: 'Hear every customer, then ship what they asked for',
  description:
    'Requests from email, chat and calls land in one list, ranked by how many customers asked. Mark one shipped and everyone who asked hears about it.',
  primaryAction: 'Start for free',
  secondaryAction: 'Book a demo',
};

export const WORKSPACE = 'Harbor & Pine';

export const NAV: NavItem[] = [
  { id: 'inbox', label: 'Inbox', count: 12 },
  { id: 'requests', label: 'Requests' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'changelog', label: 'Changelog' },
  { id: 'customers', label: 'Customers' },
];

export const FILTERS = ['Open', 'Planned', 'Shipped'];

export const REQUESTS: FeatureRequest[] = [
  {
    id: 'csv',
    title: 'Export reports to CSV',
    company: 'Lumen Labs',
    others: 47,
    votes: 48,
    status: 'planned',
  },
  {
    id: 'dark',
    title: 'Dark mode for the dashboard',
    company: 'Northwind Atelier',
    others: 40,
    votes: 41,
    status: 'building',
  },
  {
    id: 'key',
    title: 'Sign in with a security key',
    company: 'Brightwater Clinic',
    others: 32,
    votes: 33,
    status: 'planned',
  },
  {
    id: 'tags',
    title: 'Edit the tags of many requests at once',
    company: 'Copperfield and Co',
    others: 26,
    votes: 27,
    status: 'open',
  },
  {
    id: 'digest',
    title: 'A weekly digest by email',
    company: 'Sable Studio',
    others: 1,
    votes: 2,
    status: 'open',
  },
];

/** The request the demonstration brings in at the top of the list. */
export const ARRIVING: FeatureRequest = {
  id: 'share',
  title: 'Share a saved view with a link',
  company: 'Pinecone Bakery',
  others: 0,
  votes: 1,
  status: 'open',
};
