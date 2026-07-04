import type { ComponentManifest } from '@/registry/ndeko/components/types';

export const manifest: ComponentManifest = [
  {
    name: 'run-01',
    source: 'ndeko',
    title: 'Tool calls',
    description:
      "A turn's tool calls under one line that sums them up, each call folding open for its arguments and result, a failed one retried in place.",
  },
  {
    name: 'run-03',
    source: 'ndeko',
    title: 'Run in sentences',
    description:
      'One bar of where the time went and a sentence per step on its own track, where a step waiting on you lifts out with Approve.',
  },
  {
    name: 'run-02',
    source: 'ndeko',
    title: 'Trace waterfall',
    description:
      'Every call of a run on one live time axis, nested by agent, with filters, search, a drag to zoom and the critical path.',
  },
  {
    name: 'run-05',
    source: 'ndeko',
    title: 'Context window bar',
    description:
      'How full a model context is, its parts on one bar that resizes with a spring, with removable files and Compact near the limit.',
  },
  {
    name: 'run-06',
    source: 'ndeko',
    title: 'Context cells',
    description:
      'The context as a field of cells, one per thousand tokens, filling in order as turns arrive and lighting up by part.',
  },
  {
    name: 'run-04',
    source: 'ndeko',
    title: 'Agent terminal',
    description:
      "An agent's shell where output streams in and folds when long, a risky command waits for Run or Skip, and any command runs again.",
  },
  {
    name: 'run-07',
    source: 'ndeko',
    title: 'Context ring',
    description:
      'A ring for a composer corner that fills as messages are sent, turns to warning above 85% and opens the breakdown.',
  },
  {
    name: 'run-08',
    source: 'ndeko',
    title: 'Context treemap',
    description:
      'What fills a context as a treemap whose tiles glide as sizes change, the old turns folding into one summary tile.',
  },
  {
    name: 'run-09',
    source: 'ndeko',
    title: 'Usage by model',
    description:
      'Spend against a plan stacked by model or by agent, with rolling figures, a limit tick that travels, daily bars and a notice above 80%.',
  },
  {
    name: 'run-10',
    source: 'ndeko',
    title: 'Agent health',
    description:
      "One agent's health: a gauge, five signals whose lines morph between periods, a summary written word by word and one action to apply.",
  },
];
