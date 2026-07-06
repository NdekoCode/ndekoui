import type { SeriesSlot } from '@/registry/ndeko/lib/agent-run';
import {
  BotIcon,
  GaugeIcon,
  LayoutGridIcon,
  PlugIcon,
  RouteIcon,
  ShieldCheckIcon,
  UsersIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';

export type PageId =
  | 'overview'
  | 'agents'
  | 'runs'
  | 'approvals'
  | 'connections'
  | 'usage'
  | 'members';

export type NavItem = {
  id: PageId;
  label: string;
  icon: Icon;
};

export type NavGroup = {
  id: string;
  label?: string;
  items: NavItem[];
};

export type Workspace = {
  id: string;
  name: string;
  memberCount: number;
};

export type Person = {
  name: string;
  role: string;
};

export const WORKSPACES: Workspace[] = [
  { id: 'kivuline', name: 'Kivuline Roasters', memberCount: 12 },
  { id: 'lukala', name: 'Lukala Freight', memberCount: 34 },
  { id: 'personal', name: 'Personal', memberCount: 1 },
];

export const CURRENT_PERSON: Person = {
  name: 'Nadine Kabongo',
  role: 'Operations lead',
};

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'work',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutGridIcon },
      { id: 'agents', label: 'Agents', icon: BotIcon },
      { id: 'runs', label: 'Runs', icon: RouteIcon },
      { id: 'approvals', label: 'Approvals', icon: ShieldCheckIcon },
    ],
  },
  {
    id: 'workspace',
    label: 'Workspace',
    items: [
      { id: 'connections', label: 'Connections', icon: PlugIcon },
      { id: 'usage', label: 'Usage', icon: GaugeIcon },
      { id: 'members', label: 'Members', icon: UsersIcon },
    ],
  },
];

export type EmptyPage = {
  title: string;
  line: string;
};

/** The template draws the overview: every other page of the sidebar says what belongs on it. */
export const EMPTY_PAGES: Record<Exclude<PageId, 'overview'>, EmptyPage> = {
  agents: {
    title: 'Every agent, with its tools',
    line: 'A list of the agents of this workspace, the tools each one can reach and its last run, goes on this page.',
  },
  runs: {
    title: 'Every run, newest first',
    line: 'The full history of runs, with the plan and the calls of each one, goes on this page.',
  },
  approvals: {
    title: 'Every request, answered or not',
    line: 'Requests that wait and the ones already answered, with who answered, go on this page.',
  },
  connections: {
    title: 'Tools your agents can reach',
    line: 'The accounts connected to this workspace and what each agent may do with them go on this page.',
  },
  usage: {
    title: 'Spend, by agent and by day',
    line: 'The month in detail, with the budget and the agents that use it, goes on this page.',
  },
  members: {
    title: 'The people of this workspace',
    line: 'Members, their roles and the requests each one answers go on this page.',
  },
};

export type AgentId =
  'reconciler' | 'writer' | 'researcher' | 'reviewer' | 'planner';

export type Agent = {
  id: AgentId;
  name: string;
  series: SeriesSlot;
};

export const AGENTS: Record<AgentId, Agent> = {
  reconciler: { id: 'reconciler', name: 'Reconciler', series: 1 },
  writer: { id: 'writer', name: 'Writer', series: 2 },
  researcher: { id: 'researcher', name: 'Researcher', series: 3 },
  reviewer: { id: 'reviewer', name: 'Reviewer', series: 4 },
  planner: { id: 'planner', name: 'Planner', series: 5 },
};

export const AGENT_ORDER: AgentId[] = [
  'reconciler',
  'writer',
  'researcher',
  'reviewer',
  'planner',
];

export type Risk = 'low' | 'medium' | 'high';

export type RequestId = 'entries' | 'refund' | 'booking' | 'digest';

export type RequestSeed = {
  id: RequestId;
  agentId: AgentId;
  title: string;
  detail: string;
  risk: Risk;
  waiting: string;
};

