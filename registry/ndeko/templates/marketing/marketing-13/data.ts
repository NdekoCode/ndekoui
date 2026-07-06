export const STUDIO_ANCHOR = 'studio';

export const NOTES_ANCHOR = 'notes';

export const TRIAGE_ANCHOR = 'triage';

export const SEED_ANCHOR = 'seed';

export const PRICING_ANCHOR = 'pricing';

export const QUESTIONS_ANCHOR = 'questions';

export type NavLink = {
  id: string;
  label: string;
  href: string;
};

export const NAV_LINKS: NavLink[] = [
  { id: 'notes', label: 'Notes', href: `#${NOTES_ANCHOR}` },
  { id: 'triage', label: 'Triage', href: `#${TRIAGE_ANCHOR}` },
  { id: 'seed', label: 'Seeds and light', href: `#${SEED_ANCHOR}` },
  { id: 'pricing', label: 'Pricing', href: `#${PRICING_ANCHOR}` },
  { id: 'questions', label: 'Questions', href: `#${QUESTIONS_ANCHOR}` },
];

export const BRAND = {
  name: 'Aperline',
  copyright: '© 2026 Aperline',
};

export const HEADER = {
  action: 'Open the studio',
  actionHref: `#${PRICING_ANCHOR}`,
};

export const HERO = {
  eyebrow: 'AI photo studio',
  title: 'Describe the shot, then choose between four takes',
  description:
    'Aperline turns a written brief into still-life and product takes. Pin notes on what to change, sort what to keep and lock the seed when a take is right.',
  primaryAction: 'Open the studio',
  secondaryAction: 'See how takes are sorted',
};

export const BRIEF =
  'A ceramic mug on a linen table, soft light from the left window';

export const MAKE_LABEL = 'Make four takes';

export type SceneLook = {
  wall: string;
  table: string;
  mug: string;
  coffee: string;
  patch: string;
  patchOpacity: number;
  patchX: number;
  shadow: string;
  shadowX: number;
  shadowStretch: number;
  shadowOpacity: number;
  mugX: number;
  mugScale: number;
};

const CARD = 'var(--card)';

function mixOf(token: string, share: number) {
  return `color-mix(in oklab, ${token} ${share}%, ${CARD})`;
}

const TABLE_TONE = mixOf('var(--foreground)', 9);

const SHADOW_TONE = mixOf('var(--foreground)', 55);

export const HERO_LOOKS: SceneLook[] = [
  {
    wall: mixOf('var(--warning)', 14),
    table: TABLE_TONE,
    mug: mixOf('var(--primary)', 78),
    coffee: mixOf('var(--foreground)', 40),
    patch: mixOf('var(--warning)', 45),
    patchOpacity: 0.8,
    patchX: 0,
    shadow: SHADOW_TONE,
    shadowX: 6,
    shadowStretch: 1.1,
    shadowOpacity: 0.18,
    mugX: 0,
    mugScale: 1,
  },
  {
    wall: mixOf('var(--info)', 10),
    table: TABLE_TONE,
    mug: mixOf('var(--series-2)', 80),
    coffee: mixOf('var(--foreground)', 40),
    patch: mixOf('var(--info)', 30),
    patchOpacity: 0.35,
    patchX: 0,
    shadow: SHADOW_TONE,
    shadowX: 2,
    shadowStretch: 1,
    shadowOpacity: 0.1,
    mugX: -26,
    mugScale: 0.9,
  },
  {
    wall: mixOf('var(--primary)', 10),
    table: TABLE_TONE,
    mug: mixOf('var(--series-3)', 78),
    coffee: mixOf('var(--foreground)', 40),
    patch: mixOf('var(--primary)', 30),
    patchOpacity: 0.5,
    patchX: -10,
    shadow: SHADOW_TONE,
    shadowX: 9,
    shadowStretch: 1.3,
    shadowOpacity: 0.2,
    mugX: 6,
    mugScale: 1.35,
  },
  {
    wall: mixOf('var(--warning)', 28),
    table: mixOf('var(--warning)', 12),
    mug: mixOf('var(--series-4)', 78),
    coffee: mixOf('var(--foreground)', 40),
    patch: mixOf('var(--warning)', 55),
    patchOpacity: 0.9,
    patchX: -8,
    shadow: SHADOW_TONE,
    shadowX: -14,
    shadowStretch: 1.7,
    shadowOpacity: 0.22,
    mugX: 24,
    mugScale: 0.95,
  },
];

