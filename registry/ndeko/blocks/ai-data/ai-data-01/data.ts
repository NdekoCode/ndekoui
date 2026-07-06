export type PlanId = 'starter' | 'team' | 'business' | 'enterprise';

export type RegionId =
  'europe' | 'north-america' | 'asia-pacific' | 'latin-america';

export type Health = 'healthy' | 'watch' | 'risk';

export type OwnerId = 'maya' | 'jonas' | 'priya' | 'tomas';

export type Owner = {
  id: OwnerId;
  name: string;
  firstName: string;
};

export const OWNERS: Owner[] = [
  { id: 'maya', name: 'Maya Okafor', firstName: 'Maya' },
  { id: 'jonas', name: 'Jonas Weber', firstName: 'Jonas' },
  { id: 'priya', name: 'Priya Nair', firstName: 'Priya' },
  { id: 'tomas', name: 'Tomas Rivera', firstName: 'Tomas' },
];

const FALLBACK_OWNER = OWNERS[0];

export function ownerOf(id: OwnerId) {
  const owner = OWNERS.find((candidate) => candidate.id === id);
  return owner ?? FALLBACK_OWNER;
}

export const PLANS: PlanId[] = ['starter', 'team', 'business', 'enterprise'];

export const PLAN_LABEL: Record<PlanId, string> = {
  starter: 'Starter',
  team: 'Team',
  business: 'Business',
  enterprise: 'Enterprise',
};

/** Plans sort by size, not by letter. */
export const PLAN_RANK: Record<PlanId, number> = {
  starter: 0,
  team: 1,
  business: 2,
  enterprise: 3,
};

export const REGIONS: RegionId[] = [
  'europe',
  'north-america',
  'asia-pacific',
  'latin-america',
];

export const REGION_LABEL: Record<RegionId, string> = {
  europe: 'Europe',
  'north-america': 'North America',
  'asia-pacific': 'Asia Pacific',
  'latin-america': 'Latin America',
};

export const HEALTH_LABEL: Record<Health, string> = {
  healthy: 'Healthy',
  watch: 'Watch',
  risk: 'At risk',
};

export type Account = {
  id: string;
  name: string;
  plan: PlanId;
  region: RegionId;
  seats: number;
  /** Seats added or removed since last quarter. */
  seatsDelta: number;
  /** The day the contract renews, as an ISO day. */
  renewal: string;
  health: Health;
  owner: OwnerId;
  /** What the account team noticed last, as one plain fact. */
  signal: string;
};

/** The day the sample data is read on. A fixed day keeps the server and the browser on the same page. */
const TODAY = '2026-11-12';

const QUARTER_END = '2026-12-31';

const THIS_YEAR = '2026';

export const TODAY_LABEL = 'Nov 12';

