export type QueueTask = {
  id: string;
  title: string;
};

export const SECTION = {
  title: 'Close your next month with the queue already moving',
  description:
    'Use your work email and Tallyhand starts on the bank lines already waiting. The first close runs in review mode: nothing posts until you say so.',
  placeholder: 'you@company.com',
  emailLabel: 'Work email',
};

export const QUEUE = {
  title: 'Month-end queue',
  badge: 'Sample queue',
};

export const TASKS: QueueTask[] = [
  { id: 'match', title: 'Match 412 bank lines to invoices' },
  { id: 'chase', title: 'Ask for the 3 missing receipts' },
  { id: 'draft', title: 'Draft 9 journal entries' },
  { id: 'payroll', title: 'Check payroll against the ledger' },
  { id: 'handover', title: 'Hand the close over for review' },
];
