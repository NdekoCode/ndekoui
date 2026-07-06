export type PlanId = 'solo' | 'studio' | 'agency';

export type Plan = {
  id: PlanId;
  name: string;
  price: number;
  priceNote: string;
  action: string;
  isFeatured: boolean;
};

export type Cell =
  { kind: 'check' } | { kind: 'dash' } | { kind: 'value'; text: string };

export type Row = {
  id: string;
  feature: string;
  cells: Record<PlanId, Cell>;
};

export type Group = {
  id: string;
  title: string;
  rows: Row[];
};

const YES: Cell = { kind: 'check' };

const NO: Cell = { kind: 'dash' };

function valueOf(text: string): Cell {
  return { kind: 'value', text };
}

export const PLANS: Plan[] = [
  {
    id: 'solo',
    name: 'Solo',
    price: 0,
    priceNote: 'for one person',
    action: 'Start free',
    isFeatured: false,
  },
  {
    id: 'studio',
    name: 'Studio',
    price: 14,
    priceNote: 'per seat a month',
    action: 'Try Studio',
    isFeatured: true,
  },
  {
    id: 'agency',
    name: 'Agency',
    price: 28,
    priceNote: 'per seat a month',
    action: 'Contact sales',
    isFeatured: false,
  },
];

export const GROUPS: Group[] = [
  {
    id: 'planning',
    title: 'Planning',
    rows: [
      {
        id: 'projects',
        feature: 'Projects',
        cells: {
          solo: valueOf('3'),
          studio: valueOf('Unlimited'),
          agency: valueOf('Unlimited'),
        },
      },
      {
        id: 'views',
        feature: 'Boards, lists and timelines',
        cells: { solo: YES, studio: YES, agency: YES },
      },
      {
        id: 'recurring',
        feature: 'Recurring tasks',
        cells: { solo: NO, studio: YES, agency: YES },
      },
      {
        id: 'templates',
        feature: 'Project templates',
        cells: {
          solo: valueOf('5'),
          studio: valueOf('Unlimited'),
          agency: valueOf('Unlimited'),
        },
      },
    ],
  },
  {
    id: 'basics',
    title: 'Everyday basics',
    rows: [
      {
        id: 'mobile',
        feature: 'Apps for iPhone and Android',
        cells: { solo: YES, studio: YES, agency: YES },
      },
      {
        id: 'calendar',
        feature: 'Calendar sync',
        cells: { solo: YES, studio: YES, agency: YES },
      },
      {
        id: 'two-step',
        feature: 'Two-step sign-in',
        cells: { solo: YES, studio: YES, agency: YES },
      },
    ],
  },
  {
    id: 'together',
    title: 'Working together',
    rows: [
      {
        id: 'members',
        feature: 'Members',
        cells: {
          solo: valueOf('1'),
          studio: valueOf('Up to 50'),
          agency: valueOf('Unlimited'),
        },
      },
      {
        id: 'guests',
        feature: 'Client guests',
        cells: {
          solo: NO,
          studio: valueOf('5 per project'),
          agency: valueOf('Unlimited'),
        },
      },
      {
        id: 'comments',
        feature: 'Comments and mentions',
        cells: { solo: YES, studio: YES, agency: YES },
      },
      {
        id: 'approvals',
        feature: 'Approvals with a sign-off trail',
        cells: { solo: NO, studio: NO, agency: YES },
      },
    ],
  },
  {
    id: 'files',
    title: 'Files',
    rows: [
      {
        id: 'storage',
        feature: 'Storage',
        cells: {
          solo: valueOf('2 GB'),
          studio: valueOf('100 GB'),
          agency: valueOf('1 TB'),
        },
      },
      {
        id: 'versions',
        feature: 'Version history',
        cells: {
          solo: valueOf('7 days'),
          studio: valueOf('90 days'),
          agency: valueOf('Forever'),
        },
      },
    ],
  },
  {
    id: 'admin',
    title: 'Admin and support',
    rows: [
      {
        id: 'sso',
        feature: 'Single sign-on',
        cells: { solo: NO, studio: NO, agency: YES },
      },
      {
        id: 'audit',
        feature: 'Audit log',
        cells: { solo: NO, studio: NO, agency: YES },
      },
      {
        id: 'support',
        feature: 'Support',
        cells: {
          solo: valueOf('Help center'),
          studio: valueOf('Email'),
          agency: valueOf('A named contact'),
        },
      },
    ],
  },
];

export const SECTION = {
  title: 'Compare every plan of Larchwork',
  description:
    'Plan projects with your studio and the clients you work for. Turn on Only differences to keep the rows where the plans part ways.',
  footnote:
    'Illustrative prices in US dollars for an example app, taxes added at checkout',
};