/** Invented companies, seats and dates. The figures are illustrative. */
export const ACCOUNTS: Account[] = [
  {
    id: 'halden-works',
    name: 'Halden Works',
    plan: 'enterprise',
    region: 'europe',
    seats: 320,
    seatsDelta: 24,
    renewal: '2026-12-04',
    health: 'healthy',
    owner: 'maya',
    signal: 'Their admin asked about audit logs in October',
  },
  {
    id: 'norhaven-freight',
    name: 'Norhaven Freight',
    plan: 'business',
    region: 'north-america',
    seats: 84,
    seatsDelta: -6,
    renewal: '2027-03-18',
    health: 'watch',
    owner: 'jonas',
    signal: 'Usage dropped after two dispatchers left in September',
  },
  {
    id: 'solway-books',
    name: 'Solway Books',
    plan: 'team',
    region: 'europe',
    seats: 26,
    seatsDelta: 3,
    renewal: '2026-11-30',
    health: 'healthy',
    owner: 'priya',
    signal: 'They opened one ticket this quarter, solved the same day',
  },
  {
    id: 'kestrel-labs',
    name: 'Kestrel Labs',
    plan: 'enterprise',
    region: 'europe',
    seats: 140,
    seatsDelta: -18,
    renewal: '2027-02-09',
    health: 'risk',
    owner: 'maya',
    signal: 'Weekly logins fell by a third since their reorganisation',
  },
  {
    id: 'marlow-finch',
    name: 'Marlow & Finch',
    plan: 'starter',
    region: 'europe',
    seats: 8,
    seatsDelta: 0,
    renewal: '2027-05-21',
    health: 'healthy',
    owner: 'tomas',
    signal: 'They are still on the first project they created',
  },
  {
    id: 'brightwell-health',
    name: 'Brightwell Health',
    plan: 'enterprise',
    region: 'north-america',
    seats: 410,
    seatsDelta: 40,
    renewal: '2026-12-15',
    health: 'watch',
    owner: 'jonas',
    signal: 'A second department is waiting on a security review',
  },
  {
    id: 'pallas-robotics',
    name: 'Pallas Robotics',
    plan: 'business',
    region: 'asia-pacific',
    seats: 96,
    seatsDelta: 12,
    renewal: '2027-01-27',
    health: 'healthy',
    owner: 'priya',
    signal: 'Their team built nine automations last month',
  },
  {
    id: 'verano-foods',
    name: 'Verano Foods',
    plan: 'team',
    region: 'latin-america',
    seats: 34,
    seatsDelta: -9,
    renewal: '2026-12-22',
    health: 'risk',
    owner: 'tomas',
    signal: 'Two invoices were paid late this year',
  },
  {
    id: 'tidemark-energy',
    name: 'Tidemark Energy',
    plan: 'enterprise',
    region: 'europe',
    seats: 88,
    seatsDelta: 4,
    renewal: '2027-04-02',
    health: 'healthy',
    owner: 'maya',
    signal: 'They asked for a quote on 40 more seats',
  },
  {
    id: 'quillon-legal',
    name: 'Quillon Legal',
    plan: 'business',
    region: 'europe',
    seats: 62,
    seatsDelta: -11,
    renewal: '2026-11-19',
    health: 'risk',
    owner: 'priya',
    signal: 'Their champion moved to another firm in August',
  },
  {
    id: 'aster-studio',
    name: 'Aster Studio',
    plan: 'starter',
    region: 'north-america',
    seats: 5,
    seatsDelta: 0,
    renewal: '2027-06-11',
    health: 'healthy',
    owner: 'jonas',
    signal: 'Both founders log in every day',
  },
  {
    id: 'lumiere-travel',
    name: 'Lumiere Travel',
    plan: 'team',
    region: 'europe',
    seats: 41,
    seatsDelta: -4,
    renewal: '2027-01-14',
    health: 'watch',
    owner: 'maya',
    signal: 'Seasonal staff left and their seats were not removed',
  },
  {
    id: 'corvid-security',
    name: 'Corvid Security',
    plan: 'enterprise',
    region: 'asia-pacific',
    seats: 230,
    seatsDelta: 30,
    renewal: '2027-03-05',
    health: 'healthy',
    owner: 'priya',
    signal: 'They rolled out to their Sydney office this quarter',
  },
  {
    id: 'fennel-market',
    name: 'Fennel Market',
    plan: 'starter',
    region: 'latin-america',
    seats: 12,
    seatsDelta: 2,
    renewal: '2027-02-24',
    health: 'watch',
    owner: 'tomas',
    signal: 'The owner has not logged in for three weeks',
  },
  {
    id: 'greyfriars-bank',
    name: 'Greyfriars Bank',
    plan: 'enterprise',
    region: 'europe',
    seats: 540,
    seatsDelta: -35,
    renewal: '2026-12-11',
    health: 'risk',
    owner: 'maya',
    signal: 'Their procurement team asked for the contract terms twice',
  },
  {
    id: 'ironbridge-tools',
    name: 'Ironbridge Tools',
    plan: 'business',
    region: 'north-america',
    seats: 118,
    seatsDelta: 9,
    renewal: '2027-05-08',
    health: 'healthy',
    owner: 'jonas',
    signal: 'They renewed a month early last year',
  },
  {
    id: 'rowan-clinics',
    name: 'Rowan Clinics',
    plan: 'team',
    region: 'asia-pacific',
    seats: 29,
    seatsDelta: 5,
    renewal: '2026-12-29',
    health: 'healthy',
    owner: 'priya',
    signal: 'Three clinics were added since spring',
  },
  {
    id: 'larkspur-media',
    name: 'Larkspur Media',
    plan: 'business',
    region: 'europe',
    seats: 73,
    seatsDelta: 7,
    renewal: '2027-04-19',
    health: 'healthy',
    owner: 'tomas',
    signal: 'Editors use it daily, the sales team barely at all',
  },
  {
    id: 'heron-logistics',
    name: 'Heron Logistics',
    plan: 'enterprise',
    region: 'latin-america',
    seats: 164,
    seatsDelta: -14,
    renewal: '2027-01-06',
    health: 'watch',
    owner: 'tomas',
    signal: 'Another vendor ran a pilot with their operations team',
  },
  {
    id: 'pemberton-schools',
    name: 'Pemberton Schools',
    plan: 'team',
    region: 'north-america',
    seats: 48,
    seatsDelta: 6,
    renewal: '2027-03-29',
    health: 'healthy',
    owner: 'jonas',
    signal: 'Usage follows the school calendar and is back up',
  },
  {
    id: 'rookery-games',
    name: 'Rookery Games',
    plan: 'starter',
    region: 'asia-pacific',
    seats: 9,
    seatsDelta: -3,
    renewal: '2026-11-25',
    health: 'risk',
    owner: 'priya',
    signal: 'The card on file expired in October',
  },
  {
    id: 'saltmarsh-hotels',
    name: 'Saltmarsh Hotels',
    plan: 'business',
    region: 'europe',
    seats: 104,
    seatsDelta: 10,
    renewal: '2027-06-02',
    health: 'watch',
    owner: 'maya',
    signal: 'They asked how to add a second workspace',
  },
  {
    id: 'thornbury-insurance',
    name: 'Thornbury Insurance',
    plan: 'enterprise',
    region: 'europe',
    seats: 275,
    seatsDelta: 21,
    renewal: '2027-02-17',
    health: 'healthy',
    owner: 'jonas',
    signal: 'Their compliance team signed off on the data policy',
  },
  {
    id: 'wexford-dairy',
    name: 'Wexford Dairy',
    plan: 'team',
    region: 'europe',
    seats: 22,
    seatsDelta: 1,
    renewal: '2027-04-27',
    health: 'healthy',
    owner: 'priya',
    signal: 'One person does all the work in it',
  },
];

