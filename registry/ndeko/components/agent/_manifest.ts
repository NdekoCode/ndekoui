import type { ComponentManifest } from '@/registry/ndeko/components/types';

export const manifest: ComponentManifest = [
  {
    name: 'agent-01',
    source: 'ndeko',
    title: 'Agent plan',
    description:
      'A plan that waits for Approve plan or an inline edit, then checks its steps off live, slides in the step the agent adds, strikes the one it drops and folds into one line.',
  },
  {
    name: 'agent-02',
    source: 'ndeko',
    title: 'Agent lanes',
    description:
      'A lane per agent where tasks grow into a now line while time drifts left, hand-offs curve from lane to lane and an approval waits on its marker.',
  },
  {
    name: 'agent-03',
    source: 'ndeko',
    title: 'Agent graph',
    description:
      'Agents and the tools they call as a live graph whose nodes glide between tree, flow and hub layouts, with a streak of light along the edge of each call.',
  },
  {
    name: 'agent-04',
    source: 'ndeko',
    title: 'Agent handoff',
    description:
      'A relay of agents where each hand-off sends a light down the rail with its note and context, lost items stay struck through and the next station can be dragged to another agent.',
  },
  {
    name: 'agent-05',
    source: 'ndeko',
    title: 'Agent tree',
    description:
      'Who started whom as a tree with live clocks and subtree costs that roll, folds that sum what they hide, and Approve or Retry right in the row.',
  },
  {
    name: 'agent-06',
    source: 'ndeko',
    title: 'Agent fleet',
    description:
      'Every main agent at a glance under rolling totals, with filters, a Rows and Cards switch that re-flows the list, and sub-agents that unfold with Approve and Retry.',
  },
  {
    name: 'agent-07',
    source: 'ndeko',
    title: 'Agent monitor',
    description:
      'One agent at work: its current step with a clock and cost, a time strip that grows, the exact command waiting for Allow or Deny, and a fold into a slim bar.',
  },
  {
    name: 'agent-08',
    source: 'ndeko',
    title: 'Agent memory',
    description:
      'What an agent remembers, searchable by scope, with edits in place, pins that re-sort the list, forget with Undo, forget by source and why a memory was used.',
  },
  {
    name: 'agent-09',
    source: 'ndeko',
    title: 'Knowledge sources',
    description:
      'The sources an agent searches, with indexing progress and chunk counts that roll, a Re-sync that turns into a spinner then a check, and Retry on the one that failed.',
  },
  {
    name: 'agent-10',
    source: 'ndeko',
    title: 'Agent status',
    description:
      'A dot and a word per agent where running breathes, waiting blinks slowly and the word rolls on every change, above a legend of all five states.',
  },
];
