export const LEADS_ANCHOR = 'leads';

export const WORK_ANCHOR = 'work';

export const SPRINT_ANCHOR = 'sprint';

export const PRICING_ANCHOR = 'pricing';

export const QUESTIONS_ANCHOR = 'questions';

export type NavLink = {
  id: string;
  label: string;
  href: string;
};

export const NAV_LINKS: NavLink[] = [
  { id: 'work', label: 'What it does', href: `#${WORK_ANCHOR}` },
  { id: 'sprint', label: 'Sprints', href: `#${SPRINT_ANCHOR}` },
  { id: 'pricing', label: 'Pricing', href: `#${PRICING_ANCHOR}` },
  { id: 'questions', label: 'Questions', href: `#${QUESTIONS_ANCHOR}` },
];

export const BRAND = {
  name: 'Hearthwork',
  tagline: 'A team workspace with a customer list in it',
  copyright: '© 2026 Hearthwork',
};

export const HEADER = {
  action: 'Start a workspace',
  shortAction: 'Start',
  actionHref: `#${PRICING_ANCHOR}`,
};

export const HERO = {
  eyebrow: 'Workspace and CRM',
  title: 'One workspace for the team and the customers it works for',
  description:
    'Hearthwork keeps tasks, documents and your customer list in one place, so the person who promised a quote is the person who sees it come due.',
  primaryAction: 'Start a workspace',
  secondaryAction: 'Watch a sprint',
};

export type LeadStage = 'new' | 'qualified' | 'proposal' | 'won';

export type StageFilter = 'all' | LeadStage;

export type Lead = {
  id: string;
  name: string;
  company: string;
  stage: LeadStage;
  valueCents: number;
  owner: string;
  touchedDaysAgo: number;
};

export const STAGE_LABEL: Record<LeadStage, string> = {
  new: 'New',
  qualified: 'Qualified',
  proposal: 'Proposal',
  won: 'Won',
};

export const STAGE_FILTERS: { value: StageFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'won', label: 'Won' },
];

export const LEADS_SECTION = {
  note: 'Illustrative leads and values',
};

export const LEADS: Lead[] = [
  {
    id: 'nkulu',
    name: 'Grace Nkulu',
    company: 'Nkulu Print Works',
    stage: 'qualified',
    valueCents: 1840000,
    owner: 'Amani Kasongo',
    touchedDaysAgo: 2,
  },
  {
    id: 'rey',
    name: 'Tomás Rey',
    company: 'Bairro Coffee',
    stage: 'new',
    valueCents: 420000,
    owner: 'Inès Duarte',
    touchedDaysAgo: 5,
  },
  {
    id: 'diallo',
    name: 'Fatou Diallo',
    company: 'Sahel Textiles',
    stage: 'proposal',
    valueCents: 3200000,
    owner: 'Amani Kasongo',
    touchedDaysAgo: 1,
  },
  {
    id: 'banza',
    name: 'Kevin Banza',
    company: 'Banza Logistics',
    stage: 'won',
    valueCents: 5650000,
    owner: 'Kofi Asante',
    touchedDaysAgo: 9,
  },
  {
    id: 'martin',
    name: 'Léa Martin',
    company: 'Atelier Lune',
    stage: 'new',
    valueCents: 280000,
    owner: 'Mira Holm',
    touchedDaysAgo: 3,
  },
  {
    id: 'mpoyi',
    name: 'Joseph Mpoyi',
    company: 'Mpoyi Seeds',
    stage: 'qualified',
    valueCents: 960000,
    owner: 'Inès Duarte',
    touchedDaysAgo: 4,
  },
  {
    id: 'bello',
    name: 'Aisha Bello',
    company: 'Bello Fresh Foods',
    stage: 'proposal',
    valueCents: 2130000,
    owner: 'Kofi Asante',
    touchedDaysAgo: 2,
  },
  {
    id: 'ilunga',
    name: 'Pascal Ilunga',
    company: 'Ilunga Solar',
    stage: 'won',
    valueCents: 4100000,
    owner: 'Amani Kasongo',
    touchedDaysAgo: 12,
  },
];

export const WORK_SECTION = {
  title: 'Each part of the work shows itself working',
  description:
    'Deals, replies and tasks live in the same workspace, so one thing leads to the next without a copy and paste.',
};

export const DEAL_FLOW = {
  title: 'Deals move on their own',
  description:
    'When a lead replies, its card moves to the next stage. Nobody drags it.',
  stages: ['New', 'Qualified', 'Proposal', 'Won'],
  deal: 'Fatou Diallo',
  value: '$32,000',
};

export const REPLY_DRAFT = {
  title: 'Replies drafted from the thread',
  description:
    'Hearthwork drafts the follow-up from the whole thread. You edit it and send.',
  incoming: 'Can you send the revised quote with the delivery dates?',
  incomingFrom: 'Fatou Diallo',
  draft:
    'Hi Fatou, here is the revised quote with delivery from 12 March. Shall we book a call on Thursday?',
  insert: 'Insert the draft',
  inserted: 'Inserted',
};