export type Take = {
  id: string;
  seed: number;
};

export const HERO_TAKES: Take[] = [
  { id: 'take-1', seed: 48213 },
  { id: 'take-2', seed: 90417 },
  { id: 'take-3', seed: 15882 },
  { id: 'take-4', seed: 70361 },
];

export const FIGURES_SECTION = {
  note: 'Illustrative figures for a typical session',
};

export type Figure = {
  id: string;
  value: number;
  suffix: string;
  label: string;
};

export const FIGURES: Figure[] = [
  { id: 'takes', value: 12, suffix: '', label: 'takes in a session' },
  { id: 'first', value: 4, suffix: ' s', label: 'to the first take' },
  { id: 'kept', value: 63, suffix: '%', label: 'of takes kept after sorting' },
];

export const NOTES_SECTION = {
  title: 'Pin a note where the change belongs',
  description:
    'Point at the part of a take you want different. Each note keeps its place on the picture and ticks off when the next take fixes it.',
};

export type Note = {
  id: string;
  text: string;
  x: number;
  y: number;
};

export const NOTES: Note[] = [
  { id: 'light', text: 'Warm the light on the left edge', x: 20, y: 30 },
  { id: 'handle', text: 'Keep the handle, soften its shadow', x: 68, y: 66 },
  { id: 'crop', text: 'Crop tighter on the cup', x: 46, y: 78 },
];

export const NOTES_TAKE = {
  title: 'Take 2, ceramic mug',
  seed: '90417',
};

export type Lane = 'keep' | 'maybe' | 'drop';

export type SubjectId =
  'mug' | 'bottles' | 'plant' | 'hills' | 'window' | 'bowl';

export type TriageTake = {
  id: SubjectId;
  title: string;
  seed: number;
};

export const TRIAGE_SECTION = {
  title: 'Sort the takes in one pass',
  description:
    'Keep, Maybe or Drop, one take at a time. Press K, M or D, or press the buttons under a take.',
};

export const TRIAGE_TAKES: TriageTake[] = [
  { id: 'mug', title: 'Mug on linen', seed: 48213 },
  { id: 'bottles', title: 'Bottles on a shelf', seed: 90417 },
  { id: 'plant', title: 'Plant by the wall', seed: 15882 },
  { id: 'hills', title: 'Hills at dusk', seed: 70361 },
  { id: 'window', title: 'Chair by the window', seed: 33094 },
  { id: 'bowl', title: 'Fruit bowl', seed: 58726 },
];

export const LANES: { id: Lane; label: string }[] = [
  { id: 'keep', label: 'Keep' },
  { id: 'maybe', label: 'Maybe' },
  { id: 'drop', label: 'Drop' },
];

export type LightId = 'window' | 'overcast' | 'golden' | 'flash' | 'side';

export type Light = {
  id: LightId;
  label: string;
  look: Pick<
    SceneLook,
    | 'wall'
    | 'table'
    | 'patch'
    | 'patchOpacity'
    | 'patchX'
    | 'shadowX'
    | 'shadowStretch'
    | 'shadowOpacity'
  >;
};

export const DEFAULT_LIGHT: LightId = 'window';

