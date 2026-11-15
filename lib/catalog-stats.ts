import registry from '../registry.json';
import { countLabel } from './site';

/*
 * Every count the site, the README and the release notes give comes from here. It is read from the
 * registry index when the site is built, so a new item changes every number at once.
 */

type RegistryEntry = {
  name: string;
  type: string;
  categories?: string[];
};

export type CatalogStats = {
  /** Numbered variants inside the component families: button-01 to button-66, and so on. */
  componentVariants: number;
  /** The component categories, such as button, input or chart. Motion is counted apart. */
  componentFamilies: number;
  motionEffects: number;
  blocks: number;
  templates: number;
  /** The kinds of page the templates cover, such as dashboards or settings. */
  templateKinds: number;
  primitives: number;
  /** The colour themes a person picks on /themes. The base theme every item installs is not one of them. */
  themes: number;
  hooks: number;
  libs: number;
};

const COMPONENT_TYPE = 'registry:component';
const BLOCK_TYPE = 'registry:block';
const PRIMITIVE_TYPE = 'registry:ui';
const THEME_TYPE = 'registry:theme';
const HOOK_TYPE = 'registry:hook';
const LIB_TYPE = 'registry:lib';

const COMPONENTS_CATEGORY = 'components';
const MOTION_CATEGORY = 'motion';
const BLOCKS_CATEGORY = 'blocks';
const TEMPLATES_CATEGORY = 'templates';

/** The tokens, hairlines and materials every item installs with it. */
const BASE_THEME_NAME = 'theme';

function categoriesOf(entry: RegistryEntry) {
  return entry.categories ?? [];
}

function hasCategory(entry: RegistryEntry, category: string) {
  const categories = categoriesOf(entry);
  return categories.includes(category);
}

function isOfType(entry: RegistryEntry, type: string) {
  return entry.type === type;
}

function isComponentVariant(entry: RegistryEntry) {
  const isComponent = isOfType(entry, COMPONENT_TYPE);
  const isInCatalog = hasCategory(entry, COMPONENTS_CATEGORY);
  return isComponent && isInCatalog;
}

function isMotionEffect(entry: RegistryEntry) {
  const isComponent = isOfType(entry, COMPONENT_TYPE);
  const isMotion = hasCategory(entry, MOTION_CATEGORY);
  return isComponent && isMotion;
}

function isBlock(entry: RegistryEntry) {
  const isBlockType = isOfType(entry, BLOCK_TYPE);
  const isInBlocks = hasCategory(entry, BLOCKS_CATEGORY);
  return isBlockType && isInBlocks;
}

function isTemplate(entry: RegistryEntry) {
  const isBlockType = isOfType(entry, BLOCK_TYPE);
  const isInTemplates = hasCategory(entry, TEMPLATES_CATEGORY);
  return isBlockType && isInTemplates;
}

function isPrimitive(entry: RegistryEntry) {
  return isOfType(entry, PRIMITIVE_TYPE);
}

function isPickableTheme(entry: RegistryEntry) {
  const isTheme = isOfType(entry, THEME_TYPE);
  const isBaseTheme = entry.name === BASE_THEME_NAME;
  return isTheme && !isBaseTheme;
}

function isHook(entry: RegistryEntry) {
  return isOfType(entry, HOOK_TYPE);
}

function isLib(entry: RegistryEntry) {
  return isOfType(entry, LIB_TYPE);
}

function countOf(
  entries: RegistryEntry[],
  test: (entry: RegistryEntry) => boolean
) {
  const matching = entries.filter(test);
  return matching.length;
}

/** The category after the group names the family of a component (`button`) or the kind of a template (`dashboards`). */
function subCategoryOf(entry: RegistryEntry, group: string) {
  const categories = categoriesOf(entry);
  const others = categories.filter((category) => category !== group);
  return others[0];
}

function subCategoryCountOf(entries: RegistryEntry[], group: string) {
  const names = new Set<string>();
  for (const entry of entries) {
    const name = subCategoryOf(entry, group);
    if (name) {
      names.add(name);
    }
  }
  return names.size;
}

export function catalogStatsOf(entries: RegistryEntry[]): CatalogStats {
  const variants = entries.filter(isComponentVariant);
  const templates = entries.filter(isTemplate);

  return {
    componentVariants: variants.length,
    componentFamilies: subCategoryCountOf(variants, COMPONENTS_CATEGORY),
    motionEffects: countOf(entries, isMotionEffect),
    blocks: countOf(entries, isBlock),
    templates: templates.length,
    templateKinds: subCategoryCountOf(templates, TEMPLATES_CATEGORY),
    primitives: countOf(entries, isPrimitive),
    themes: countOf(entries, isPickableTheme),
    hooks: countOf(entries, isHook),
    libs: countOf(entries, isLib),
  };
}

const REGISTRY_ENTRIES: RegistryEntry[] = registry.items;

export const CATALOG_STATS = catalogStatsOf(REGISTRY_ENTRIES);

/** How every page gives the component count: numbered variants (button-01 to button-66) inside families. */
export function componentCountPhraseOf(stats: CatalogStats) {
  const variants = countLabel(
    stats.componentVariants,
    'component variant',
    'component variants'
  );
  const families = countLabel(stats.componentFamilies, 'family', 'families');
  return `${variants} across ${families}`;
}

/** The one line for the GitHub "About" field, which takes at most 350 characters. */
export function aboutTextOf(stats: CatalogStats) {
  const components = componentCountPhraseOf(stats);
  const motion = countLabel(
    stats.motionEffects,
    'motion effect',
    'motion effects'
  );
  const blocks = countLabel(stats.blocks, 'block', 'blocks');
  const templates = countLabel(stats.templates, 'template', 'templates');
  const primitives = countLabel(stats.primitives, 'primitive', 'primitives');
  const themes = countLabel(stats.themes, 'theme', 'themes');
  const contents = `${components}, ${motion}, ${blocks}, ${templates}, ${primitives} and ${themes}`;
  return `Open-source React components that animate every change of state: ${contents}. Built on Base UI, motion and Tailwind CSS 4, installed with the shadcn CLI or through MCP.`;
}
