import type { ComponentManifest } from '@/registry/ndeko/components/types';

export const manifest: ComponentManifest = [
  {
    name: 'run-01',
    source: 'ndeko',
    title: 'Tool calls',
    description:
      "A turn's tool calls under one line that sums them up, each call folding open for its arguments and result: a result line slides in under a call as its mark turns into a check, and a failed call is retried in place.",
  },
  {
    name: 'run-03',
    source: 'ndeko',
    title: 'Run in sentences',
    description:
      'One bar of where the time went and a sentence per step on its own track: the sentence rewrites itself word by word when a step ends, and a step waiting on you lifts out with Approve.',
  },
  {
    name: 'run-02',
    source: 'ndeko',
    title: 'Trace waterfall',
    description:
      'Every call of a run on one time axis, nested by agent, where the bars grow behind a playhead that travels, with filters, search, a drag to zoom and the critical path.',
  },
  {
    name: 'run-05',
    source: 'ndeko',
    title: 'Context window bar',
    description:
      'How full a model context is, its parts on one bar with removable files: near the limit, Compact spreads a summary over the old turns and the bar folds.',
  },
  {
    name: 'run-06',
    source: 'ndeko',
    title: 'Context cells',
    description:
      'The context as a field of cells, one per thousand tokens, filling in order as turns arrive and lighting up part by part.',
  },
  {
    name: 'run-04',
    source: 'ndeko',
    title: 'Agent terminal',
    description:
      "An agent's shell where output streams in and folds when long: a risky command waits, then runs when it is approved, and any command runs again.",
  },
  {
    name: 'run-07',
    source: 'ndeko',
    title: 'Context ring',
    description:
      'A ring for a composer corner that closes toward the limit as messages are sent, turns to warning above 85% and opens the breakdown.',
  },
  {
    name: 'run-08',
    source: 'ndeko',
    title: 'Context treemap',
    description:
      'What fills a context as a treemap whose tiles regroup as sizes change, the old turns flying into one summary tile.',
  },
  {
    name: 'run-09',
    source: 'ndeko',
    title: 'Usage by model',
    description:
      'Spend against a plan stacked by model or by agent: the bar of the month fills to its limit with rolling figures, a limit tick that travels, daily bars and a notice above 80%.',
  },
  {
    name: 'run-10',
    source: 'ndeko',
    title: 'Agent health',
    description:
      "One agent's health: a gauge and five signals whose marks change in a wave between periods, a summary written a few words at a time and one action to apply.",
  },
  {
    name: 'run-11',
    source: 'ndeko',
    title: 'Error and retry',
    description:
      'A failed step in plain words, with a ring that empties toward the next automatic retry, Retry now and Stop retrying, the raw error behind a fold with Copy, and a card that folds into one line once a try goes through.',
  },
  {
    name: 'run-12',
    source: 'ndeko',
    title: 'Cost tracker',
    description:
      'Tokens in and out, the cache share and the cost as plain ticking figures while a step streams, whose totals roll once as each step lands, above a per-step table with the model of each step and a small bar.',
  },
];
