import { BASE_UI, primitive, type RegistryItemDefinition } from './item-kit';

const AI = ['primitives', 'ai'];

export const aiFoundationItems: RegistryItemDefinition[] = [
  {
    name: 'motion-presets',
    type: 'registry:lib',
    title: 'Motion presets',
    description:
      'The easings, springs and presence presets the AI pieces share, each with its reduced-motion fallback.',
    files: [
      { path: 'registry/ndeko/lib/motion-presets.ts', type: 'registry:lib' },
    ],
    dependencies: ['motion'],
    categories: ['foundations'],
  },
  {
    name: 'hatch',
    type: 'registry:lib',
    title: 'Hatch',
    description:
      'A diagonal hatch in any colour, for reserved space and failed bars.',
    files: [{ path: 'registry/ndeko/lib/hatch.ts', type: 'registry:lib' }],
    categories: ['foundations'],
  },
];

export const aiItems: RegistryItemDefinition[] = [
  primitive(
    'copy-button',
    'Copy Button',
    'Copies a text and turns into a check for a moment.',
    {
      dependencies: ['motion'],
      registryDependencies: ['icons', 'button', 'chat-motion', 'use-timeouts'],
      categories: AI,
    }
  ),
  primitive(
    'morph-button',
    'Morph Button',
    'A button whose label morphs from the action to its work and to its result.',
    {
      dependencies: ['motion'],
      registryDependencies: ['icons', 'button', 'animated-size'],
      categories: AI,
    }
  ),
  primitive(
    'live-region',
    'Live Region',
    'A polite, visually hidden line that tells screen readers what just changed.',
    { categories: AI }
  ),
  primitive(
    'live-duration',
    'Live Duration',
    'A duration that ticks while its work runs and freezes when it ends, re-rendering only itself.',
    {
      registryDependencies: ['agent-run', 'use-agent-run'],
      categories: AI,
    }
  ),
  primitive(
    'segments',
    'Segments',
    'A segmented switch whose thumb travels to the picked option.',
    {
      dependencies: [BASE_UI],
      registryDependencies: ['toggle-group'],
      categories: AI,
    }
  ),
  primitive(
    'json-view',
    'JSON View',
    'Arguments and results shown as small highlighted JSON.',
    { categories: AI }
  ),
  primitive(
    'call-status',
    'Call Status',
    'The mark of a tool call (queued, running, waiting, done, failed) that swaps when the state changes.',
    {
      dependencies: ['motion'],
      registryDependencies: ['agent-run', 'icons', 'chat-motion'],
      categories: AI,
    }
  ),
  primitive(
    'replay-button',
    'Replay Button',
    'A Replay button that rises in once a demo run has ended.',
    {
      dependencies: ['motion'],
      registryDependencies: ['icons', 'button', 'motion-presets'],
      categories: AI,
    }
  ),
];
