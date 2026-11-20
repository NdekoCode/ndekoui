import { catalog } from '../_generated/catalog';
import type { CatalogCategory } from './types';

function viewParamsOfCategory(category: CatalogCategory) {
  return category.entries.map((entry) => ({
    category: category.slug,
    name: entry.name,
  }));
}

/** Every component that has a full page, built ahead with its share card. */
export function componentViewParamsOf() {
  return catalog.flatMap(viewParamsOfCategory);
}
