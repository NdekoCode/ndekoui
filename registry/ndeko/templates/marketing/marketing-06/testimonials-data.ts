export type Trend = 'down' | 'up';

/** A change measured in percent: the label carries its direction, "fewer days to close". */
export type Result = {
  percent: number;
  trend: Trend;
  label: string;
};

export type Customer = {
  id: string;
  person: {
    name: string;
    role: string;
  };
  company: string;
  short: string;
  long: string;
  result: Result;
};

export const SECTION = {
  label: 'Customer results',
  title: 'What changed for the teams that close with Tallyhand',
  lead: 'Bookkeepers and finance leads, months after they switched, each with the number they watched.',
};

/** Invented people, companies and results. The figures are illustrative. */
export const CUSTOMERS: Customer[] = [
  {
    id: 'lubumbashi',
    person: { name: 'Grace Ilunga', role: 'Office manager' },
    company: 'Lubumbashi Cold Chain',
    short:
      'Month-end used to take my whole first week. Now I read a plan and answer a few questions.',
    long: 'I closed March in a day and a half. Tallyhand matched the bank lines overnight, and what was left was fourteen lines I could answer in the morning, each with its invoice already attached.',
    result: { percent: 58, trend: 'down', label: 'fewer days to close' },
  },
  {
    id: 'goma',
    person: { name: 'Joël Tshimanga', role: 'Finance lead' },
    company: 'Goma Lakeside Hotels',
    short:
      'Every entry waits for my yes, so the auditor stopped asking how we control it.',
    long: 'Our auditor asked who can post to the ledger. I showed her the approval trail: one line for every entry, with the name of the person who allowed it.',
    result: { percent: 40, trend: 'down', label: 'fewer audit questions' },
  },
  {
    id: 'kinshasa',
    person: { name: 'Nadège Mwamba', role: 'Owner' },
    company: 'Kinshasa Print Works',
    short: 'I stopped chasing missing receipts by hand on Sunday evenings.',
    long: 'The Collector writes to my suppliers for the invoices I am missing and files what comes back. I used to do that by hand on Sunday evenings, and now I read the list on Monday.',
    result: {
      percent: 71,
      trend: 'down',
      label: 'fewer receipts chased by hand',
    },
  },
  {
    id: 'fjord',
    person: { name: 'Sofia Lindqvist', role: 'Partner' },
    company: 'Fjord & Lind Accountants',
    short: 'Eleven clients closed on the same day, and nobody stayed late.',
    long: 'We close eleven clients every month. The agents split the work by client, and I review in the order the exceptions arrive, not in the order the files were opened.',
    result: { percent: 36, trend: 'up', label: 'more clients per bookkeeper' },
  },
  {
    id: 'brightfield',
    person: { name: 'Kwame Asante', role: 'Finance director' },
    company: 'Brightfield Textiles',
    short: 'The cash forecast now starts from books that are already closed.',
    long: 'The forecast used to wait for the close. With the books signed off on day three we forecast on day four, and the numbers have not been revised since.',
    result: { percent: 62, trend: 'up', label: 'earlier cash forecast' },
  },
  {
    id: 'ferrowick',
    person: { name: 'Daniel Okoro', role: 'Operations director' },
    company: 'Ferrowick Supply',
    short: 'The payouts match to the cent, and the odd ones come to me first.',
    long: 'Our payment processor pays out in batches that never match one invoice. Tallyhand splits each batch back into the invoices it paid, and only the strange ones reach me.',
    result: { percent: 81, trend: 'down', label: 'fewer manual matches' },
  },
];
