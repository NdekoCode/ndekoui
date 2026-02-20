import fs from 'node:fs';
import path from 'node:path';

import type {
  RegistryItemDefinition,
  RegistryItemFile,
} from '../registry/items';
import { components } from './registry-components';
import { sortedAlphabetically, titleOf } from './registry-catalog';

const ROOT = path.join(__dirname, '..');
const UTILS_SPECIFIER = '@/lib/utils';
const ICONS_SPECIFIER = '@/registry/ndeko/lib/icons';
const HOOKS_PREFIX = '@/hooks/';
const FRAMEWORK_PACKAGES = new Set(['react', 'react-dom', 'next']);

export const MOTION_PREFIX = 'motion-';

function importsOf(source: string) {
  const matches = source.matchAll(/from\s+['"]([^'"]+)['"]/g);
  return Array.from(matches, (match) => match[1]);
}

function packageNameOf(specifier: string) {
  const segments = specifier.split('/');
  const isScoped = specifier.startsWith('@');
  if (isScoped) {
    return segments.slice(0, 2).join('/');
  }
  return segments[0];
}

function isPackageImport(specifier: string) {
  const isLocal = specifier.startsWith('@/');
  const isRelative = specifier.startsWith('.');
  return !isLocal && !isRelative;
}

function hookFileOf(specifier: string): RegistryItemFile {
  const hookName = specifier.slice(HOOKS_PREFIX.length);
  return { path: `hooks/${hookName}.tsx`, type: 'registry:hook' };
}

function motionItemOf(
  name: string,
  sourcePath: string,
  description: string
): RegistryItemDefinition {
  const source = fs.readFileSync(sourcePath, 'utf8');
  const specifiers = importsOf(source);
  const registryDependencies = new Set<string>(['theme']);
  const dependencies = new Set<string>();
  const hookFiles: RegistryItemFile[] = [];

  for (const specifier of specifiers) {
    if (specifier === UTILS_SPECIFIER) {
      registryDependencies.add('utils');
      continue;
    }
    if (specifier === ICONS_SPECIFIER) {
      registryDependencies.add('icons');
      continue;
    }
    if (specifier.startsWith(HOOKS_PREFIX)) {
      hookFiles.push(hookFileOf(specifier));
      continue;
    }
    if (!isPackageImport(specifier)) {
      continue;
    }
    const packageName = packageNameOf(specifier);
    if (!FRAMEWORK_PACKAGES.has(packageName)) {
      dependencies.add(packageName);
    }
  }

  const componentFile: RegistryItemFile = {
    path: path.relative(ROOT, sourcePath),
    type: 'registry:component',
    target: `components/motion/${name}.tsx`,
  };

  return {
    name: `${MOTION_PREFIX}${name}`,
    type: 'registry:component',
    title: titleOf(name),
    description,
    files: [componentFile, ...hookFiles],
    dependencies: sortedAlphabetically(dependencies),
    registryDependencies: sortedAlphabetically(registryDependencies),
    categories: ['motion'],
  };
}

/** The motion components of `components/core`, published under a `motion-` prefix next to the primitives. */
export function motionItemsOf(): RegistryItemDefinition[] {
  return components.map((component) =>
    motionItemOf(component.name, component.path, component.description)
  );
}
