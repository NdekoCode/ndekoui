import {
  CalendarCheckIcon,
  ReceiptIcon,
  RocketIcon,
  ShieldCheckIcon,
  UsersIcon,
  WalletIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';

export type CategoryId =
  'start' | 'payroll' | 'people' | 'taxes' | 'payments' | 'account';

export type Category = {
  id: CategoryId;
  title: string;
  lead: string;
  href: string;
};

export type Article = {
  id: string;
  title: string;
  category: CategoryId;
  /** Other words people type for the same thing. */
  terms: string;
  href: string;
};

export const SITE = {
  name: 'Pennywort',
  homeHref: '#',
  searchHref: '#search',
};

export const CATEGORIES: Category[] = [
  {
    id: 'start',
    title: 'Getting started',
    lead: 'Company details, pay schedule and your bank',
    href: '#getting-started',
  },
  {
    id: 'payroll',
    title: 'Running payroll',
    lead: 'Runs, payslips, bonuses and corrections',
    href: '#running-payroll',
  },
  {
    id: 'people',
    title: 'People',
    lead: 'Starters, leavers, salaries and leave',
    href: '#people',
  },
  {
    id: 'taxes',
    title: 'Taxes and filings',
    lead: 'Tax codes, monthly returns and year end',
    href: '#taxes',
  },
  {
    id: 'payments',
    title: 'Payments',
    lead: 'Bank accounts, pending payments and refunds',
    href: '#payments',
  },
  {
    id: 'account',
    title: 'Account and security',
    lead: 'Admins, sign-in and your plan',
    href: '#account',
  },
];

export const CATEGORY_GLYPH: Record<CategoryId, Icon> = {
  start: RocketIcon,
  payroll: CalendarCheckIcon,
  people: UsersIcon,
  taxes: ReceiptIcon,
  payments: WalletIcon,
  account: ShieldCheckIcon,
};

export const ARTICLES: Article[] = [
  {
    id: 'set-up-company',
    title: 'Set up your company',
    category: 'start',
    terms: 'begin new account details',
    href: '#set-up-company',
  },
  {
    id: 'invite-accountant',
    title: 'Invite your accountant',
    category: 'start',
    terms: 'bookkeeper access share',
    href: '#invite-accountant',
  },
  {
    id: 'import-employees',
    title: 'Import employees from a spreadsheet',
    category: 'start',
    terms: 'csv upload staff people',
    href: '#import-employees',
  },
  {
    id: 'pay-schedule',
    title: 'Choose your pay schedule',
    category: 'start',
    terms: 'monthly weekly payday frequency',
    href: '#pay-schedule',
  },
  {
    id: 'connect-bank',
    title: 'Connect your bank',
    category: 'start',
    terms: 'bank account link payments',
    href: '#connect-bank',
  },
  {
    id: 'first-payroll',
    title: 'Run your first payroll',
    category: 'payroll',
    terms: 'pay salaries start',
    href: '#first-payroll',
  },
  {
    id: 'correct-payslip',
    title: 'Correct a payslip after it was sent',
    category: 'payroll',
    terms: 'mistake wrong amount fix edit',
    href: '#correct-payslip',
  },
  {
    id: 'pay-bonus',
    title: 'Pay a bonus outside the usual run',
    category: 'payroll',
    terms: 'extra one-off commission',
    href: '#pay-bonus',
  },
  {
    id: 'undo-run',
    title: 'Undo a payroll run before payday',
    category: 'payroll',
    terms: 'cancel revert mistake',
    href: '#undo-run',
  },
  {
    id: 'preview-payslips',
    title: 'Preview payslips before you approve a run',
    category: 'payroll',
    terms: 'check review draft',
    href: '#preview-payslips',
  },
  {
    id: 'change-payday',
    title: 'Move the payday of one run',
    category: 'payroll',
    terms: 'date holiday earlier',
    href: '#change-payday',
  },
  {
    id: 'payslip-access',
    title: 'Let employees see their payslips',
    category: 'payroll',
    terms: 'portal download send email',
    href: '#payslip-access',
  },
  {
    id: 'new-starter',
    title: 'Add a new starter',
    category: 'people',
    terms: 'hire employee joiner onboarding',
    href: '#new-starter',
  },
  {
    id: 'leaver',
    title: 'Record a leaver and their final pay',
    category: 'people',
    terms: 'resign quit last payslip',
    href: '#leaver',
  },
  {
    id: 'change-salary',
    title: 'Change a salary',
    category: 'people',
    terms: 'raise pay rise rate',
    href: '#change-salary',
  },
  {
    id: 'unpaid-leave',
    title: 'Set up unpaid leave',
    category: 'people',
    terms: 'absence time off',
    href: '#unpaid-leave',
  },
  {
    id: 'home-address',
    title: 'Update a home address',
    category: 'people',
    terms: 'moved contact details',
    href: '#home-address',
  },
  {
    id: 'tax-code',
    title: 'Change a tax code',
    category: 'taxes',
    terms: 'code notice update',
    href: '#tax-code',
  },
  {
    id: 'monthly-return',
    title: 'File the monthly tax return',
    category: 'taxes',
    terms: 'submission filing deadline',
    href: '#monthly-return',
  },
  {
    id: 'year-end',
    title: 'Download a year-end summary',
    category: 'taxes',
    terms: 'annual report payslip totals',
    href: '#year-end',
  },
  {
    id: 'rejected-filing',
    title: 'Fix a rejected filing',
    category: 'taxes',
    terms: 'error refused resubmit',
    href: '#rejected-filing',
  },
  {
    id: 'pension',
    title: 'How pension contributions are worked out',
    category: 'taxes',
    terms: 'retirement deduction',
    href: '#pension',
  },
  {
    id: 'student-loans',
    title: 'Student loan deductions',
    category: 'taxes',
    terms: 'repayment plan',
    href: '#student-loans',
  },
  {
    id: 'change-bank',
    title: 'Change the bank account salaries are paid from',
    category: 'payments',
    terms: 'switch account details',
    href: '#change-bank',
  },
  {
    id: 'pending-payment',
    title: 'Why a payment is still pending',
    category: 'payments',
    terms: 'late delayed not arrived salary',
    href: '#pending-payment',
  },
  {
    id: 'overpayment',
    title: 'Recover an overpayment',
    category: 'payments',
    terms: 'refund paid too much payslip',
    href: '#overpayment',
  },
  {
    id: 'direct-debit',
    title: 'Pay your plan by direct debit',
    category: 'payments',
    terms: 'billing invoice card',
    href: '#direct-debit',
  },
  {
    id: 'two-step',
    title: 'Turn on two-step sign-in',
    category: 'account',
    terms: 'security code login',
    href: '#two-step',
  },
  {
    id: 'another-admin',
    title: 'Add another admin',
    category: 'account',
    terms: 'permissions owner access',
    href: '#another-admin',
  },
  {
    id: 'change-plan',
    title: 'Change your plan',
    category: 'account',
    terms: 'upgrade downgrade price',
    href: '#change-plan',
  },
];

export const POPULAR_IDS = [
  'first-payroll',
  'correct-payslip',
  'new-starter',
  'change-bank',
  'year-end',
];

export const CONTACT = {
  person: 'Dana Whitfield',
  role: 'Support lead',
  lead: 'Dana and the support team answer within one working day.',
  hours: 'Monday to Friday, 8:00 to 18:00 CET',
  chatHref: '#chat',
  emailHref: 'mailto:help@pennywort.example',
};
