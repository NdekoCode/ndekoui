export type Manager = 'pnpm' | 'npm' | 'yarn' | 'bun';

export type NavItem = {
  id: string;
  title: string;
  href: string;
};

export type NavSection = {
  id: string;
  title: string;
  items: NavItem[];
};

export type ManualStep = {
  id: string;
  title: string;
  code?: string;
};

export const DOCS = {
  product: 'Brindle',
  version: 'v3',
  homeHref: '#',
  sectionHref: '#getting-started',
  currentId: 'installation',
};

export const PAGE = {
  title: 'Installation',
  section: 'Getting started',
  lead: 'Add Brindle to a React app in a few minutes. Let the command line write the setup for you, or follow the four steps by hand.',
  href: '#installation',
};

export const MANAGERS: { value: Manager; label: string }[] = [
  { value: 'pnpm', label: 'pnpm' },
  { value: 'npm', label: 'npm' },
  { value: 'yarn', label: 'yarn' },
  { value: 'bun', label: 'bun' },
];

/** The words that run a package without installing it, for each package manager. */
export const RUNNER: Record<Manager, string> = {
  pnpm: 'pnpm dlx',
  npm: 'npx',
  yarn: 'yarn dlx',
  bun: 'bunx',
};

/** The words that add a package to the project, for each package manager. */
export const ADDER: Record<Manager, string> = {
  pnpm: 'pnpm add',
  npm: 'npm install',
  yarn: 'yarn add',
  bun: 'bun add',
};

export const INIT_ARGS = 'brindle init';

export const PACKAGE = '@brindle/react';

export const MANUAL_STEPS: ManualStep[] = [
  {
    id: 'package',
    title: 'Add the package to your project.',
  },
  {
    id: 'key',
    title: 'Put the client key of your project in your environment.',
    code: 'NEXT_PUBLIC_BRINDLE_KEY=brindle_pk_live_9f2c',
  },
  {
    id: 'provider',
    title: 'Wrap your app in the provider, once, near its root.',
    code: '<FlagProvider clientKey={process.env.NEXT_PUBLIC_BRINDLE_KEY}>\n  <App />\n</FlagProvider>',
  },
  {
    id: 'read',
    title: 'Read a flag where you need it.',
    code: "const showNewCheckout = useFlag('new-checkout');",
  },
];

export const CHECK_CODE = "const showNewCheckout = useFlag('new-checkout');";

export const KEY_CODE = 'NEXT_PUBLIC_BRINDLE_KEY=brindle_pk_live_9f2c';

export const KEYS_TEXT =
  'Copy the client key from Settings, then Keys, and put it in your environment. The provider reads it once, when the app starts.';

export const KEYS_WARNING =
  'Only the client key belongs in the browser. The server key starts with brindle_sk_ and stays on your server.';

export const CHECK_TEXT =
  'Read a flag in any component, open your app and turn the flag on in the dashboard: the page follows without a reload.';

export const HEADINGS = [
  { id: 'requirements', title: 'Requirements' },
  { id: 'install', title: 'Install' },
  { id: 'keys', title: 'Add your keys' },
  { id: 'check', title: 'Check that it works' },
  { id: 'next', title: 'Next steps' },
];

export const REQUIREMENTS = [
  'React 18 or later',
  'Node 20 or later to run the command line',
  'A Brindle project and its client key, under Settings, then Keys',
];

export const NEXT_STEPS: NavItem[] = [
  { id: 'quick-start', title: 'Quick start', href: '#quick-start' },
  { id: 'targeting', title: 'Targeting rules', href: '#targeting-rules' },
  { id: 'ssr', title: 'Server rendering', href: '#server-rendering' },
];

export const PREVIOUS: NavItem = {
  id: 'introduction',
  title: 'Introduction',
  href: '#introduction',
};

export const NEXT: NavItem = {
  id: 'quick-start',
  title: 'Quick start',
  href: '#quick-start',
};

export const NAV: NavSection[] = [
  {
    id: 'start',
    title: 'Getting started',
    items: [
      { id: 'introduction', title: 'Introduction', href: '#introduction' },
      { id: 'installation', title: 'Installation', href: '#installation' },
      { id: 'quick-start', title: 'Quick start', href: '#quick-start' },
      {
        id: 'project-structure',
        title: 'Project structure',
        href: '#project-structure',
      },
    ],
  },
  {
    id: 'flags',
    title: 'Flags',
    items: [
      { id: 'create-flag', title: 'Create a flag', href: '#create-a-flag' },
      {
        id: 'targeting-rules',
        title: 'Targeting rules',
        href: '#targeting-rules',
      },
      {
        id: 'percentage-rollouts',
        title: 'Percentage rollouts',
        href: '#percentage-rollouts',
      },
      { id: 'kill-switches', title: 'Kill switches', href: '#kill-switches' },
      {
        id: 'flag-lifecycle',
        title: 'Flag lifecycle',
        href: '#flag-lifecycle',
      },
      {
        id: 'stale-flags',
        title: 'Clean up stale flags',
        href: '#stale-flags',
      },
    ],
  },
  {
    id: 'sdks',
    title: 'SDKs',
    items: [
      { id: 'react', title: 'React', href: '#sdk-react' },
      { id: 'next', title: 'Next.js', href: '#sdk-next' },
      { id: 'node', title: 'Node', href: '#sdk-node' },
      { id: 'edge', title: 'Edge runtimes', href: '#sdk-edge' },
    ],
  },
  {
    id: 'api',
    title: 'API reference',
    items: [
      { id: 'flag-provider', title: 'FlagProvider', href: '#flag-provider' },
      { id: 'use-flag', title: 'useFlag', href: '#use-flag' },
      {
        id: 'evaluation-context',
        title: 'Evaluation context',
        href: '#evaluation-context',
      },
      { id: 'events', title: 'Events', href: '#events' },
      { id: 'errors', title: 'Errors', href: '#errors' },
    ],
  },
  {
    id: 'guides',
    title: 'Guides',
    items: [
      {
        id: 'testing-flags',
        title: 'Testing with flags',
        href: '#testing-with-flags',
      },
      {
        id: 'server-rendering',
        title: 'Server rendering',
        href: '#server-rendering',
      },
      {
        id: 'migrating',
        title: 'Moving flags out of config files',
        href: '#moving-flags',
      },
    ],
  },
];
