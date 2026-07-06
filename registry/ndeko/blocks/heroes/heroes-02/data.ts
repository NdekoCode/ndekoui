export type Person = {
  name: string;
};

export type BoardCard = {
  id: string;
  title: string;
  label: string;
  owner: Person;
};

export type Lane = {
  id: string;
  title: string;
  cards: BoardCard[];
};

const AMA: Person = { name: 'Ama Mensah' };
const JONAS: Person = { name: 'Jonas Berg' };
const LUCIA: Person = { name: 'Lucia Ferro' };
const DEV: Person = { name: 'Dev Raman' };

export const PEOPLE: Person[] = [AMA, JONAS, LUCIA, DEV];

export const LANES: Lane[] = [
  {
    id: 'todo',
    title: 'To do',
    cards: [
      {
        id: 'pricing-copy',
        title: 'Pricing page copy',
        label: 'Copy',
        owner: LUCIA,
      },
      {
        id: 'launch-photos',
        title: 'Book launch photos',
        label: 'Design',
        owner: JONAS,
      },
    ],
  },
  {
    id: 'doing',
    title: 'In progress',
    cards: [
      {
        id: 'onboarding',
        title: 'Onboarding checklist',
        label: 'Product',
        owner: DEV,
      },
    ],
  },
  {
    id: 'done',
    title: 'Done',
    cards: [
      {
        id: 'beta-notes',
        title: 'Beta feedback notes',
        label: 'Research',
        owner: AMA,
      },
    ],
  },
];

export const MOVING_CARD: BoardCard = {
  id: 'launch-email',
  title: 'Write the launch email',
  label: 'Copy',
  owner: AMA,
};

export const BOARD = {
  title: 'Launch plan',
  week: 'Week 46',
};

export const RULE = {
  trigger: 'When a card reaches Done',
  waiting: 'Waiting for the next card',
  done: 'Posted in #launch',
};

export const HERO = {
  eyebrow: 'Boards, timelines and reports',
  title: 'Plan the week on one board, with every card, date and owner',
  description:
    'Lanes, timelines and reports read the same cards, so Monday planning fits in one meeting instead of three threads.',
  primaryAction: 'Start planning',
  secondaryAction: 'Browse templates',
};
