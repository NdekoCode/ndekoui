export type InvoiceStatus = 'paid' | 'open' | 'overdue';

export type StatusFilter = 'all' | InvoiceStatus;

export type Invoice = {
  id: string;
  number: string;
  client: string;
  issuedOn: string;
  amount: number;
  status: InvoiceStatus;
};

export type AmountRange = readonly [number, number];

export type AmountPreset = {
  id: string;
  label: string;
  range: AmountRange;
};

export const WORKSPACE = {
  title: 'Invoices',
  period: 'September and October',
};

export const AMOUNT_BOUNDS = {
  min: 0,
  max: 6000,
  step: 50,
  /** The two thumbs never come closer than this, so a range always holds something. */
  minGap: 250,
};

export const HISTOGRAM_BIN_COUNT = 24;

export const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'paid', label: 'Paid' },
  { id: 'open', label: 'Open' },
  { id: 'overdue', label: 'Overdue' },
];

export const STATUS_DETAILS: Record<
  InvoiceStatus,
  { label: string; color: string }
> = {
  paid: { label: 'Paid', color: 'var(--success)' },
  open: { label: 'Open', color: 'var(--info)' },
  overdue: { label: 'Overdue', color: 'var(--destructive)' },
};

export const AMOUNT_PRESETS: AmountPreset[] = [
  { id: 'small', label: 'Under €500', range: [0, 500] },
  { id: 'medium', label: '€500 to €2,000', range: [500, 2000] },
  { id: 'large', label: 'Over €2,000', range: [2000, 6000] },
];

