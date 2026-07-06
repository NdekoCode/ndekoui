import {
  DownloadIcon,
  FileSpreadsheetIcon,
  FileUpIcon,
  type Icon,
  TableIcon,
} from '@/registry/ndeko/lib/icons';
import type { Segment } from '@/registry/ndeko/ui/segments';

export const CONVERT_ANCHOR = 'convert';

export const HOW_ANCHOR = 'how';

export const BANKS_ANCHOR = 'banks';

export const COMPARE_ANCHOR = 'compare';

export const REVIEWS_ANCHOR = 'reviews';

export const START_ANCHOR = 'start';

export type NavLink = {
  id: string;
  label: string;
  href: string;
};

export const NAV_LINKS: NavLink[] = [
  { id: 'how', label: 'How it works', href: `#${HOW_ANCHOR}` },
  { id: 'banks', label: 'Banks', href: `#${BANKS_ANCHOR}` },
  { id: 'compare', label: 'Compare', href: `#${COMPARE_ANCHOR}` },
  { id: 'reviews', label: 'Reviews', href: `#${REVIEWS_ANCHOR}` },
];

export const HEADER = {
  tagline: 'Bank statements as spreadsheet rows',
  action: 'Convert a statement',
  shortAction: 'Convert',
  actionHref: `#${START_ANCHOR}`,
};

export const HERO = {
  eyebrow: 'Statement to spreadsheet',
  title: 'Read a bank statement once and keep every row',
  description:
    'Drop in a PDF and Rowmill reads each line into a row with a date, a description, a category and an amount. Check the rows, then copy the table as CSV or download it.',
  primaryAction: 'Convert a statement',
  secondaryAction: 'See the banks it reads',
};

export type StatementLine = {
  id: string;
  date: string;
  description: string;
  category: string;
  amountCents: number;
};

export const STATEMENT = {
  bank: 'Kivu Meridian Bank',
  title: 'Statement, March',
  account: 'Account ending 4821',
  note: 'Illustrative',
};

export const STATEMENT_LINES: StatementLine[] = [
  {
    id: 'salary',
    date: '01 Mar',
    description: 'Salary, March payroll',
    category: 'Income',
    amountCents: 184000,
  },
  {
    id: 'rent',
    date: '02 Mar',
    description: 'Rent, Gombe apartment',
    category: 'Housing',
    amountCents: -60000,
  },
  {
    id: 'groceries',
    date: '04 Mar',
    description: 'Groceries, Marché de la Liberté',
    category: 'Food',
    amountCents: -8640,
  },
  {
    id: 'fuel',
    date: '06 Mar',
    description: 'Fuel, Station Limete',
    category: 'Transport',
    amountCents: -4500,
  },
  {
    id: 'airtime',
    date: '09 Mar',
    description: 'Mobile airtime top-up',
    category: 'Phone',
    amountCents: -1000,
  },
  {
    id: 'transfer',
    date: '11 Mar',
    description: 'Transfer from Amani M.',
    category: 'Income',
    amountCents: 12000,
  },
  {
    id: 'pharmacy',
    date: '14 Mar',
    description: 'Pharmacy, Kintambo',
    category: 'Health',
    amountCents: -2375,
  },
  {
    id: 'electricity',
    date: '18 Mar',
    description: 'Electricity bill, March',
    category: 'Bills',
    amountCents: -5820,
  },
];

export const MANIFESTO =
  'A statement is a record nobody reads twice. The rows were always there, locked inside a layout made for printing. Rowmill reads the lines the way you would, one at a time, and hands them back as a table you can sort, filter and give to your accountant.';

export const MANIFESTO_LABEL = 'Why it exists';

export type Region = 'all' | 'central' | 'east' | 'west' | 'europe';

export type BankRegion = Exclude<Region, 'all'>;

export const DEFAULT_REGION: Region = 'all';

export const REGION_SEGMENTS: Segment<Region>[] = [
  { value: 'all', label: 'All' },
  { value: 'central', label: 'Central' },
  { value: 'east', label: 'East' },
  { value: 'west', label: 'West' },
  { value: 'europe', label: 'Europe' },
];

export type Bank = {
  name: string;
  place: string;
  region: BankRegion;
};

export const BANKS_SECTION = {
  title: 'The banks it reads',
  description:
    'Each statement is read in the layout its bank issued it. Pick a region of Africa or Europe to see where the sample banks sit.',
  footnote: 'Bank names are invented for this template',
};

export const BANKS: Bank[] = [
  { name: 'Kivu Meridian Bank', place: 'Goma', region: 'central' },
  { name: 'Katanga Ledger Union', place: 'Lubumbashi', region: 'central' },
  { name: 'Rive Courante Trust', place: 'Kinshasa', region: 'central' },
  { name: 'Reedwater Mutual', place: 'Kampala', region: 'east' },
  { name: 'Ridgeway Savings', place: 'Nairobi', region: 'east' },
  { name: 'Tarn and Acacia Bank', place: 'Kigali', region: 'east' },
  { name: 'Harmattan Union', place: 'Lagos', region: 'west' },
  { name: 'Cobalt Coast Bank', place: 'Accra', region: 'west' },
  { name: 'Sahel Thread Bank', place: 'Dakar', region: 'west' },
  { name: 'Northgate Provident', place: 'Manchester', region: 'europe' },
  { name: 'Quay and Linden', place: 'Brussels', region: 'europe' },
  { name: 'Canal Street Credit', place: 'Lisbon', region: 'europe' },
];