/** Invented requests and amounts. The figures are illustrative. */
export const REQUESTS: Record<RequestId, RequestSeed> = {
  entries: {
    id: 'entries',
    agentId: 'reconciler',
    title: 'Post 14 journal entries',
    detail: 'March green coffee purchases, matched to 14 supplier invoices',
    risk: 'medium',
    waiting: 'Waiting for 6 min',
  },
  refund: {
    id: 'refund',
    agentId: 'reviewer',
    title: 'Refund $240 to Grace Ilunga',
    detail: 'A wholesale order that arrived a week late, over the $150 limit',
    risk: 'high',
    waiting: 'Waiting for 14 min',
  },
  booking: {
    id: 'booking',
    agentId: 'planner',
    title: 'Book the Friday freight slot',
    detail: '8 pallets from Lubumbashi to Kinshasa, $420 deposit',
    risk: 'medium',
    waiting: 'Waiting for 22 min',
  },
  digest: {
    id: 'digest',
    agentId: 'writer',
    title: 'Send the supplier digest to 12 people',
    detail: 'The draft is ready and goes out from your address',
    risk: 'low',
    waiting: 'Just arrived',
  },
};

export const INITIAL_PENDING: RequestId[] = ['entries', 'refund', 'booking'];

export type RunId =
  'digest' | 'posting' | 'bank' | 'vendors' | 'forecast' | 'count';

export type RunSeed = {
  id: RunId;
  agentId: AgentId;
  runningText: string;
  doneText: string;
  runningDetail: string;
  doneDetail: string;
  hoursSaved: number;
  costUsd: number;
  /** The run starts only if this request was allowed. */
  afterApproval?: RequestId;
};

export const RUNS: Record<RunId, RunSeed> = {
  digest: {
    id: 'digest',
    agentId: 'writer',
    runningText: 'Writer is drafting the supplier digest',
    doneText: 'Writer finished the supplier digest',
    runningDetail: 'Started 3 min ago',
    doneDetail: 'Took 4 min, $0.38',
    hoursSaved: 0.6,
    costUsd: 0.38,
  },
  posting: {
    id: 'posting',
    agentId: 'reconciler',
    runningText: 'Reconciler is posting the journal entries',
    doneText: 'Reconciler posted 14 journal entries',
    runningDetail: 'Started just now',
    doneDetail: 'Took 1 min, $1.12',
    hoursSaved: 1.2,
    costUsd: 1.12,
    afterApproval: 'entries',
  },
  bank: {
    id: 'bank',
    agentId: 'reconciler',
    runningText: 'Reconciler is matching the bank lines',
    doneText: 'Reconciler matched 398 of 412 bank lines',
    runningDetail: 'Started 20 min ago',
    doneDetail: '26 min ago, 14 lines left for you',
    hoursSaved: 0,
    costUsd: 0,
  },
  vendors: {
    id: 'vendors',
    agentId: 'researcher',
    runningText: 'Researcher is checking the new suppliers',
    doneText: 'Researcher checked 6 new suppliers against the vendor list',
    runningDetail: 'Started 50 min ago',
    doneDetail: '1 h ago, none flagged',
    hoursSaved: 0,
    costUsd: 0,
  },
  forecast: {
    id: 'forecast',
    agentId: 'reviewer',
    runningText: 'Reviewer is reading the cash forecast',
    doneText: 'Reviewer finished the cash forecast review',
    runningDetail: 'Started 2 h ago',
    doneDetail: '2 h ago, 3 comments',
    hoursSaved: 0,
    costUsd: 0,
  },
  count: {
    id: 'count',
    agentId: 'planner',
    runningText: 'Planner is scheduling the stock count',
    doneText: 'Planner scheduled the stock count for Friday',
    runningDetail: 'Started 3 h ago',
    doneDetail: '3 h ago, 4 people notified',
    hoursSaved: 0,
    costUsd: 0,
  },
};

export const INITIAL_RUNS: RunId[] = [
  'digest',
  'bank',
  'vendors',
  'forecast',
  'count',
];

export const BASE_FIGURES = {
  runsToday: 42,
  hoursSaved: 18.5,
};

export const BUDGET_USD = 120;

export const BUDGET_LABEL = '$120';

export const BASE_SPEND: Record<AgentId, number> = {
  reconciler: 14.6,
  writer: 9.8,
  researcher: 8.4,
  reviewer: 3.9,
  planner: 1.5,
};

export const PAGE = {
  title: 'Overview',
  meta: 'This week',
  note: 'Illustrative figures',
};

export const FIGURE_LABELS = {
  runs: 'Runs today',
  waiting: 'Need you',
  hours: 'Hours saved this week',
  spend: 'Spend this month',
};