const FALLBACK_ACCOUNT = ACCOUNTS[0];

export function accountOf(id: string) {
  const account = ACCOUNTS.find((candidate) => candidate.id === id);
  return account ?? FALLBACK_ACCOUNT;
}

/** A renewal still to come before the quarter ends. ISO days compare as text. */
export function renewsThisQuarter(account: Account) {
  const isStillAhead = account.renewal >= TODAY;
  const isBeforeQuarterEnd = account.renewal <= QUARTER_END;
  return isStillAhead && isBeforeQuarterEnd;
}

/** A fixed time zone, so a day never shifts between the server and the browser. */
const DAY_FORMAT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

const DAY_AND_YEAR_FORMAT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

/** Dec 4 this year, Mar 18, 2027 after it. */
export function renewalLabelOf(renewal: string) {
  const day = new Date(`${renewal}T00:00:00Z`);
  const isThisYear = renewal.startsWith(THIS_YEAR);
  if (isThisYear) {
    return DAY_FORMAT.format(day);
  }
  return DAY_AND_YEAR_FORMAT.format(day);
}

function seatsChangeOf(delta: number) {
  if (delta > 0) {
    return `${delta} more than last quarter`;
  }
  if (delta < 0) {
    return `${Math.abs(delta)} fewer than last quarter`;
  }
  return 'the same as last quarter';
}

function nextStepOf(account: Account) {
  const day = renewalLabelOf(account.renewal);
  const isSoon = renewsThisQuarter(account);
  const isAtRisk = account.health === 'risk';
  if (isAtRisk && isSoon) {
    return `It renews on ${day}: call them before then.`;
  }
  if (isAtRisk) {
    return `Worth a call well before it renews on ${day}.`;
  }
  if (account.health === 'watch') {
    return `Keep an eye on it until it renews on ${day}.`;
  }
  if (isSoon) {
    return `It renews on ${day}, a good moment to offer the yearly plan.`;
  }
  return `Nothing to do before it renews on ${day}.`;
}

/** Three sentences written from the fields of the row. No model is called. */
export function summaryOf(account: Account) {
  const plan = PLAN_LABEL[account.plan];
  const change = seatsChangeOf(account.seatsDelta);
  const facts = `${account.name} is on ${plan} with ${account.seats} seats, ${change}.`;
  const nextStep = nextStepOf(account);
  return `${facts} ${account.signal}. ${nextStep}`;
}
