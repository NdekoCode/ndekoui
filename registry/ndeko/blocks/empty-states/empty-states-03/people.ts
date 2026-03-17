import { PEOPLE } from './data';

export function personOf(personId: string) {
  const found = PEOPLE.find((person) => person.id === personId);
  if (found) {
    return found;
  }
  return PEOPLE[0];
}
