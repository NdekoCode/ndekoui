import type { ComponentManifest } from '@/registry/ndeko/components/types';

export const manifest: ComponentManifest = [
  {
    name: 'agent-01',
    source: 'ndeko',
    title: 'Agent plan',
    description:
      'A plan that waits for Approve plan or an inline edit, then runs: each step checks itself off while the highlight glides to the next one, the agent slides in a step it adds and strikes the one it drops, and a toggle folds it into one line.',
  },
  {
    name: 'agent-02',
    source: 'ndeko',
    title: 'Agent lanes',
    description:
      'A lane per agent that fills from its start on a fixed window of time as one now line advances, with hand-offs curving from lane to lane and an approval waiting on its marker.',
  },
  {
    name: 'agent-03',
    source: 'ndeko',
    title: 'Agent graph',
    description:
      'Agents and the tools they call as a graph where an edge draws itself when one agent calls another and a dot travels along it for each call, in a tree, flow or hub layout.',
  },
  {
    name: 'agent-04',
    source: 'ndeko',
    title: 'Agent handoff',
    description:
      'A relay of agents where the task travels down the rail from one agent tile to the next with its note and context, lost items stay struck through and the next station can be dragged to another agent.',
  },
  {
    name: 'agent-05',
    source: 'ndeko',
    title: 'Agent tree',
    description:
      'Who started whom as a tree where a branch unfolds under an agent when it starts a sub-agent, with live clocks, subtree costs that roll, folds that sum what they hide, and Approve or Retry right in the row.',
  },
  {
    name: 'agent-06',
    source: 'ndeko',
    title: 'Agent fleet',
    description:
      'Every main agent at a glance under rolling totals, where the list switches between rows and cards with each agent gliding to its new place, with filters and sub-agents that unfold with Approve and Retry.',
  },
  {
    name: 'agent-07',
    source: 'ndeko',
    title: 'Agent monitor',
    description:
      'One agent at work: the step it is on with its clock, a cost figure that rolls each time a step ends and once more when the run does, a time strip that fills, the exact command waiting for Allow or Deny, and a fold into a slim bar.',
  },
  {
    name: 'agent-08',
    source: 'ndeko',
    title: 'Agent memory',
    description:
      'What an agent remembers, where a new memory folds into the list when the agent saves it, searchable by scope, with edits in place, pins that re-sort the list, forget with Undo, forget by source and why a memory was used.',
  },
  {
    name: 'agent-09',
    source: 'ndeko',
    title: 'Knowledge sources',
    description:
      'The sources an agent searches, where a source lights in the colour of the agent when its answer uses it, with indexing progress, a Re-sync that turns into a spinner then a check, and Retry on the one that failed.',
  },
  {
    name: 'agent-10',
    source: 'ndeko',
    title: 'Agent status',
    description:
      'A mark and a word per agent that change together: the dot of a running agent sends a ring out, and a hand, a cross or a check takes its place when the agent waits, fails or ends, above a legend of all five states.',
  },
  {
    name: 'agent-11',
    source: 'ndeko',
    title: 'Task checklist',
    description:
      'The to-do list of an agent under a header that counts 2 of 5 and carries the ring of the whole: the running step shows a ring that fills with its percentage rolling, and a done step is struck through by a line that draws from left to right.',
  },
];
