export const SYSTEM_FONT_CLASS =
  "font-[system-ui,-apple-system,'Segoe_UI',Roboto,'Helvetica_Neue',Arial,sans-serif]";

export const REGISTRY_URL = 'https://ui.ndekocode.dev/r';

export function installCommandOf(itemName: string) {
  return `npx shadcn@latest add ${REGISTRY_URL}/${itemName}.json`;
}

export function countLabel(count: number, singular: string, plural: string) {
  if (count === 1) {
    return `1 ${singular}`;
  }
  return `${count} ${plural}`;
}
