export type PackageManagerId = 'npm' | 'pnpm' | 'yarn' | 'bun';

export type InstallCommand = {
  id: PackageManagerId;
  label: string;
  command: string;
};

export const INSTALL_COMMANDS: InstallCommand[] = [
  { id: 'npm', label: 'npm', command: 'npm install @fernpost/sdk' },
  { id: 'pnpm', label: 'pnpm', command: 'pnpm add @fernpost/sdk' },
  { id: 'yarn', label: 'yarn', command: 'yarn add @fernpost/sdk' },
  { id: 'bun', label: 'bun', command: 'bun add @fernpost/sdk' },
];

export const DEFAULT_MANAGER: PackageManagerId = 'npm';

export const CARD = {
  eyebrow: 'Fernpost SDK',
  title: 'Send your first issue from code',
  description:
    'Install the SDK, keep your API key on the server and publish drafts from any script, CMS or scheduled job.',
  links: [
    { label: 'Read the quickstart', href: '#' },
    { label: 'Browse the API reference', href: '#' },
  ],
};
