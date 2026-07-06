export const SECTION = {
  label: 'What a run looks like',
  title: 'Five parts of one agent run, working',
  lead: 'Each tile is the control itself, following the same run: the prompt, the plan, the decision, the context and the cost.',
  figures: 'Illustrative figures',
};

export const PROMPT_TEXT = 'Reconcile March invoices against the bank export';

export const PROMPT = {
  label: 'Ask Ledgerfinch',
  placeholder: 'Describe the job in plain words',
};

export const PLAN_STEPS: string[] = [
  'Read the bank export',
  'Match invoices to payments',
  'Flag what does not match',
  'Post the matches to the ledger',
];

export const APPROVAL = {
  title: 'Post 38 matches to the ledger',
  detail: 'Writes to the March ledger. Nothing is posted until you answer.',
};

export const CONTEXT_LIMIT_TOKENS = 32_000;

export const BUDGET_USD = 0.25;

export type TileCopy = {
  title: string;
  text: string;
};

export const TILES = {
  prompt: {
    title: 'Ask in plain words',
    text: 'The tray under the prompt says what the agent is reading before it plans.',
  },
  plan: {
    title: 'See the plan tick',
    text: 'Each step marks itself done, so you know where the run is without opening a log.',
  },
  approval: {
    title: 'Decide before it writes',
    text: 'Anything that changes your books waits for an answer first.',
  },
  context: {
    title: 'Watch the context fill',
    text: 'The ring shows how much the agent holds, so a long run holds no surprise.',
  },
  cost: {
    title: 'Follow the cost',
    text: 'The figure rolls with every call and stays under the budget you set.',
  },
} satisfies Record<string, TileCopy>;
