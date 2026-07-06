import type { SessionStep } from '@/registry/ndeko/hooks/use-session';

export type OutputTone = 'plain' | 'muted' | 'success';

export type OutputLine = {
  text: string;
  tone: OutputTone;
};

export type Entry = {
  id: number;
  command: string;
  output: OutputLine[];
};

export type TerminalState = {
  entries: Entry[];
  typed: string;
};

export type TerminalAction =
  { type: 'edit'; text: string } | { type: 'run' } | { type: 'wait' };

type Step = SessionStep<TerminalState, TerminalAction>;

function plain(text: string): OutputLine {
  return { text, tone: 'plain' };
}

function muted(text: string): OutputLine {
  return { text, tone: 'muted' };
}

function passed(text: string): OutputLine {
  return { text, tone: 'success' };
}

export const DEMO_COMMANDS = [
  'git log --oneline -3',
  'pnpm test --filter sync',
  'pnpm ship',
];

const COMMANDS: ReadonlyMap<string, OutputLine[]> = new Map([
  [
    'git log --oneline -3',
    [
      muted('a41f9c2 sync: resume uploads after a dropped connection'),
      muted('7be03d1 queue: keep writes while offline'),
      muted('c09e5a8 ui: show what is waiting to sync'),
    ],
  ],
  [
    'pnpm test --filter sync',
    [
      passed('pass  resumes an upload after the network drops'),
      passed('pass  keeps writes in order while offline'),
      plain('2 passed in 1.4 s'),
    ],
  ],
  [
    'pnpm ship',
    [
      muted('Built the Android app'),
      muted('Sent it to 38 test phones in Kinshasa'),
      passed('Done'),
    ],
  ],
  [
    'help',
    [
      plain('about      who I am'),
      plain('projects   what I have built'),
      plain('stack      what I build with'),
      plain('contact    how to reach me'),
      plain('clear      empty the screen'),
    ],
  ],
  [
    'about',
    [
      plain('Patience Mbuyi, software developer in Kinshasa.'),
      plain('I build apps that keep working when the network does not.'),
    ],
  ],
  [
    'projects',
    [
      plain('Field Sync, Stockline, Clinic Queue,'),
      plain('Route Notes, Plain Ledger, Bridge Desk'),
    ],
  ],
  ['stack', [plain('TypeScript, React Native, Postgres, SQLite')]],
  ['contact', [plain('hello@pmbuyi.example')]],
  ['whoami', [plain('pmbuyi')]],
]);

const MAX_ENTRIES = 5;

function outputOf(command: string): OutputLine[] {
  const known = COMMANDS.get(command);
  if (known) {
    return known;
  }
  return [
    muted(`command not found: ${command}`),
    muted('Type help to see the commands'),
  ];
}

function ran(state: TerminalState): TerminalState {
  const command = state.typed.trim();
  if (command === '') {
    return state;
  }
  if (command === 'clear') {
    return { entries: [], typed: '' };
  }
  const lastId = state.entries.at(-1)?.id ?? 0;
  const entry: Entry = { id: lastId + 1, command, output: outputOf(command) };
  const entries = [...state.entries, entry].slice(-MAX_ENTRIES);
  return { entries, typed: '' };
}

export function reducer(
  state: TerminalState,
  action: TerminalAction
): TerminalState {
  switch (action.type) {
    case 'edit':
      return { ...state, typed: action.text };
    case 'run':
      return ran(state);
    case 'wait':
      return state;
  }
}

export const INITIAL: TerminalState = { entries: [], typed: '' };

const FIRST_KEY_MS = 1100;

const NEXT_COMMAND_MS = 800;

const KEY_MS = 55;

const KEYS_PER_STEP = 2;

const RUN_AFTER_MS = 420;

const HOLD_MS = 3600;

function commandSteps(command: string, startAfter: number): Step[] {
  const steps: Step[] = [];
  const last = command.length + KEYS_PER_STEP;
  for (let end = KEYS_PER_STEP; end < last; end += KEYS_PER_STEP) {
    let after = KEY_MS;
    if (steps.length === 0) {
      after = startAfter;
    }
    const text = command.slice(0, end);
    steps.push({ after, by: 'demo', action: { type: 'edit', text } });
  }
  steps.push({ after: RUN_AFTER_MS, by: 'demo', action: { type: 'run' } });
  return steps;
}

function demoSteps(): Step[] {
  const steps: Step[] = [];
  DEMO_COMMANDS.forEach((command, index) => {
    let startAfter = NEXT_COMMAND_MS;
    if (index === 0) {
      startAfter = FIRST_KEY_MS;
    }
    steps.push(...commandSteps(command, startAfter));
  });
  return steps;
}

export const SCRIPT: Step[] = [
  ...demoSteps(),
  { after: HOLD_MS, action: { type: 'wait' } },
];

function restingState(): TerminalState {
  let state = INITIAL;
  for (const command of DEMO_COMMANDS) {
    state = ran({ ...state, typed: command });
  }
  return state;
}

export const RESTING = restingState();

export const LOOP_AFTER_MS = 1400;
