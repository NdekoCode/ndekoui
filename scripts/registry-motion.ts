import fs from 'node:fs';
import path from 'node:path';

import type {
  RegistryItemDefinition,
  RegistryItemFile,
} from '../registry/items';
import { components } from './registry-components';
import { motionItemNameOf } from '../lib/site';
import { sortedAlphabetically, titleOf } from './registry-catalog';

const ROOT = path.join(__dirname, '..');
const UTILS_SPECIFIER = '@/lib/utils';
const HOOKS_PREFIX = '@/hooks/';
const REGISTRY_PREFIX = '@/registry/ndeko/';
const REGISTRY_ITEM_FOLDERS = new Set(['ui', 'lib', 'hooks']);
const FRAMEWORK_PACKAGES = new Set(['react', 'react-dom', 'next']);

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

const LOCAL_EXTENSIONS = ['.tsx', '.ts'];

function siblingFileOf(sourcePath: string, specifier: string) {
  const base = path.resolve(path.dirname(sourcePath), specifier);
  const candidates = LOCAL_EXTENSIONS.map((extension) => `${base}${extension}`);
  const existing = candidates.find((candidate) => fs.existsSync(candidate));
  if (!existing) {
    return null;
  }
  const file: RegistryItemFile = {
    path: path.relative(ROOT, existing),
    type: 'registry:component',
    target: `components/motion/${path.basename(existing)}`,
  };
  return file;
}

function registryItemOf(specifier: string) {
  const relative = specifier.slice(REGISTRY_PREFIX.length);
  const [folder, name] = relative.split('/');
  const isItemFolder = REGISTRY_ITEM_FOLDERS.has(folder);
  if (!isItemFolder) {
    return null;
  }
  return name;
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
  const siblingFiles: RegistryItemFile[] = [];

  for (const specifier of specifiers) {
    if (specifier === UTILS_SPECIFIER) {
      registryDependencies.add('utils');
      continue;
    }
    if (specifier.startsWith(REGISTRY_PREFIX)) {
      const itemName = registryItemOf(specifier);
      if (itemName) {
        registryDependencies.add(itemName);
      }
      continue;
    }
    if (specifier.startsWith(HOOKS_PREFIX)) {
      hookFiles.push(hookFileOf(specifier));
      continue;
    }
    if (specifier.startsWith('./')) {
      const sibling = siblingFileOf(sourcePath, specifier);
      if (sibling) {
        siblingFiles.push(sibling);
      }
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
    name: motionItemNameOf(name),
    type: 'registry:component',
    title: titleOf(name),
    description,
    files: [componentFile, ...siblingFiles, ...hookFiles],
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
