import { REGISTRY_NAMESPACE } from '@/app/mcp/_shared/mcp-config';

export const SYSTEM_FONT_CLASS =
  "font-[system-ui,-apple-system,'Segoe_UI',Roboto,'Helvetica_Neue',Arial,sans-serif]";

export const REGISTRY_URL = 'https://ui.ndekocode.dev/r';

export function itemUrlOf(itemName: string) {
  return `${REGISTRY_URL}/${itemName}.json`;
}

/** `@ndeko/<name>`: the shadcn CLI finds @ndeko in its registry directory, with no entry in components.json. */
export function namespacedItemOf(itemName: string) {
  return `${REGISTRY_NAMESPACE}/${itemName}`;
}

export function installCommandOf(itemName: string) {
  const namespacedItem = namespacedItemOf(itemName);
  return `npx shadcn@latest add ${namespacedItem}`;
}

/** The same install for a shadcn CLI too old to read the registry directory. */
export function urlInstallCommandOf(itemName: string) {
  const itemUrl = itemUrlOf(itemName);
  return `npx shadcn@latest add ${itemUrl}`;
}

export function countLabel(count: number, singular: string, plural: string) {
  if (count === 1) {
    return `1 ${singular}`;
  }
  return `${count} ${plural}`;
}

const MOTION_ITEM_PREFIX = 'motion-';

/** The registry name of a motion component, without doubling the prefix of a slug that already has it. */
export function motionItemNameOf(slug: string) {
  if (slug.startsWith(MOTION_ITEM_PREFIX)) {
    return slug;
  }
  return `${MOTION_ITEM_PREFIX}${slug}`;
}
