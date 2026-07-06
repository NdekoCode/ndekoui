/** An invented workspace on its first day. */
export const WORKSPACE = { name: 'Solway Books' };

export type StepId = 'workspace' | 'invite' | 'source' | 'agent' | 'run';

export type SetupStep = {
  id: StepId;
  title: string;
  detail: string;
  /** What the button of the step says. A step that is done from the start has none. */
  action?: string;
  /** A short how-to, for the steps that need one. */
  howTo?: string[];
};

export const STEPS: SetupStep[] = [
  {
    id: 'workspace',
    title: 'Create your workspace',
    detail: 'Solway Books was created when you signed up',
  },
  {
    id: 'invite',
    title: 'Invite a teammate',
    detail: 'Agents are easier to trust when someone else reads their work',
    action: 'Invite teammates',
    howTo: [
      'Open Members from the sidebar',
      'Add an address and pick a role',
      'They join from the link in their email',
    ],
  },
  {
    id: 'source',
    title: 'Connect a data source',
    detail: 'An agent reads from the tools you connect. One is enough to start',
    action: 'Connect a source',
    howTo: [
      'Pick a tool under Integrations',
      'Sign in to it and choose what to share',
      'The first sync runs in the background',
    ],
  },
  {
    id: 'agent',
    title: 'Create your first agent',
    detail: 'Give it a name and one job, said in a sentence',
    action: 'Create an agent',
  },
  {
    id: 'run',
    title: 'Run it once',
    detail: 'Watch the first run and approve what it asks for',
    action: 'Start a run',
    howTo: [
      'Open the agent and press Run',
      'Approve or deny each request it makes',
      'Read the result, then let it run on its own',
    ],
  },
];

/** The steps that are behind a person who has just signed up. */
export const DONE_AT_FIRST: StepId[] = ['workspace'];

const FALLBACK_STEP = STEPS[0];

export function stepOf(id: StepId) {
  const step = STEPS.find((candidate) => candidate.id === id);
  return step ?? FALLBACK_STEP;
}
