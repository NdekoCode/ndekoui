import {
  BellIcon,
  ClockIcon,
  FileTextIcon,
  type Icon,
  MailIcon,
  SendIcon,
  WalletIcon,
} from '@/registry/ndeko/lib/icons';

export type MediaId = 'invoice' | 'reminders' | 'payments';

export type FeatureRow = {
  id: MediaId;
  icon: Icon;
  title: string;
  description: string;
  linkLabel: string;
};

export const SECTION = {
  title: 'Everything between the last tracked hour and the paid invoice',
  description:
    'Three steps that usually live in three tools, kept in one place and in the right order.',
};

export const ROWS: FeatureRow[] = [
  {
    id: 'invoice',
    icon: FileTextIcon,
    title: 'Draft invoices from the hours you tracked',
    description:
      'Pick a client and a period. Tallyfold groups the time by task, applies each rate and leaves a draft for you to check line by line.',
    linkLabel: 'How drafts work',
  },
  {
    id: 'reminders',
    icon: BellIcon,
    title: 'Reminders that stay polite',
    description:
      'Choose the tone and the rhythm once. Tallyfold follows up on late invoices and stops the moment a payment arrives.',
    linkLabel: 'Set up reminders',
  },
  {
    id: 'payments',
    icon: WalletIcon,
    title: 'Payments land beside the invoice',
    description:
      'Clients pay by card or bank transfer from the link in the email. The invoice turns paid and the books follow the same day.',
    linkLabel: 'See payment options',
  },
];

export type InvoiceLine = {
  description: string;
  hours: number;
  rate: number;
};

export const INVOICE = {
  number: 'TF-0142',
  client: 'Harbor & Finch Studio',
  period: '1 to 31 October',
  status: 'Draft',
  lines: [
    { description: 'Brand workshop', hours: 6, rate: 90 },
    { description: 'Website copy', hours: 14, rate: 75 },
    { description: 'Review rounds', hours: 3, rate: 75 },
  ] satisfies InvoiceLine[],
};

export type Reminder = {
  icon: Icon;
  title: string;
  date: string;
  status: string;
  color: string;
};

export const REMINDERS: Reminder[] = [
  {
    icon: SendIcon,
    title: 'Invoice sent',
    date: 'Mon 3 Nov',
    status: 'Delivered',
    color: 'var(--success)',
  },
  {
    icon: MailIcon,
    title: 'Friendly reminder',
    date: 'Mon 10 Nov',
    status: 'Opened',
    color: 'var(--info)',
  },
  {
    icon: ClockIcon,
    title: 'Second reminder',
    date: 'Mon 17 Nov',
    status: 'Scheduled',
    color: 'var(--warning)',
  },
];

export type Payment = {
  client: string;
  invoice: string;
  amount: number;
  status: string;
  color: string;
};

export const PAYMENTS: Payment[] = [
  {
    client: 'Harbor & Finch Studio',
    invoice: 'TF-0142',
    amount: 1815,
    status: 'Paid',
    color: 'var(--success)',
  },
  {
    client: 'Okafor Bakery',
    invoice: 'TF-0139',
    amount: 640,
    status: 'Paid',
    color: 'var(--success)',
  },
  {
    client: 'Lune Architects',
    invoice: 'TF-0137',
    amount: 2300,
    status: 'Due Friday',
    color: 'var(--warning)',
  },
];
