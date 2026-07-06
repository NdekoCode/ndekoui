import type { SeriesSlot } from '@/registry/ndeko/lib/agent-run';
import {
  BotIcon,
  CalendarIcon,
  FilterIcon,
  HomeIcon,
  ListChecksIcon,
  NetworkIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';

export const BRAND = { name: 'Pebblecrest' };

export const SALES_LEAD = { name: 'Nadine Mbuyi', role: 'Sales lead' };

const AGENT_SERIES: SeriesSlot = 2;

export const AGENT = { name: 'Scout', series: AGENT_SERIES };

export type SectionId =
  'overview' | 'pipeline' | 'accounts' | 'tasks' | 'agent' | 'calendar';

export type NavItem = {
  id: SectionId;
  label: string;
  icon: Icon;
};

export const NAV: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: HomeIcon },
  { id: 'accounts', label: 'Accounts', icon: NetworkIcon },
  { id: 'agent', label: 'Agent', icon: BotIcon },
  { id: 'pipeline', label: 'Pipeline', icon: FilterIcon },
  { id: 'tasks', label: 'To do', icon: ListChecksIcon },
  { id: 'calendar', label: 'Next 14 days', icon: CalendarIcon },
];

export type FigureId = 'open' | 'won' | 'reply';

export type Figure = {
  id: FigureId;
  label: string;
  value: number;
  format: Intl.NumberFormatOptions;
  suffix?: string;
  change: string;
  direction: 'up' | 'down';
};

export const FIGURES: Figure[] = [
  {
    id: 'open',
    label: 'Open deals',
    value: 42,
    format: { maximumFractionDigits: 0 },
    change: '6 more than last month',
    direction: 'up',
  },
  {
    id: 'won',
    label: 'Won this month',
    value: 86400,
    format: {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    },
    change: 'up 12% on last month',
    direction: 'up',
  },
  {
    id: 'reply',
    label: 'Reply time',
    value: 3.4,
    format: { minimumFractionDigits: 1, maximumFractionDigits: 1 },
    suffix: ' h',
    change: '1.2 h faster than last month',
    direction: 'down',
  },
];

export type StageId = 'new' | 'qualified' | 'proposal' | 'negotiation' | 'won';

export type Stage = {
  id: StageId;
  label: string;
};

export const STAGES: Stage[] = [
  { id: 'new', label: 'New' },
  { id: 'qualified', label: 'Qualified' },
  { id: 'proposal', label: 'Proposal' },
  { id: 'negotiation', label: 'Negotiation' },
  { id: 'won', label: 'Won' },
];

export function stageLabelOf(id: StageId) {
  const stage = STAGES.find((candidate) => candidate.id === id);
  return stage?.label ?? '';
}

export const STAGE_COUNTS_BEFORE = [128, 76, 41, 22, 11];

export const STAGE_COUNTS_AFTER = [128, 92, 47, 24, 11];

export const TREND_WEEKS = [
  'Aug 24',
  'Aug 31',
  'Sep 7',
  'Sep 14',
  'Sep 21',
  'Sep 28',
  'Oct 5',
  'Oct 12',
  'Oct 19',
  'Oct 26',
  'Nov 2',
  'Nov 9',
];

export const NEW_LEADS = [38, 42, 40, 47, 52, 49, 55, 61, 58, 66, 71, 78];

export type Account = {
  id: string;
  name: string;
  city: string;
  stage: StageId;
  valueUsd: number;
};

export type Contact = {
  id: string;
  accountId: string;
  name: string;
  role: string;
};

export const ACCOUNTS: Account[] = [
  {
    id: 'copperline',
    name: 'Copperline Logistics',
    city: 'Lubumbashi',
    stage: 'negotiation',
    valueUsd: 48000,
  },
  {
    id: 'highland',
    name: 'Highland Roast Co',
    city: 'Goma',
    stage: 'proposal',
    valueUsd: 22000,
  },
  {
    id: 'riverbend',
    name: 'Riverbend Fibre',
    city: 'Kinshasa',
    stage: 'won',
    valueUsd: 64000,
  },
  {
    id: 'sunmeadow',
    name: 'Sunmeadow Solar',
    city: 'Goma',
    stage: 'qualified',
    valueUsd: 35000,
  },
  {
    id: 'northgate',
    name: 'Northgate Foods',
    city: 'Lyon',
    stage: 'negotiation',
    valueUsd: 41000,
  },
  {
    id: 'stonebridge',
    name: 'Stonebridge Clinics',
    city: 'Kinshasa',
    stage: 'proposal',
    valueUsd: 18000,
  },
];

