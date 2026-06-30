export const PLAN = {
  name: 'Studio plan',
  description:
    'One plan with every feature. You pay for each person who sends invoices.',
  pricePerSeat: 18,
  minSeats: 1,
  maxSeats: 50,
  defaultSeats: 3,
  action: 'Start a free month',
  footnote: 'Example prices in US dollars, taxes added at checkout',
};

export const SECTION = {
  title: 'One price per person who sends invoices, every feature included',
  description:
    'No feature is held back for a bigger tier. Add a seat when someone new starts sending invoices, remove it when they stop.',
};

export type FeatureRow = {
  feature: string;
  value: string;
};

export type FeatureGroup = {
  title: string;
  rows: FeatureRow[];
};

export const FEATURE_GROUPS: FeatureGroup[] = [
  {
    title: 'Invoicing',
    rows: [
      { feature: 'Invoices per month', value: 'Unlimited' },
      { feature: 'Recurring invoices', value: 'Included' },
      { feature: 'Currencies', value: 'Any your client pays in' },
    ],
  },
  {
    title: 'Time',
    rows: [
      { feature: 'Timers and timesheets', value: 'Included' },
      { feature: 'Rates per person or per task', value: 'Included' },
    ],
  },
  {
    title: 'Getting paid',
    rows: [
      { feature: 'Payment links by card or transfer', value: 'Included' },
      { feature: 'Automatic reminders', value: 'Up to three per invoice' },
    ],
  },
  {
    title: 'Workspace',
    rows: [
      { feature: 'Clients', value: 'Unlimited' },
      { feature: 'Exports', value: 'CSV and PDF' },
      { feature: 'Support', value: 'Email, answered by a person' },
    ],
  },
];
