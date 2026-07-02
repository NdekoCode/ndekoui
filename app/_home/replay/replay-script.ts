/*
 * The replay of a session in Claude Code, on a timeline in milliseconds. The tool names, their
 * results, the command and the files it writes are copied from the live ndekoui server and from a
 * real run of the shadcn CLI in a project that has a components.json.
 */

export type Chapter = {
  id: string;
  title: string;
  detail: string;
  startMs: number;
  endMs: number;
};

export const CHAPTERS: Chapter[] = [
  {
    id: 'ask',
    title: 'Ask',
    detail: 'Say what the screen needs, in your own words',
    startMs: 0,
    endMs: 4200,
  },
  {
    id: 'find',
    title: 'Find',
    detail: 'The ndekoui server searches the catalogue',
    startMs: 4200,
    endMs: 9200,
  },
  {
    id: 'install',
    title: 'Install',
    detail: 'The shadcn CLI writes the files into your project',
    startMs: 9200,
    endMs: 15200,
  },
  {
    id: 'use',
    title: 'Use',
    detail: 'The component is on the page, ready to try',
    startMs: 15200,
    endMs: 24000,
  },
];

export const TOTAL_MS = 24000;

export const PROJECT_NAME = 'my-app';

export const INSTALL_COMMAND =
  'npx shadcn@latest add https://ui.ndekocode.dev/r/notification-28.json';

export type OutputTone = 'muted' | 'default' | 'success';

export type SessionLine =
  | { kind: 'prompt'; at: number; text: string }
  | { kind: 'call'; at: number; doneAt: number; label: string; detail: string }
  | {
      kind: 'output';
      at: number;
      text: string;
      tone: OutputTone;
      isFirst?: boolean;
    }
  | { kind: 'reply'; at: number; text: string };

export const PROMPT_TEXT =
  'Add a stack of notifications to the dashboard page. Use ndekoui.';

export const CHARACTER_MS = 34;

export const SESSION: SessionLine[] = [
  { kind: 'prompt', at: 500, text: PROMPT_TEXT },
  {
    kind: 'reply',
    at: 3400,
    text: 'I will look for it in the ndekoui catalogue.',
  },
  {
    kind: 'call',
    at: 4400,
    doneAt: 5600,
    label: 'ndekoui · search_items',
    detail: '(query: "notification stack")',
  },
  {
    kind: 'output',
    at: 5700,
    text: '2 results',
    tone: 'muted',
    isFirst: true,
  },
  {
    kind: 'output',
    at: 5900,
    text: 'notification-28   Stack of notifications',
    tone: 'default',
  },
  {
    kind: 'output',
    at: 6050,
    text: 'checkbox-09       Stacked checkbox group',
    tone: 'muted',
  },
  {
    kind: 'call',
    at: 6800,
    doneAt: 7700,
    label: 'ndekoui · get_install_command',
    detail: '(names: ["notification-28"])',
  },
  {
    kind: 'output',
    at: 7800,
    text: INSTALL_COMMAND,
    tone: 'default',
    isFirst: true,
  },
  {
    kind: 'call',
    at: 9400,
    doneAt: 13600,
    label: 'Bash',
    detail: `(${INSTALL_COMMAND})`,
  },
  {
    kind: 'output',
    at: 10200,
    text: '✔ Checking registry.',
    tone: 'success',
    isFirst: true,
  },
  {
    kind: 'output',
    at: 11200,
    text: '✔ Installing dependencies.',
    tone: 'success',
  },
  {
    kind: 'output',
    at: 12200,
    text: '✔ Created 5 files:',
    tone: 'success',
  },
  { kind: 'output', at: 12350, text: '  - lib/utils.ts', tone: 'muted' },
  { kind: 'output', at: 12500, text: '  - lib/icons.tsx', tone: 'muted' },
  {
    kind: 'output',
    at: 12650,
    text: '  - components/ui/button.tsx',
    tone: 'muted',
  },
  {
    kind: 'output',
    at: 12800,
    text: '  - components/ui/status-orb.tsx',
    tone: 'muted',
  },
  {
    kind: 'output',
    at: 12950,
    text: '  - components/notification/notification-28.tsx',
    tone: 'muted',
  },
  {
    kind: 'output',
    at: 13500,
    text: '✔ Updating app/globals.css',
    tone: 'success',
  },
  {
    kind: 'call',
    at: 15400,
    doneAt: 16200,
    label: 'Update',
    detail: '(app/dashboard/page.tsx)',
  },
  {
    kind: 'output',
    at: 16300,
    text: '3 lines added',
    tone: 'muted',
    isFirst: true,
  },
  {
    kind: 'reply',
    at: 19200,
    text: 'The stack is on the dashboard. Hover it to spread the toasts.',
  },
];

