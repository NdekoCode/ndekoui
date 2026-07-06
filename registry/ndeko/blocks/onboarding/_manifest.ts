import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'onboarding-01',
    title: 'Onboarding checklist',
    description:
      'First-run steps on a card for a corner of the dashboard: pressing the action of the current step draws its check, the ring fills and the next step unlocks and opens, Snooze folds the card into a pill that keeps the count, and the last step turns it into a short message that fades on its own.',
    files: [
      'index.tsx',
      'checklist-card.tsx',
      'progress-ring.tsx',
      'calm-check.tsx',
      'session.ts',
      'data.ts',
    ],
    previewHeight: 720,
  },
  {
    name: 'onboarding-02',
    title: 'Setup wizard',
    description:
      'Four steps on the stepper, each checked before it lets go: a refused entry says why and takes the focus, optional steps can be skipped, the card resizes from one step to the next, the review jumps back to any step with Edit, and Create workspace turns into Creating then into the workspace that now exists.',
    files: [
      'index.tsx',
      'wizard-steps.tsx',
      'review-step.tsx',
      'calm-check.tsx',
      'validate.ts',
      'session.ts',
      'data.ts',
    ],
    previewHeight: 660,
  },
  {
    name: 'onboarding-03',
    title: 'New workspace with a first agent',
    description:
      'A new workspace in four steps on one card: tools go from Connect to Connecting to Connected, addresses become chips, the agent gets a name, a model and a job, and each finished step folds into one line under a check that draws itself, until the first run ticks through its plan and two tool calls and its result lands.',
    files: [
      'index.tsx',
      'phase-row.tsx',
      'phase-forms.tsx',
      'first-run.tsx',
      'use-run-clock.ts',
      'run.ts',
      'invites.ts',
      'session.ts',
      'data.ts',
    ],
    previewHeight: 840,
  },
];
