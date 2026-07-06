export type Gaze = {
  /** From -1 (far left) to 1 (far right). */
  x: number;
  /** From -1 (up) to 1 (down). */
  y: number;
};

export type PhraseView = {
  index: number;
  typed: string;
};

export const HERO = {
  titleStart: "Hi, I'm Ida. I make",
  description:
    'Pip is my assistant. Ask it about my work, my rates, or when I am free to start something with you.',
  primaryAction: 'Ask Pip',
  secondaryAction: 'See the work',
  agentName: 'Pip',
  agentRole: 'My assistant',
};

export const PHRASES = [
  'short films about rivers',
  'zines for night owls',
  'small tools for writers',
  'podcasts about maps',
];

export const INITIAL_VIEW: PhraseView = { index: 0, typed: PHRASES[0] };

export const GLANCES: Gaze[] = [
  { x: 1, y: -0.3 },
  { x: 0.7, y: 0.9 },
  { x: 0, y: 0 },
  { x: -0.8, y: 0.2 },
  { x: 0.2, y: -0.9 },
  { x: 0, y: 0 },
];