export const CONTACTS: Contact[] = [
  {
    id: 'esther',
    accountId: 'copperline',
    name: 'Esther Kasongo',
    role: 'Operations director',
  },
  {
    id: 'didier',
    accountId: 'copperline',
    name: 'Didier Kalala',
    role: 'Procurement lead',
  },
  {
    id: 'patrick',
    accountId: 'highland',
    name: 'Patrick Ilunga',
    role: 'Founder',
  },
  {
    id: 'chantal',
    accountId: 'highland',
    name: 'Chantal Bahati',
    role: 'Sales manager',
  },
  {
    id: 'grace',
    accountId: 'riverbend',
    name: 'Grace Mukendi',
    role: 'Finance lead',
  },
  {
    id: 'jeanluc',
    accountId: 'riverbend',
    name: 'Jean-Luc Kabeya',
    role: 'Head of IT',
  },
  {
    id: 'amani',
    accountId: 'sunmeadow',
    name: 'Amani Mwamba',
    role: 'Project manager',
  },
  {
    id: 'lea',
    accountId: 'sunmeadow',
    name: 'Léa Safari',
    role: 'Buyer',
  },
  {
    id: 'hugo',
    accountId: 'northgate',
    name: 'Hugo Lambert',
    role: 'Supply chain lead',
  },
  {
    id: 'ines',
    accountId: 'northgate',
    name: 'Inès Moreau',
    role: 'Quality manager',
  },
  {
    id: 'joel',
    accountId: 'stonebridge',
    name: 'Joël Banza',
    role: 'Medical director',
  },
  {
    id: 'alphonsine',
    accountId: 'stonebridge',
    name: 'Alphonsine Tshimanga',
    role: 'Administrator',
  },
];

export type NodeKind = 'account' | 'contact';

export type GraphNode = {
  id: string;
  kind: NodeKind;
  accountId: string;
};

export type GraphLink = {
  accountId: string;
  contactId: string;
};

export function contactsOf(accountId: string) {
  return CONTACTS.filter((contact) => contact.accountId === accountId);
}

function nodesOf(account: Account): GraphNode[] {
  const accountNode: GraphNode = {
    id: account.id,
    kind: 'account',
    accountId: account.id,
  };
  const contactNodes = contactsOf(account.id).map((contact) => {
    const node: GraphNode = {
      id: contact.id,
      kind: 'contact',
      accountId: account.id,
    };
    return node;
  });
  return [accountNode, ...contactNodes];
}

/** Each account comes before its own contacts, which is the order the keyboard walks them in. */
export const GRAPH_NODES: GraphNode[] = ACCOUNTS.flatMap(nodesOf);

export const GRAPH_LINKS: GraphLink[] = CONTACTS.map((contact) => ({
  accountId: contact.accountId,
  contactId: contact.id,
}));

export function accountOf(id: string) {
  const account = ACCOUNTS.find((candidate) => candidate.id === id);
  return account ?? ACCOUNTS[0];
}

export function contactOf(id: string) {
  return CONTACTS.find((candidate) => candidate.id === id);
}

const MONEY = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function formatMoney(value: number) {
  return MONEY.format(value);
}

export type NodeDetails = {
  id: string;
  title: string;
  meta: string;
  spoken: string;
};

export function detailsOf(id: string): NodeDetails | null {
  const contact = contactOf(id);
  if (contact) {
    const account = accountOf(contact.accountId);
    const meta = `${contact.role} at ${account.name}`;
    return {
      id,
      title: contact.name,
      meta,
      spoken: `${contact.name}, ${meta}`,
    };
  }
  const account = ACCOUNTS.find((candidate) => candidate.id === id);
  if (!account) {
    return null;
  }
  const stage = stageLabelOf(account.stage);
  const value = formatMoney(account.valueUsd);
  const meta = `${account.city} · ${stage} · ${value}`;
  const spoken = `${account.name}, ${account.city}, ${stage}, ${value}`;
  return { id, title: account.name, meta, spoken };
}

export function spokenNodeOf(id: string) {
  const details = detailsOf(id);
  if (!details) {
    return '';
  }
  return details.spoken;
}

export type Task = {
  id: string;
  title: string;
  due: string;
};

export const TASKS: Task[] = [
  {
    id: 'proposal',
    title: 'Send the proposal to Copperline Logistics',
    due: 'Today',
  },
  {
    id: 'call',
    title: 'Call Esther Kasongo about the renewal',
    due: 'Today',
  },
  {
    id: 'quotes',
    title: 'Review quotes for Sunmeadow Solar',
    due: 'Tomorrow',
  },
  {
    id: 'goma',
    title: 'Update the contacts in Goma',
    due: 'Friday',
  },
];

export const AGENT_TASK: Task = {
  id: 'drafts',
  title: 'Review the 3 follow-ups Scout drafted',
  due: 'Today',
};

