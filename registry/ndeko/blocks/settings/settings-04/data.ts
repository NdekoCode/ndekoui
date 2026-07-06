export type Environment = 'live' | 'test';

export type Access = 'read' | 'full';

export type ApiKey = {
  id: string;
  name: string;
  environment: Environment;
  /** The last characters of the secret: all a row ever shows of it. */
  tail: string;
  createdOn: string;
  createdBy: string;
  lastUsed: string;
  /** Days since the last request, once a key has gone quiet long enough to be flagged. */
  idleDays: number | null;
  /** Spend this month, in cents. */
  spendCents: number;
  access: Access;
  /** Requests on each of the last 14 days, oldest first. */
  requests: number[];
};

export const WORKSPACE_NAME = 'Tidewell Studio';

export const YOU = 'Dana Whitfield';

export const TODAY = 'Nov 12, 2026';

/** A key that has not called the API for this long is flagged as idle. */
export const IDLE_AFTER_DAYS = 30;

export const NAME_MAX_LENGTH = 40;

export const ENVIRONMENT_LABEL: Record<Environment, string> = {
  live: 'Live',
  test: 'Test',
};

export const ACCESS_LABEL: Record<Access, string> = {
  read: 'Read only',
  full: 'Full access',
};

export const SCOPES: Record<Access, string[]> = {
  read: ['projects.read', 'time.read', 'reports.read'],
  full: ['projects.write', 'time.write', 'reports.read', 'invoices.read'],
};

/**
 * Sample secrets, shown once when a key is made. They open nothing: the word "example" in each
 * says so to anyone who copies one.
 */
export const SAMPLE_SECRETS = [
  'example8fM3sQ1vX6nB',
  'example2Hc9Lp5Rz7Ka',
  'example6Tn4Wd8Ye3Gs',
  'example9Jb7Fx2Mq5Ur',
];

export const KEYS: ApiKey[] = [
  {
    id: 'production',
    name: 'Production server',
    environment: 'live',
    tail: 'Q7xk',
    createdOn: 'Mar 4, 2026',
    createdBy: 'Amara Okafor',
    lastUsed: '2 min ago',
    idleDays: null,
    spendCents: 18420,
    access: 'full',
    requests: [
      1180, 1240, 960, 1310, 1420, 890, 770, 1260, 1390, 1450, 1330, 980, 860,
      1210,
    ],
  },
  {
    id: 'billing-worker',
    name: 'Billing worker',
    environment: 'live',
    tail: 'm3Rd',
    createdOn: 'Jan 12, 2026',
    createdBy: 'Lucas Moreau',
    lastUsed: '1 hour ago',
    idleDays: null,
    spendCents: 4175,
    access: 'read',
    requests: [
      210, 190, 240, 260, 180, 90, 70, 230, 250, 270, 220, 110, 80, 240,
    ],
  },
  {
    id: 'staging',
    name: 'Staging',
    environment: 'test',
    tail: 'v8Wn',
    createdOn: 'Feb 2, 2026',
    createdBy: 'Priya Raman',
    lastUsed: 'today',
    idleDays: null,
    spendCents: 0,
    access: 'full',
    requests: [40, 65, 30, 80, 55, 0, 0, 70, 90, 45, 60, 0, 10, 85],
  },
  {
    id: 'old-import',
    name: 'Old import script',
    environment: 'live',
    tail: 'b2Tf',
    createdOn: 'Aug 19, 2025',
    createdBy: 'Mateo Silva',
    lastUsed: 'Oct 1',
    idleDays: 42,
    spendCents: 0,
    access: 'full',
    requests: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
];
