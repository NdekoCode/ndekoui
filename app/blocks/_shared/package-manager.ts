import { useSyncExternalStore } from 'react';

import { itemUrlOf } from '@/lib/site';

export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun';

type PackageManagerOption = {
  id: PackageManager;
  runner: string;
};

export const PACKAGE_MANAGERS: PackageManagerOption[] = [
  { id: 'pnpm', runner: 'pnpm dlx' },
  { id: 'npm', runner: 'npx' },
  { id: 'yarn', runner: 'yarn dlx' },
  { id: 'bun', runner: 'bunx --bun' },
];

export const SHADCN_ADD = 'shadcn@latest add';

/** npm matches the command the Code dialog and the Open in menu already show. */
const DEFAULT_PACKAGE_MANAGER: PackageManager = 'npm';

const STORAGE_KEY = 'ndeko-ui:package-manager';

const listeners = new Set<() => void>();

let chosenPackageManager: PackageManager | null = null;

export function isPackageManager(value: unknown): value is PackageManager {
  return PACKAGE_MANAGERS.some((option) => option.id === value);
}

export function runnerOf(manager: PackageManager) {
  const option = PACKAGE_MANAGERS.find((candidate) => candidate.id === manager);
  if (!option) {
    return 'npx';
  }
  return option.runner;
}

export function installCommandFor(manager: PackageManager, itemName: string) {
  const runner = runnerOf(manager);
  const itemUrl = itemUrlOf(itemName);
  return `${runner} ${SHADCN_ADD} ${itemUrl}`;
}

function readStoredPackageManager() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isPackageManager(stored)) {
      return stored;
    }
    return DEFAULT_PACKAGE_MANAGER;
  } catch {
    return DEFAULT_PACKAGE_MANAGER;
  }
}

function storePackageManager(manager: PackageManager) {
  try {
    window.localStorage.setItem(STORAGE_KEY, manager);
    return true;
  } catch {
    return false;
  }
}

function packageManagerSnapshot() {
  if (chosenPackageManager === null) {
    chosenPackageManager = readStoredPackageManager();
  }
  return chosenPackageManager;
}

function serverPackageManagerSnapshot() {
  return DEFAULT_PACKAGE_MANAGER;
}

function subscribeToPackageManager(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** One choice for the whole site: every install command on the page follows it and it survives a reload. */
export function choosePackageManager(manager: PackageManager) {
  chosenPackageManager = manager;
  storePackageManager(manager);
  for (const listener of listeners) {
    listener();
  }
}

export function usePackageManager() {
  return useSyncExternalStore(
    subscribeToPackageManager,
    packageManagerSnapshot,
    serverPackageManagerSnapshot
  );
}
