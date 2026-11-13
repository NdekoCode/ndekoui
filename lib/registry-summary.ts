import registry from '../registry.json';

type RegistrySummary = {
  name: string;
  title?: string;
  description?: string;
};

const SUMMARIES: RegistrySummary[] = registry.items;

/** The title and description an item carries in the registry index, for pages that only know its name. */
export function registrySummaryOf(name: string) {
  return SUMMARIES.find((item) => item.name === name);
}
