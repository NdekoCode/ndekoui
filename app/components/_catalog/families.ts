import type { CatalogCategory } from './types';

type CatalogFamily = {
  name: string;
  description: string;
  slugs: string[];
};

export const FAMILIES: CatalogFamily[] = [
  {
    name: 'AI',
    description:
      'Prompts, answers, agents at work and what they ask a person to decide.',
    slugs: ['prompt', 'answer', 'agent', 'run', 'review', 'voice'],
  },
  {
    name: 'Actions',
    description: 'Buttons and the menus they open.',
    slugs: ['button', 'dropdown'],
  },
  {
    name: 'Forms',
    description: 'Every way to type, pick, toggle and upload.',
    slugs: [
      'input',
      'textarea',
      'select',
      'checkbox',
      'radio',
      'switch',
      'slider',
      'calendar-date-picker',
      'file-upload',
      'image-cropper',
    ],
  },
  {
    name: 'Overlays',
    description: 'Layers that open above the page.',
    slugs: ['dialog', 'modal', 'aside', 'popover', 'tooltip'],
  },
  {
    name: 'Navigation',
    description: 'Moving between pages, sections and steps.',
    slugs: ['navbar', 'breadcrumb', 'pagination', 'tabs', 'stepper'],
  },
  {
    name: 'Data display',
    description: 'Lists, tables, trees, cards and the people in them.',
    slugs: [
      'table',
      'tree',
      'timeline',
      'card',
      'accordion',
      'avatar',
      'badge',
      'event-calendar',
    ],
  },
  {
    name: 'Charts',
    description: 'Charts that say what they show and answer a pointer.',
    slugs: ['chart'],
  },
  {
    name: 'Collaboration',
    description:
      'The work around a task: its sub-tasks, comments, activity and team.',
    slugs: ['subtask', 'comment', 'activity', 'teams'],
  },
  {
    name: 'Feedback',
    description: 'Messages about what just happened.',
    slugs: ['alert', 'banner', 'notification', 'loading'],
  },
  {
    name: 'Motion and effects',
    description:
      'Living scenes, quiet backgrounds and text that moves, for the site around the product.',
    slugs: ['illustration', 'background', 'text-effect', 'effect'],
  },
];

export type PublishedFamily = {
  name: string;
  description: string;
  categories: CatalogCategory[];
};

function categoryBySlug(catalog: CatalogCategory[]) {
  const bySlug = new Map<string, CatalogCategory>();
  for (const category of catalog) {
    bySlug.set(category.slug, category);
  }
  return bySlug;
}

function isPublished(
  category: CatalogCategory | undefined
): category is CatalogCategory {
  return category !== undefined;
}

export function publishedFamilies(catalog: CatalogCategory[]) {
  const bySlug = categoryBySlug(catalog);
  const families: PublishedFamily[] = [];
  for (const family of FAMILIES) {
    const categories = family.slugs
      .map((slug) => bySlug.get(slug))
      .filter(isPublished);
    if (categories.length === 0) {
      continue;
    }
    families.push({
      name: family.name,
      description: family.description,
      categories,
    });
  }
  return families;
}

export function familyAnchorOf(name: string) {
  const lowered = name.toLowerCase();
  return lowered.split(' ').join('-');
}

export function countComponents(categories: CatalogCategory[]) {
  let total = 0;
  for (const category of categories) {
    total += category.entries.length;
  }
  return total;
}
