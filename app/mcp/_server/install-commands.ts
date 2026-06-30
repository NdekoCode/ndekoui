import { REGISTRY_NAMESPACE } from '@/app/mcp/_shared/mcp-config';
import { itemUrlOf } from '@/lib/site';

export const PACKAGE_MANAGERS = ['npm', 'pnpm', 'yarn', 'bun'] as const;

export type PackageManager = (typeof PACKAGE_MANAGERS)[number];

/** The runner each package manager uses in the shadcn CLI docs. */
const SHADCN_RUNNERS: Record<PackageManager, string> = {
  npm: 'npx shadcn@latest',
  pnpm: 'pnpm dlx shadcn@latest',
  yarn: 'yarn dlx shadcn@latest',
  bun: 'bunx --bun shadcn@latest',
};

function namespacedNameOf(name: string) {
  return `${REGISTRY_NAMESPACE}/${name}`;
}

export function addCommandOf(names: string[], packageManager: PackageManager) {
  const runner = SHADCN_RUNNERS[packageManager];
  const urls = names.map(itemUrlOf);
  const targets = urls.join(' ');
  return `${runner} add ${targets}`;
}

/** The short form, for projects whose components.json declares the @ndeko registry. */
export function namespacedAddCommandOf(
  names: string[],
  packageManager: PackageManager
) {
  const runner = SHADCN_RUNNERS[packageManager];
  const namespaced = names.map(namespacedNameOf);
  const targets = namespaced.join(' ');
  return `${runner} add ${targets}`;
}

export function initCommandOf(packageManager: PackageManager) {
  const runner = SHADCN_RUNNERS[packageManager];
  return `${runner} init`;
}