export const INVOICES: Invoice[] = [
  {
    id: 'inv-01',
    number: 'INV-2041',
    client: 'Fernhollow Bakery',
    issuedOn: 'Oct 28',
    amount: 180,
    status: 'open',
  },
  {
    id: 'inv-02',
    number: 'INV-2040',
    client: 'Saltmarsh Press',
    issuedOn: 'Oct 27',
    amount: 1240,
    status: 'open',
  },
  {
    id: 'inv-03',
    number: 'INV-2039',
    client: 'Okapi Freight',
    issuedOn: 'Oct 25',
    amount: 4860,
    status: 'open',
  },
  {
    id: 'inv-04',
    number: 'INV-2038',
    client: 'Quillmark Studio',
    issuedOn: 'Oct 24',
    amount: 320,
    status: 'paid',
  },
  {
    id: 'inv-05',
    number: 'INV-2037',
    client: 'Driftwood Yoga',
    issuedOn: 'Oct 22',
    amount: 95,
    status: 'paid',
  },
  {
    id: 'inv-06',
    number: 'INV-2036',
    client: 'Brightmoor Dental',
    issuedOn: 'Oct 21',
    amount: 760,
    status: 'open',
  },
  {
    id: 'inv-07',
    number: 'INV-2035',
    client: 'Tessaro Labs',
    issuedOn: 'Oct 20',
    amount: 2150,
    status: 'paid',
  },
  {
    id: 'inv-08',
    number: 'INV-2034',
    client: 'Marula Kitchens',
    issuedOn: 'Oct 18',
    amount: 410,
    status: 'overdue',
  },
  {
    id: 'inv-09',
    number: 'INV-2033',
    client: 'Cobalt Ridge Hotel',
    issuedOn: 'Oct 17',
    amount: 3420,
    status: 'paid',
  },
  {
    id: 'inv-10',
    number: 'INV-2032',
    client: 'Ironbark Builders',
    issuedOn: 'Oct 15',
    amount: 1680,
    status: 'open',
  },
  {
    id: 'inv-11',
    number: 'INV-2031',
    client: 'Petrel Analytics',
    issuedOn: 'Oct 14',
    amount: 260,
    status: 'paid',
  },
  {
    id: 'inv-12',
    number: 'INV-2030',
    client: 'Lumen Atelier',
    issuedOn: 'Oct 12',
    amount: 540,
    status: 'paid',
  },
  {
    id: 'inv-13',
    number: 'INV-2029',
    client: 'Fernhollow Bakery',
    issuedOn: 'Oct 10',
    amount: 145,
    status: 'paid',
  },
  {
    id: 'inv-14',
    number: 'INV-2028',
    client: 'Okapi Freight',
    issuedOn: 'Oct 9',
    amount: 5620,
    status: 'overdue',
  },
  {
    id: 'inv-15',
    number: 'INV-2027',
    client: 'Saltmarsh Press',
    issuedOn: 'Oct 7',
    amount: 880,
    status: 'paid',
  },
  {
    id: 'inv-16',
    number: 'INV-2026',
    client: 'Quillmark Studio',
    issuedOn: 'Oct 6',
    amount: 1320,
    status: 'overdue',
  },
  {
    id: 'inv-17',
    number: 'INV-2025',
    client: 'Driftwood Yoga',
    issuedOn: 'Oct 3',
    amount: 210,
    status: 'paid',
  },
  {
    id: 'inv-18',
    number: 'INV-2024',
    client: 'Tessaro Labs',
    issuedOn: 'Oct 2',
    amount: 2780,
    status: 'open',
  },
  {
    id: 'inv-19',
    number: 'INV-2023',
    client: 'Brightmoor Dental',
    issuedOn: 'Sep 30',
    amount: 690,
    status: 'paid',
  },
  {
    id: 'inv-20',
    number: 'INV-2022',
    client: 'Marula Kitchens',
    issuedOn: 'Sep 28',
    amount: 365,
    status: 'paid',
  },
  {
    id: 'inv-21',
    number: 'INV-2021',
    client: 'Petrel Analytics',
    issuedOn: 'Sep 26',
    amount: 1960,
    status: 'paid',
  },
  {
    id: 'inv-22',
    number: 'INV-2020',
    client: 'Cobalt Ridge Hotel',
    issuedOn: 'Sep 24',
    amount: 470,
    status: 'overdue',
  },
  {
    id: 'inv-23',
    number: 'INV-2019',
    client: 'Lumen Atelier',
    issuedOn: 'Sep 23',
    amount: 1150,
    status: 'paid',
  },
  {
    id: 'inv-24',
    number: 'INV-2018',
    client: 'Ironbark Builders',
    issuedOn: 'Sep 21',
    amount: 3980,
    status: 'paid',
  },
  {
    id: 'inv-25',
    number: 'INV-2017',
    client: 'Fernhollow Bakery',
    issuedOn: 'Sep 19',
    amount: 230,
    status: 'paid',
  },
  {
    id: 'inv-26',
    number: 'INV-2016',
    client: 'Saltmarsh Press',
    issuedOn: 'Sep 17',
    amount: 615,
    status: 'paid',
  },
  {
    id: 'inv-27',
    number: 'INV-2015',
    client: 'Driftwood Yoga',
    issuedOn: 'Sep 15',
    amount: 120,
    status: 'overdue',
  },
  {
    id: 'inv-28',
    number: 'INV-2014',
    client: 'Quillmark Studio',
    issuedOn: 'Sep 12',
    amount: 940,
    status: 'paid',
  },
  {
    id: 'inv-29',
    number: 'INV-2013',
    client: 'Tessaro Labs',
    issuedOn: 'Sep 10',
    amount: 1490,
    status: 'paid',
  },
  {
    id: 'inv-30',
    number: 'INV-2012',
    client: 'Okapi Freight',
    issuedOn: 'Sep 8',
    amount: 2460,
    status: 'paid',
  },
  {
    id: 'inv-31',
    number: 'INV-2011',
    client: 'Brightmoor Dental',
    issuedOn: 'Sep 5',
    amount: 335,
    status: 'paid',
  },
  {
    id: 'inv-32',
    number: 'INV-2010',
    client: 'Marula Kitchens',
    issuedOn: 'Sep 3',
    amount: 780,
    status: 'paid',
  },
];