export const DEMO_TASK = 'proposal';

export function taskOf(id: string) {
  const known = [...TASKS, AGENT_TASK];
  const task = known.find((candidate) => candidate.id === id);
  return task ?? TASKS[0];
}

export type RunId = 'enrich' | 'qualify' | 'drafts' | 'merge';

export type RunStatus = 'queued' | 'running' | 'waiting' | 'done' | 'failed';

export type RunSeed = {
  id: RunId;
  title: string;
  status: RunStatus;
  note: string;
  request?: string;
};

export const RUNS: RunSeed[] = [
  {
    id: 'merge',
    title: 'Merge duplicate accounts',
    status: 'waiting',
    note: '',
    request: 'Merge 3 duplicate accounts into 3 records',
  },
  {
    id: 'qualify',
    title: 'Qualify new leads',
    status: 'running',
    note: 'Scoring 128 leads against your rules',
  },
  {
    id: 'drafts',
    title: 'Draft follow-ups for stalled deals',
    status: 'queued',
    note: '',
  },
  {
    id: 'enrich',
    title: 'Enrich 24 new leads',
    status: 'done',
    note: 'Added company size and city to 24 leads',
  },
];

export type RunCopy = {
  running: string;
  done: string;
};

export const RUN_COPY: Record<RunId, RunCopy> = {
  enrich: {
    running: 'Adding company size and city',
    done: 'Added company size and city to 24 leads',
  },
  qualify: {
    running: 'Scoring 128 leads against your rules',
    done: 'Moved 16 leads to Qualified',
  },
  drafts: {
    running: 'Writing 3 follow-ups',
    done: '3 drafts are ready for your review',
  },
  merge: {
    running: 'Merging 3 duplicate accounts',
    done: 'Allowed by you. 3 duplicates merged',
  },
};

export const DENIED_NOTE = 'Denied by you. Nothing was merged';

export type EventKind = 'call' | 'demo' | 'deadline';

export type DayEvent = {
  id: string;
  dayIndex: number;
  kind: EventKind;
  title: string;
  time: string;
};

/** The strip starts on a fixed day, so the server and the browser draw the same dates. */
export const STRIP_START = '2026-11-13';

export const STRIP_DAYS = 14;

export const EVENTS: DayEvent[] = [
  {
    id: 'proposal-due',
    dayIndex: 0,
    kind: 'deadline',
    title: 'Proposal due, Copperline Logistics',
    time: '17:00',
  },
  {
    id: 'call-esther',
    dayIndex: 0,
    kind: 'call',
    title: 'Call with Esther Kasongo',
    time: '15:00',
  },
  {
    id: 'demo-highland',
    dayIndex: 3,
    kind: 'demo',
    title: 'Demo for Highland Roast Co',
    time: '10:00',
  },
  {
    id: 'renewal-riverbend',
    dayIndex: 4,
    kind: 'call',
    title: 'Renewal call with Riverbend Fibre',
    time: '11:30',
  },
  {
    id: 'quotes-sunmeadow',
    dayIndex: 6,
    kind: 'deadline',
    title: 'Quotes due, Sunmeadow Solar',
    time: '12:00',
  },
  {
    id: 'demo-stonebridge',
    dayIndex: 6,
    kind: 'demo',
    title: 'Demo for Stonebridge Clinics',
    time: '14:00',
  },
  {
    id: 'sign-copperline',
    dayIndex: 10,
    kind: 'deadline',
    title: 'Contract signing, Copperline Logistics',
    time: '09:30',
  },
  {
    id: 'checkin-northgate',
    dayIndex: 12,
    kind: 'call',
    title: 'Check-in with Northgate Foods',
    time: '16:00',
  },
];

export const KIND_WORD: Record<EventKind, string> = {
  call: 'Call',
  demo: 'Demo',
  deadline: 'Deadline',
};

export function eventsOfDay(dayIndex: number) {
  return EVENTS.filter((event) => event.dayIndex === dayIndex);
}

export type StripDay = {
  index: number;
  weekday: string;
  dayOfMonth: number;
  spoken: string;
};

const WEEKDAY = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  timeZone: 'UTC',
});

const SPOKEN_DAY = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});

const DAY_MS = 86_400_000;

function stripDayOf(index: number): StripDay {
  const start = Date.parse(`${STRIP_START}T00:00:00Z`);
  const date = new Date(start + index * DAY_MS);
  return {
    index,
    weekday: WEEKDAY.format(date),
    dayOfMonth: date.getUTCDate(),
    spoken: SPOKEN_DAY.format(date),
  };
}

export const STRIP: StripDay[] = Array.from(
  { length: STRIP_DAYS },
  (_, index) => stripDayOf(index)
);