export const TASK_CAPTURE = {
  title: 'Call notes become tasks',
  description: 'Say it in the call and find it on the board afterwards.',
  noteLead: 'Send the pricing recap by',
  notePhrase: 'Friday',
  task: 'Send the pricing recap',
  due: 'Due Friday',
};

export type SprintTask = {
  id: string;
  title: string;
};

export const SPRINT_SECTION = {
  title: 'An agent works down the sprint with you',
  description:
    'Scout takes the small tasks, shows which one it is on and ticks it when it is done. You can tick anything yourself.',
  sprint: 'Sprint 14',
  agent: 'Scout',
};

export const SPRINT_TASKS: SprintTask[] = [
  { id: 'note', title: 'Draft the release note' },
  { id: 'pricing', title: 'Review the pricing page' },
  { id: 'import', title: 'Update the leads import' },
  { id: 'pilot', title: 'Reply to the Kinshasa pilot' },
  { id: 'call', title: 'Book the customer call' },
  { id: 'close', title: 'Close the sprint' },
];

export type TaskCard = {
  id: string;
  title: string;
  project: string;
  due: string;
  assignee: string;
};

export const CONVEYOR_SECTION = {
  title: 'Every task in view, within reach',
  description:
    'Task cards ride past on a conveyor. Flick it and it carries on, then settles back into its pace.',
  hint: 'Sample tasks. Drag or flick the cards, or press the arrow keys',
};

export const TASK_CARDS: TaskCard[] = [
  {
    id: 'quote',
    title: 'Send the revised quote to Sahel Textiles',
    project: 'Sales',
    due: 'Thu',
    assignee: 'Amani Kasongo',
  },
  {
    id: 'onboarding',
    title: 'Prepare the onboarding checklist',
    project: 'Onboarding',
    due: 'Fri',
    assignee: 'Inès Duarte',
  },
  {
    id: 'pilot',
    title: 'Review the Lubumbashi pilot feedback',
    project: 'Product',
    due: 'Mon',
    assignee: 'Kofi Asante',
  },
  {
    id: 'invoice',
    title: 'Reply to the invoice question',
    project: 'Billing',
    due: 'Tue',
    assignee: 'Mira Holm',
  },
  {
    id: 'mapping',
    title: 'Update the leads import mapping',
    project: 'Data',
    due: 'Wed',
    assignee: 'Amani Kasongo',
  },
  {
    id: 'quarterly',
    title: 'Book the quarterly customer call',
    project: 'Success',
    due: 'Fri',
    assignee: 'Inès Duarte',
  },
  {
    id: 'release',
    title: 'Write the release note',
    project: 'Product',
    due: 'Thu',
    assignee: 'Kofi Asante',
  },
  {
    id: 'archive',
    title: 'Archive closed deals from February',
    project: 'Sales',
    due: 'Mon',
    assignee: 'Mira Holm',
  },
];

export type SeatOption = '5' | '10' | '25';

export const DEFAULT_SEATS: SeatOption = '10';

export const SEAT_SEGMENTS: { value: SeatOption; label: string }[] = [
  { value: '5', label: '5 seats' },
  { value: '10', label: '10 seats' },
  { value: '25', label: '25 seats' },
];

export const OFFER = {
  name: 'Team',
  seatPrice: 12,
  period: 'per seat a month',
  title: 'One plan, priced by seat',
  description:
    'Tasks, documents, the customer list and the agent are all in the plan. Pick the number of seats and see the month.',
  totalLabel: 'Each month',
  note: 'Illustrative price in US dollars',
  action: 'Start a workspace',
  after: 'Invite the team once the workspace exists',
  facts: [
    { label: 'Workspaces', value: 'One per company' },
    { label: 'Contacts and leads', value: 'No limit' },
    { label: 'Agent runs', value: '500 a month' },
    { label: 'Import', value: 'CSV, any layout' },
  ],
};

export type Question = {
  id: string;
  question: string;
  answer: string;
};

export const QUESTIONS_SECTION = {
  title: 'Questions about Hearthwork',
  description: 'What teams ask before they move their customers in',
};

export const QUESTIONS: Question[] = [
  {
    id: 'import',
    question: 'Can I bring my customer list with me?',
    answer:
      'Yes. Upload a CSV in any layout and map its columns once. Leads keep their owner and their last contact date.',
  },
  {
    id: 'agent',
    question: 'What does the agent do without asking?',
    answer:
      'It ticks tasks you gave it, drafts replies and moves deals when a lead answers. It asks before it sends anything to a customer.',
  },
  {
    id: 'seats',
    question: 'Do customers need a seat?',
    answer:
      'No. Seats are for the people who work in the workspace. Customers are contacts and cost nothing.',
  },
  {
    id: 'export',
    question: 'Can I take my data out?',
    answer:
      'Export leads, tasks and documents at any time. Nothing is deleted until you close the workspace yourself.',
  },
  {
    id: 'offline',
    question: 'Does it work on a slow connection?',
    answer:
      'Pages load their text first and fill in the rest. Edits you make offline are kept and synced when the connection returns.',
  },
];

export type FooterLink = {
  label: string;
  href: string;
};

export const FOOTER_LINKS: FooterLink[] = [
  { label: 'Pricing', href: `#${PRICING_ANCHOR}` },
  { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' },
  { label: 'Contact', href: '#' },
];