export type TreeEntry = {
  path: string;
  name: string;
  depth: number;
  isFolder?: boolean;
  /** When the CLI writes it. Left out for what the project already had. */
  addedAt?: number;
  modifiedAt?: number;
};

export const TREE: TreeEntry[] = [
  { path: 'app', name: 'app', depth: 0, isFolder: true },
  { path: 'app/dashboard', name: 'dashboard', depth: 1, isFolder: true },
  {
    path: 'app/dashboard/page.tsx',
    name: 'page.tsx',
    depth: 2,
    modifiedAt: 16200,
  },
  {
    path: 'app/globals.css',
    name: 'globals.css',
    depth: 1,
    modifiedAt: 13500,
  },
  { path: 'app/layout.tsx', name: 'layout.tsx', depth: 1 },
  { path: 'app/page.tsx', name: 'page.tsx', depth: 1 },
  {
    path: 'components',
    name: 'components',
    depth: 0,
    isFolder: true,
    addedAt: 12650,
  },
  {
    path: 'components/notification',
    name: 'notification',
    depth: 1,
    isFolder: true,
    addedAt: 12950,
  },
  {
    path: 'components/notification/notification-28.tsx',
    name: 'notification-28.tsx',
    depth: 2,
    addedAt: 12950,
  },
  {
    path: 'components/ui',
    name: 'ui',
    depth: 1,
    isFolder: true,
    addedAt: 12650,
  },
  {
    path: 'components/ui/button.tsx',
    name: 'button.tsx',
    depth: 2,
    addedAt: 12650,
  },
  {
    path: 'components/ui/status-orb.tsx',
    name: 'status-orb.tsx',
    depth: 2,
    addedAt: 12800,
  },
  { path: 'lib', name: 'lib', depth: 0, isFolder: true, addedAt: 12350 },
  { path: 'lib/icons.tsx', name: 'icons.tsx', depth: 1, addedAt: 12500 },
  { path: 'lib/utils.ts', name: 'utils.ts', depth: 1, addedAt: 12350 },
  { path: 'components.json', name: 'components.json', depth: 0 },
  {
    path: 'package.json',
    name: 'package.json',
    depth: 0,
    modifiedAt: 11200,
  },
];

export type ProjectView =
  | 'preview-before'
  | 'installed-file'
  | 'page-before'
  | 'page-after'
  | 'preview-after';

/** What the right pane shows, in order, from the moment it starts. */
export const PROJECT_VIEWS: { view: ProjectView; from: number }[] = [
  { view: 'preview-before', from: 0 },
  { view: 'installed-file', from: 12950 },
  { view: 'page-before', from: 15400 },
  { view: 'page-after', from: 16200 },
  { view: 'preview-after', from: 18600 },
];

export const INSTALLED_FILE_PATH =
  'components/notification/notification-28.tsx';

export const PAGE_FILE_PATH = 'app/dashboard/page.tsx';

export const PREVIEW_ADDRESS = 'localhost:3000/dashboard';

/** The first lines of the file as the CLI writes it, its imports rewritten to the project's aliases. */
export const INSTALLED_FILE_HEAD = `'use client';

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
} from 'motion/react';
import { useState } from 'react';

import {
  ChevronsUpDownIcon,
  PlusIcon,
  XIcon,
} from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { StatusOrb, type StatusOrbTone } from '@/components/ui/status-orb';

type StackToast = {
  id: number;
  tone: StatusOrbTone;
  title: string;
  description: string;
};`;

export const PAGE_BEFORE = `export default function DashboardPage() {
  return (
    <main className='mx-auto max-w-md p-8'>
      <h1 className='text-xl font-semibold'>Dashboard</h1>
    </main>
  );
}`;

export const PAGE_AFTER = `import Notification28 from '@/components/notification/notification-28';

export default function DashboardPage() {
  return (
    <main className='mx-auto max-w-md p-8'>
      <h1 className='text-xl font-semibold'>Dashboard</h1>
      <Notification28 />
    </main>
  );
}`;

/** Line numbers, from 1, of the lines the edit adds to the page. */
export const PAGE_ADDED_LINES = [1, 2, 7];

export function chapterIndexAt(elapsed: number) {
  const index = CHAPTERS.findIndex((chapter) => elapsed < chapter.endMs);
  if (index === -1) {
    return CHAPTERS.length - 1;
  }
  return index;
}

export function chapterProgressOf(chapter: Chapter, elapsed: number) {
  const length = chapter.endMs - chapter.startMs;
  const into = elapsed - chapter.startMs;
  const ratio = into / length;
  return Math.min(1, Math.max(0, ratio));
}

export function viewAt(elapsed: number): ProjectView {
  let current: ProjectView = PROJECT_VIEWS[0].view;
  for (const step of PROJECT_VIEWS) {
    if (elapsed >= step.from) {
      current = step.view;
    }
  }
  return current;
}