export type StepId = 'drop' | 'check' | 'export';

export type Step = {
  id: StepId;
  icon: Icon;
  title: string;
  description: string;
};

export const STEPS_SECTION = {
  title: 'Three steps from a PDF to a table',
  description:
    'Each step plays in turn. Pick one to stay on it and read what happens there.',
};

export const STEPS: Step[] = [
  {
    id: 'drop',
    icon: FileUpIcon,
    title: 'Drop in the statement',
    description:
      'Add a PDF, a scan or a photo of the pages. Rowmill finds the table in each page and reads it from the first line to the last.',
  },
  {
    id: 'check',
    icon: TableIcon,
    title: 'Check the rows',
    description:
      'Every line becomes a row. Lines the reader is unsure about are marked, so you check those and skip the rest.',
  },
  {
    id: 'export',
    icon: DownloadIcon,
    title: 'Copy or download',
    description:
      'Copy the table as CSV or download it for your spreadsheet. Dates and amounts keep the format you picked.',
  },
];

export const STEP_FILE = {
  name: 'march-statement.pdf',
  detail: '3 pages',
};

export const STEP_FLAGGED_ROW = {
  description: 'Mobile airtime top-up',
  reason: 'Amount smudged, check it',
};

export const STEP_EXPORT = {
  name: 'march-statement.csv',
  icon: FileSpreadsheetIcon,
};

export type PageCount = '3' | '12' | '40';

export const DEFAULT_PAGE_COUNT: PageCount = '12';

export const PAGE_SEGMENTS: Segment<PageCount>[] = [
  { value: '3', label: '3 pages' },
  { value: '12', label: '12 pages' },
  { value: '40', label: '40 pages' },
];

export type Effort = {
  handMinutes: number;
  toolSeconds: number;
  handChecks: number;
  toolChecks: number;
};

export const EFFORT_BY_PAGES: Record<PageCount, Effort> = {
  '3': { handMinutes: 18, toolSeconds: 4, handChecks: 24, toolChecks: 2 },
  '12': { handMinutes: 70, toolSeconds: 9, handChecks: 96, toolChecks: 5 },
  '40': { handMinutes: 240, toolSeconds: 22, handChecks: 320, toolChecks: 11 },
};

export const COMPARE_SECTION = {
  title: 'By hand or with Rowmill',
  description: 'Pick the length of a statement to see what each way costs you.',
  footnote: 'Illustrative figures, not measured on real statements',
  handLabel: 'By hand',
  toolLabel: 'With Rowmill',
};

export type TextRow = {
  label: string;
  hand: string;
  tool: string;
};

export const COMPARE_TEXT_ROWS: TextRow[] = [
  {
    label: 'Dates in one format',
    hand: 'Retyped one by one',
    tool: 'Converted as they are read',
  },
  {
    label: 'Next month',
    hand: 'Start again',
    tool: 'Same settings, one drop',
  },
];

export type Review = {
  id: string;
  quote: string;
  name: string;
  role: string;
  company: string;
};

export const REVIEWS_SECTION = {
  title: 'What bookkeepers say',
  description:
    'Sample reviews written for this template, not from real customers. Drag the row or use the arrows.',
};

export const REVIEWS: Review[] = [
  {
    id: 'esther',
    quote:
      'I used to retype March over two evenings. Now I check the flagged lines and send the file before dinner.',
    name: 'Esther Mbuyi',
    role: 'Bookkeeper, Kinshasa',
    company: 'Gombe Books Desk',
  },
  {
    id: 'samuel',
    quote:
      'Our freight accounts come from three banks. The rows land in one format, so the month-end sheet stopped being a puzzle.',
    name: 'Samuel Mukendi',
    role: 'Finance lead, Lubumbashi',
    company: 'Katanga Freight Desk',
  },
  {
    id: 'aline',
    quote:
      'Members ask where their contribution went. I filter the table by name and answer in a minute.',
    name: 'Aline Kabongo',
    role: 'Treasurer, Goma',
    company: 'Lake Kivu Growers',
  },
  {
    id: 'peter',
    quote:
      'Scanned statements used to be the slow part. Now a scan is just another PDF.',
    name: 'Peter Otieno',
    role: 'Accountant, Nairobi',
    company: 'Otieno and Wanjiru Accounts',
  },
  {
    id: 'marta',
    quote:
      'I run a small studio and hate paperwork. The CSV opens in my spreadsheet and my accountant stops writing to me.',
    name: 'Marta Silva',
    role: 'Founder, Lisbon',
    company: 'Studio Bairro',
  },
];

export const CLOSING = {
  title: 'Your next statement is a table by lunchtime',
  description:
    'Drop in one statement and see the rows it becomes. Nothing to install, and the original file stays as it was.',
  primaryAction: 'Convert a statement',
  secondaryAction: 'Read how it works',
};

export type FooterLink = {
  label: string;
  href: string;
};

export const BRAND = {
  name: 'Rowmill',
  copyright: '© 2026 Rowmill',
};

export const FOOTER_LINKS: FooterLink[] = [
  { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' },
  { label: 'Security', href: '#' },
  { label: 'Contact', href: '#' },
];

export const STUDIO_CLOCK = {
  place: 'Kinshasa',
  timeZone: 'Africa/Kinshasa',
};
