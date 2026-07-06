import fs from 'node:fs';
import path from 'node:path';

import postcss, { type Container } from 'postcss';

import { sampleAssetItems } from '../registry/asset-items';
import { registryItems, type RegistryItemDefinition } from '../registry/items';
import { themeItems } from '../registry/theme-items';
import {
  bundleItemsOf,
  collectBundles,
  writeBundleModules,
} from './registry-bundles';
import {
  collectCatalog,
  componentItemsOf,
  hookItemsOf,
  mergedDependencies,
  writePreviewModules,
} from './registry-catalog';
import { motionItemsOf } from './registry-motion';

const REGISTRY_URL = 'https://ui.ndekocode.dev/r';
const ROOT = path.join(__dirname, '..');
const THEME_CSS = path.join(ROOT, 'registry/ndeko/styles/ndeko.css');
const OUTPUT = path.join(ROOT, 'registry.json');
const SOURCE_FILE = /\.tsx?$/;
const THEME_ITEM = 'theme';

type CssObject = { [key: string]: string | CssObject };

type CssVars = {
  theme: Record<string, string>;
  light: Record<string, string>;
  dark: Record<string, string>;
};

function atRuleKey(name: string, params: string) {
  return `@${name} ${params}`.trim();
}

function toCssObject(container: Container): CssObject {
  const result: CssObject = {};
  container.each((node) => {
    if (node.type === 'decl') {
      result[node.prop] = node.value;
      return;
    }
    if (node.type === 'rule') {
      result[node.selector] = toCssObject(node);
      return;
    }
    if (node.type === 'atrule') {
      result[atRuleKey(node.name, node.params)] = toCssObject(node);
    }
  });
  return result;
}

function variablesOf(container: Container): Record<string, string> {
  const variables: Record<string, string> = {};
  container.each((node) => {
    if (node.type !== 'decl') {
      return;
    }
    if (!node.prop.startsWith('--')) {
      return;
    }
    const name = node.prop.slice(2);
    variables[name] = node.value;
  });
  return variables;
}

function keyframesOf(container: Container): CssObject {
  const keyframes: CssObject = {};
  container.each((node) => {
    if (node.type !== 'atrule') {
      return;
    }
    if (node.name !== 'keyframes') {
      return;
    }
    keyframes[atRuleKey(node.name, node.params)] = toCssObject(node);
  });
  return keyframes;
}

function readTheme() {
  const source = fs.readFileSync(THEME_CSS, 'utf8');
  const root = postcss.parse(source);
  const cssVars: CssVars = { theme: {}, light: {}, dark: {} };
  const css: CssObject = {};

  root.each((node) => {
    if (node.type === 'rule') {
      if (node.selector === ':root') {
        Object.assign(cssVars.light, variablesOf(node));
        return;
      }
      if (node.selector === '.dark') {
        Object.assign(cssVars.dark, variablesOf(node));
        return;
      }
      css[node.selector] = toCssObject(node);
      return;
    }
    if (node.type !== 'atrule') {
      return;
    }
    if (node.name === 'theme') {
      Object.assign(cssVars.theme, variablesOf(node));
      Object.assign(css, keyframesOf(node));
      return;
    }
    css[atRuleKey(node.name, node.params)] = toCssObject(node);
  });

  return { cssVars, css };
}

function itemUrl(name: string) {
  return `${REGISTRY_URL}/${name}.json`;
}

/**
 * A hand-written item also depends on every registry file its own files import, so an import added
 * to a primitive can never be missing from the list a project installs. The theme is left to the
 * item: a foundation such as `utils` declares none on purpose.
 */
function withImportedDependencies(
  item: RegistryItemDefinition
): RegistryItemDefinition {
  const filePaths = item.files.map((file) => path.join(ROOT, file.path));
  const sourcePaths = filePaths.filter((filePath) =>
    SOURCE_FILE.test(filePath)
  );
  const imported = mergedDependencies(sourcePaths).registryDependencies;
  const declared = item.registryDependencies ?? [];
  const known = new Set([...declared, item.name, THEME_ITEM]);
  const missing = imported.filter((name) => !known.has(name));
  if (missing.length === 0) {
    return item;
  }
  return { ...item, registryDependencies: [...declared, ...missing] };
}

function toRegistryItem(item: RegistryItemDefinition) {
  const registryDependencies = item.registryDependencies?.map(itemUrl);
  return {
    name: item.name,
    type: item.type,
    title: item.title,
    description: item.description,
    dependencies: item.dependencies,
    registryDependencies,
    files: item.files,
    categories: item.categories,
  };
}

async function buildRegistry() {
  const { cssVars, css } = readTheme();
  const categories = await collectCatalog();
  const componentItems = componentItemsOf(categories);
  const hookItems = hookItemsOf();
  writePreviewModules(categories);
  const blockGroups = await collectBundles('blocks');
  const templateGroups = await collectBundles('templates');
  writeBundleModules('blocks', blockGroups);
  writeBundleModules('templates', templateGroups);
  const blockItems = bundleItemsOf('blocks', blockGroups);
  const templateItems = bundleItemsOf('templates', templateGroups);
  const definitions = [
    ...registryItems.map(withImportedDependencies),
    ...sampleAssetItems,
    ...motionItemsOf(),
    ...hookItems,
    ...componentItems,
    ...blockItems,
    ...templateItems,
  ];
  const themeItem = {
    name: 'theme',
    type: 'registry:theme',
    title: 'ndekoui theme',
    description:
      'Tokens for light and dark, ink colours that pass AA, hairlines and the 3D materials.',
    cssVars,
    css,
    categories: ['foundations'],
  };
  const registry = {
    $schema: 'https://ui.shadcn.com/schema/registry.json',
    name: 'ndekoui',
    homepage: 'https://ui.ndekocode.dev',
    items: [themeItem, ...themeItems, ...definitions.map(toRegistryItem)],
  };
  const json = JSON.stringify(registry, null, 2);
  fs.writeFileSync(OUTPUT, `${json}\n`);
  console.log(
    `registry.json: ${registry.items.length} items, ${componentItems.length} components in ${categories.length} categories`
  );
}

buildRegistry().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