export const LIGHTS: Light[] = [
  {
    id: 'window',
    label: 'Window',
    look: {
      wall: mixOf('var(--warning)', 14),
      table: TABLE_TONE,
      patch: mixOf('var(--warning)', 45),
      patchOpacity: 0.8,
      patchX: 0,
      shadowX: 6,
      shadowStretch: 1.1,
      shadowOpacity: 0.18,
    },
  },
  {
    id: 'overcast',
    label: 'Overcast',
    look: {
      wall: mixOf('var(--info)', 9),
      table: TABLE_TONE,
      patch: mixOf('var(--info)', 30),
      patchOpacity: 0.12,
      patchX: 0,
      shadowX: 0,
      shadowStretch: 1,
      shadowOpacity: 0.08,
    },
  },
  {
    id: 'golden',
    label: 'Golden hour',
    look: {
      wall: mixOf('var(--warning)', 30),
      table: mixOf('var(--warning)', 12),
      patch: mixOf('var(--warning)', 55),
      patchOpacity: 0.9,
      patchX: -8,
      shadowX: -14,
      shadowStretch: 1.7,
      shadowOpacity: 0.22,
    },
  },
  {
    id: 'flash',
    label: 'Studio flash',
    look: {
      wall: mixOf('var(--foreground)', 5),
      table: mixOf('var(--foreground)', 7),
      patch: mixOf('var(--foreground)', 5),
      patchOpacity: 0,
      patchX: 0,
      shadowX: 3,
      shadowStretch: 0.9,
      shadowOpacity: 0.3,
    },
  },
  {
    id: 'side',
    label: 'Side light',
    look: {
      wall: mixOf('var(--primary)', 10),
      table: TABLE_TONE,
      patch: mixOf('var(--primary)', 40),
      patchOpacity: 0.7,
      patchX: -70,
      shadowX: 12,
      shadowStretch: 1.4,
      shadowOpacity: 0.2,
    },
  },
];

export const SEED_SECTION = {
  title: 'Change the light, keep the take',
  description:
    'Lock the seed and only the light changes. Unlocked, every change of light starts a new take. The call under the picture reproduces whatever you see.',
  brief: 'Ceramic mug on a linen table',
};

export const SEED_SEQUENCE = [48213, 90417, 15882, 70361, 33094, 58726];

export const SEED_LOOKS = [
  { mugX: 0, mugScale: 1 },
  { mugX: -22, mugScale: 0.92 },
  { mugX: 18, mugScale: 1.18 },
];

export type Review = {
  id: string;
  quote: string;
  name: string;
  role: string;
  company: string;
};

export const REVIEWS_SECTION = {
  title: 'What photographers say',
  description:
    'Sample reviews written for this template, not from real customers.',
};

export const REVIEWS: Review[] = [
  {
    id: 'naomi',
    quote:
      'I describe the shot in two lines and have a take I can brief a retoucher on before the kettle boils.',
    name: 'Naomi Lutumba',
    role: 'Product photographer, Kinshasa',
    company: 'Lutumba Product Studio',
  },
  {
    id: 'daniel',
    quote:
      'Notes pinned on the picture ended the long email threads with my client.',
    name: 'Daniel Okafor',
    role: 'Art director, Lagos',
    company: 'Okafor and Bell',
  },
  {
    id: 'camille',
    quote:
      'Locking the seed is the feature I use most. I change the light and the mug stays where it was.',
    name: 'Camille Ndala',
    role: 'E-commerce lead, Lubumbashi',
    company: 'Ndala Home Goods',
  },
];

export const OFFER = {
  name: 'Studio',
  price: '$24',
  period: 'a month',
  note: 'Illustrative price in US dollars',
  description:
    'One plan for one person or a small team. Everything on this page is included.',
  action: 'Start the studio',
  after: 'Cancel any time from the settings page',
  facts: [
    { label: 'Takes', value: '120 a month' },
    { label: 'Seeds', value: 'Kept for 90 days' },
    { label: 'Notes and sorting', value: 'No limit' },
    { label: 'Licence', value: 'Commercial use' },
  ],
};

export type Question = {
  id: string;
  question: string;
  answer: string;
};

export const QUESTIONS_SECTION = {
  title: 'Questions about Aperline',
  description: 'What people ask before their first brief',
};

export const QUESTIONS: Question[] = [
  {
    id: 'photographs',
    question: 'Are the takes photographs?',
    answer:
      'No. Takes are generated pictures made from your brief. None of them is a photograph of a real person or place.',
  },
  {
    id: 'seed',
    question: 'What does a seed do?',
    answer:
      'A seed fixes the starting point of a take. With the same brief, light and seed you get the same take again.',
  },
  {
    id: 'licence',
    question: 'Can I use takes commercially?',
    answer:
      'Yes, on the Studio plan. Each take keeps its brief and seed, so you can show how it was made.',
  },
  {
    id: 'dropped',
    question: 'What happens to the takes I drop?',
    answer:
      'They stay in the Drop lane for 30 days, then they are deleted. Kept and Maybe takes stay until you remove them.',
  },
  {
    id: 'team',
    question: 'Can my team review takes with me?',
    answer:
      'Anyone you invite can pin notes and sort takes. Each decision shows who made it.',
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
