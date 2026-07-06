import {
  BlocksIcon,
  BookOpenIcon,
  RocketIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';

import type { PageId } from './pages';

export type Manager = 'pnpm' | 'npm' | 'yarn' | 'bun';

export type InstallTab = 'cli' | 'manual';

export const PRODUCT = {
  name: 'Wickerline',
  version: 'v2',
  title: 'Wickerline documentation',
  lead: 'Record what your agents do, and hold the risky steps for a person.',
};

export const SAMPLE_NOTE =
  'Wickerline is an example product. Its pages, keys and addresses are samples.';

export type Category = {
  id: string;
  title: string;
  text: string;
  icon: Icon;
  pageId: PageId;
};

export const CATEGORIES: Category[] = [
  {
    id: 'start',
    title: 'Get started',
    text: 'Install the SDK, add your project key and record a first run.',
    icon: RocketIcon,
    pageId: 'installation',
  },
  {
    id: 'build',
    title: 'Build',
    text: 'Hold a step for a person and answer from your own app.',
    icon: BlocksIcon,
    pageId: 'approvals',
  },
  {
    id: 'reference',
    title: 'Reference',
    text: 'Every event a run sends, with its fields and its retries.',
    icon: BookOpenIcon,
    pageId: 'events',
  },
];

export const SUGGESTIONS = ['install', 'approval', 'retries'];

export const MANAGERS: { value: Manager; label: string }[] = [
  { value: 'pnpm', label: 'pnpm' },
  { value: 'npm', label: 'npm' },
  { value: 'yarn', label: 'yarn' },
  { value: 'bun', label: 'bun' },
];

export const RUNNER: Record<Manager, string> = {
  pnpm: 'pnpm dlx',
  npm: 'npx',
  yarn: 'yarn dlx',
  bun: 'bunx',
};

export const ADDER: Record<Manager, string> = {
  pnpm: 'pnpm add',
  npm: 'npm install',
  yarn: 'yarn add',
  bun: 'bun add',
};

export const INIT_ARGS = 'wickerline init';

export const PACKAGE = '@wickerline/sdk';

export type ManualStep = {
  id: string;
  title: string;
  code?: string;
};

export const MANUAL_STEPS: ManualStep[] = [
  { id: 'package', title: 'Add the package to your project.' },
  {
    id: 'key',
    title: 'Put the project key in your environment.',
    code: 'WICKERLINE_KEY=wl_pk_live_4d1a',
  },
  {
    id: 'record',
    title: 'Start your agent through the recorder.',
    code: "const run = await record('weekly-digest', agent);",
  },
  { id: 'open', title: 'Open the run from your dashboard.' },
];

export const INSTALL_SEARCH_TEXT =
  'Run the command with pnpm, npm, yarn or bun, or add the package by hand.';

export const CLI_NOTE =
  'The command adds the package, asks for your project key and wraps your agent. It asks before it changes a file.';
