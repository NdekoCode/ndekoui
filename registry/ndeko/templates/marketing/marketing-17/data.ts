export const PILLARS_ANCHOR = 'pillars';

export const PROCESS_ANCHOR = 'process';

export const START_ANCHOR = 'start';

export type NavLink = {
  id: string;
  label: string;
  href: string;
};

export const NAV_LINKS: NavLink[] = [
  { id: 'pillars', label: 'Pillars', href: `#${PILLARS_ANCHOR}` },
  { id: 'process', label: 'How we work', href: `#${PROCESS_ANCHOR}` },
  { id: 'start', label: 'Contact', href: `#${START_ANCHOR}` },
];

export const BRAND = {
  name: 'Pinemarsh',
  copyright: '© 2026 Pinemarsh Studio',
};

export const HEADER = {
  action: 'Start a project',
  actionHref: `#${START_ANCHOR}`,
};

export const HERO = {
  eyebrow: 'Studio for partners',
  headline: 'Built with partners',
  description:
    'Pinemarsh is a studio of designers, engineers and writers. Every project starts with a partner in the room and ends with a team that can run it alone.',
  primaryAction: 'Start a project',
  secondaryAction: 'See the pillars',
  cells: [
    { label: 'Based in', value: 'Kinshasa and Lisbon' },
    { label: 'Teams of', value: 'Four to nine people' },
    { label: 'Projects run', value: 'One season at a time' },
    { label: 'We work in', value: 'French, English, Portuguese' },
  ],
};

export const SCROLL_LINE =
  'Strategy, brand, product, engineering, content and growth under one roof';

export type Pillar = {
  id: string;
  number: string;
  name: string;
  line: string;
  capabilities: string[];
};

export const PILLARS_SECTION = {
  title: 'Six pillars, one team',
  description:
    'Pick a side of the plate to see what the pillar covers. Each project draws on three or four of them.',
  groupLabel: 'Pillars of the studio',
};

export const PILLARS: Pillar[] = [
  {
    id: 'strategy',
    number: '01',
    name: 'Strategy',
    line: 'Where the work should go, and why',
    capabilities: ['Research with users', 'Positioning', 'Roadmaps'],
  },
  {
    id: 'brand',
    number: '02',
    name: 'Brand',
    line: 'A name and a voice people recognise',
    capabilities: ['Naming', 'Identity', 'Voice and tone'],
  },
  {
    id: 'product',
    number: '03',
    name: 'Product',
    line: 'Interfaces that hold up in daily use',
    capabilities: ['Prototypes', 'Design systems', 'Usability testing'],
  },
  {
    id: 'engineering',
    number: '04',
    name: 'Engineering',
    line: 'Software your own team can run',
    capabilities: ['Web applications', 'Mobile apps', 'Integrations'],
  },
  {
    id: 'content',
    number: '05',
    name: 'Content',
    line: 'Words, pictures and film with a point',
    capabilities: ['Editorial', 'Photography', 'Motion'],
  },
  {
    id: 'growth',
    number: '06',
    name: 'Growth',
    line: 'Launch, learn and adjust',
    capabilities: ['Launch plans', 'Analytics', 'Experiments'],
  },
];

export type ProcessStepId = 'listen' | 'build' | 'hand-over';

export type ProcessStep = {
  id: ProcessStepId;
  title: string;
  description: string;
};

export const PROCESS_SECTION = {
  title: 'Three steps, in the same room',
};

export const PROCESS_STEPS: ProcessStep[] = [
  {
    id: 'listen',
    title: 'Listen',
    description:
      'We spend the first weeks in your world: interviews, site visits and your numbers. The brief is written together, in your words.',
  },
  {
    id: 'build',
    title: 'Build together',
    description:
      'A partner joins every weekly demo. Decisions are made in the room, and your team learns the tools as we use them.',
  },
  {
    id: 'hand-over',
    title: 'Hand over',
    description:
      'We stay for the launch and the first quarter, then step back. You keep the code, the files and the habits.',
  },
];

export const CLOSING = {
  headline: 'Bring us the part that is hard to explain',
  description:
    'Tell us what you are building. A partner answers within two working days, in French, English or Portuguese.',
  primaryAction: 'Start a project',
  email: 'hello@pinemarsh.example',
};

export type FooterLink = {
  label: string;
  href: string;
};

export const FOOTER_LINKS: FooterLink[] = [
  { label: 'Pillars', href: `#${PILLARS_ANCHOR}` },
  { label: 'How we work', href: `#${PROCESS_ANCHOR}` },
  { label: 'Privacy', href: '#' },
  { label: 'Contact', href: `#${START_ANCHOR}` },
];
