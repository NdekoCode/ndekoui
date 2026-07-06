export type FactId = 'laptops' | 'hourly' | 'restore';

export type Phrase = {
  /** The fact that backs this part of the statement. */
  fact: FactId;
  text: string;
};

export type Fact = {
  id: FactId;
  title: string;
  detail: string;
};

export const HERO = {
  eyebrow: 'Laptop backups for teams of five to five hundred',
  lead: 'Keelbox copies what changed on each laptop to storage only your team can read, and puts any file back from the menu bar.',
  primaryAction: 'Start a 30-day trial',
  secondaryAction: 'See how a restore works',
  factsLabel: 'What the statement rests on',
};

export const PHRASES: Phrase[] = [
  { fact: 'laptops', text: 'Every laptop,' },
  { fact: 'hourly', text: 'every hour,' },
  { fact: 'restore', text: 'back in one click.' },
];

export const FACTS: Fact[] = [
  {
    id: 'laptops',
    title: 'Mac, Windows and Linux',
    detail:
      'One small agent per laptop, installed from a link you send to the team',
  },
  {
    id: 'hourly',
    title: 'Every hour, in the background',
    detail:
      'Only the parts of files that changed travel, so most backups end in under a minute',
  },
  {
    id: 'restore',
    title: 'Restore from the menu bar',
    detail:
      'Pick a file, a folder or a whole laptop, and any day of the last year to bring it back from',
  },
];

export const FIRST_FACT: FactId = 'laptops';
