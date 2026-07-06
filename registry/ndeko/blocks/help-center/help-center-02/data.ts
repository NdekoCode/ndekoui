export type ArticleBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'steps'; items: string[] }
  | { kind: 'note'; text: string; linkLabel: string; href: string };

export type ArticleSection = {
  id: string;
  title: string;
  blocks: ArticleBlock[];
};

export type RelatedArticle = {
  id: string;
  title: string;
  href: string;
};

export const SITE = {
  name: 'Pennywort',
  homeHref: '#',
  helpHref: '#help',
  topicHref: '#running-payroll',
};

export const ARTICLE = {
  title: 'Correct a payslip after it was sent',
  topic: 'Running payroll',
  updated: 'Updated 3 Nov 2026',
  minutes: 4,
  lead: 'A payslip that has gone out cannot be edited, but you can correct it on the next run or with a short correction run of its own. Both keep the history your accountant needs.',
};

export const SECTIONS: ArticleSection[] = [
  {
    id: 'before',
    title: 'Before you start',
    blocks: [
      {
        kind: 'paragraph',
        text: 'Check whether payday has passed. If the money has not left your bank yet, it is quicker to undo the run and run it again with the right figures.',
      },
      {
        kind: 'note',
        text: 'Payday has not passed yet?',
        linkLabel: 'Undo a payroll run before payday',
        href: '#undo-run',
      },
    ],
  },
  {
    id: 'next-run',
    title: 'Correct it on the next run',
    blocks: [
      {
        kind: 'steps',
        items: [
          'Open Payroll and choose the next run.',
          'Select the employee, then choose Add a correction.',
          'Enter the amount that was missing, or the amount paid too much as a negative figure.',
          'Add a note. It is printed on the payslip, so write it for the employee.',
          'Approve the run as usual.',
        ],
      },
    ],
  },
  {
    id: 'pay-now',
    title: 'Pay the difference now',
    blocks: [
      {
        kind: 'paragraph',
        text: 'When someone cannot wait for the next payday, start a correction run from the payslip itself. It pays only the difference, files it with the tax office and sends a short payslip that points to the original.',
      },
    ],
  },
  {
    id: 'employee-view',
    title: 'What the employee sees',
    blocks: [
      {
        kind: 'paragraph',
        text: 'The original payslip stays as it was. The correction appears on the next payslip, or as a payslip of its own, with your note beside the amount.',
      },
    ],
  },
];

export const RELATED: RelatedArticle[] = [
  {
    id: 'undo-run',
    title: 'Undo a payroll run before payday',
    href: '#undo-run',
  },
  {
    id: 'overpayment',
    title: 'Recover an overpayment',
    href: '#overpayment',
  },
  {
    id: 'pay-bonus',
    title: 'Pay a bonus outside the usual run',
    href: '#pay-bonus',
  },
  {
    id: 'preview-payslips',
    title: 'Preview payslips before you approve a run',
    href: '#preview-payslips',
  },
];

export const CONTACT = {
  person: 'Dana Whitfield',
  role: 'Support lead',
  lead: 'Dana and the support team answer within one working day.',
  chatHref: '#chat',
  emailHref: 'mailto:help@pennywort.example',
};
