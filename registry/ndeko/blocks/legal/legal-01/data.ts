export type ContentBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: { term: string; text: string }[] };

export type LegalSection = {
  id: string;
  title: string;
  blocks: ContentBlock[];
};

export type LegalDocument = {
  id: string;
  title: string;
  effective: string;
  summary: string[];
  sections: LegalSection[];
};

export const PAGE = {
  eyebrow: 'Legal',
  title: 'Policies for Brightloom',
  description:
    'The terms that apply when you use Brightloom, and how we handle the data you put in it.',
  notice: 'Example text for a fictional company. It is not legal advice.',
  contact: 'privacy@brightloom.example',
};

export const DOCUMENTS: LegalDocument[] = [
  {
    id: 'terms',
    title: 'Terms of service',
    effective: 'March 1, 2026',
    summary: [
      'You own what you put in Brightloom. We use it only to run the service for you.',
      'Paid plans renew until you cancel, and cancelling stops the next charge.',
      'We can suspend an account that breaks these terms, and we tell you why.',
    ],
    sections: [
      {
        id: 'account',
        title: 'Your account',
        blocks: [
          {
            kind: 'paragraph',
            text: 'You need an account to use Brightloom. Keep your sign-in details to yourself and tell us at once if you think someone else has used them.',
          },
          {
            kind: 'paragraph',
            text: 'You are responsible for what happens in your workspace, including the actions of the people you invite to it.',
          },
        ],
      },
      {
        id: 'content',
        title: 'Your content',
        blocks: [
          {
            kind: 'paragraph',
            text: 'Boards, files and comments you add stay yours. You allow us to store, copy and display them only as far as running Brightloom for you and the people you share them with requires.',
          },
          {
            kind: 'paragraph',
            text: 'Content you delete leaves our live systems within 30 days and our backups within 90.',
          },
        ],
      },
      {
        id: 'payment',
        title: 'Plans and payment',
        blocks: [
          {
            kind: 'paragraph',
            text: 'Paid plans are billed in advance, monthly or yearly. The price, with the taxes we have to collect, is shown before you pay.',
          },
          {
            kind: 'paragraph',
            text: 'If a payment fails, we try again for 14 days before moving the workspace to the free plan. Nothing is deleted when that happens.',
          },
        ],
      },
      {
        id: 'use',
        title: 'Acceptable use',
        blocks: [
          {
            kind: 'paragraph',
            text: 'Do not use Brightloom to break the law, to send unsolicited messages in bulk, to probe or overload our systems, or to store material you have no right to share. We may remove content that breaks this section.',
          },
        ],
      },
      {
        id: 'ending',
        title: 'Ending the agreement',
        blocks: [
          {
            kind: 'paragraph',
            text: 'You can close your workspace at any time from its settings. We may suspend or close an account that seriously or repeatedly breaks these terms. We will tell you why and, where we can, give you time to export your data first.',
          },
        ],
      },
      {
        id: 'changes',
        title: 'Changes to these terms',
        blocks: [
          {
            kind: 'paragraph',
            text: 'When a change affects you, we email workspace owners at least 30 days before it takes effect. The date at the top of this page always shows the version in force.',
          },
        ],
      },
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy policy',
    effective: 'February 12, 2026',
    summary: [
      'We collect what you give us and what the service needs to run. Nothing is sold.',
      'A workspace’s content stays in the region its owner picked.',
      'You can export or delete your data whenever you want.',
    ],
    sections: [
      {
        id: 'collect',
        title: 'What we collect',
        blocks: [
          {
            kind: 'list',
            items: [
              {
                term: 'Account details',
                text: 'your name, your email address and your password, stored as a salted hash.',
              },
              {
                term: 'Workspace content',
                text: 'the boards, cards, files and comments you create.',
              },
              {
                term: 'Usage data',
                text: 'pages visited, features used, device type and an approximate location from your IP address.',
              },
              {
                term: 'Billing details',
                text: 'handled by our payment processor. We keep the last four digits and the expiry date only.',
              },
            ],
          },
        ],
      },
      {
        id: 'purpose',
        title: 'How we use it',
        blocks: [
          {
            kind: 'paragraph',
            text: 'To run and secure Brightloom, to answer support requests, to send the emails you asked for and the ones the service needs, such as receipts and security alerts, and to learn which features are used so we can improve them.',
          },
          {
            kind: 'paragraph',
            text: 'We do not sell personal data and we do not use workspace content to train models.',
          },
        ],
      },
      {
        id: 'sharing',
        title: 'Who we share it with',
        blocks: [
          {
            kind: 'paragraph',
            text: 'A short list of processors that host, email and bill on our behalf, each bound by a data processing agreement. The current list, with what each one does and where, is available on request.',
          },
        ],
      },
      {
        id: 'storage',
        title: 'Where it is stored',
        blocks: [
          {
            kind: 'paragraph',
            text: 'Owners choose the European Union or the United States when they create a workspace, and its content stays in that region. Support staff can reach it from elsewhere only with your permission, for the length of one support request.',
          },
        ],
      },
      {
        id: 'retention',
        title: 'How long we keep it',
        blocks: [
          {
            kind: 'paragraph',
            text: 'As long as your account is open. After you close it, content is deleted within 30 days and backups within 90. Invoices are kept for as long as tax law requires.',
          },
        ],
      },
      {
        id: 'rights',
        title: 'Your rights',
        blocks: [
          {
            kind: 'paragraph',
            text: 'You can see, correct, export or delete your personal data from your account settings, or by writing to the address below. We answer within 30 days. You can also complain to your local data protection authority.',
          },
        ],
      },
    ],
  },
  {
    id: 'cookies',
    title: 'Cookie policy',
    effective: 'February 12, 2026',
    summary: [
      'The app sets only the cookies it needs to keep you signed in.',
      'The marketing site asks before it measures anything.',
    ],
    sections: [
      {
        id: 'needed',
        title: 'Cookies we always set',
        blocks: [
          {
            kind: 'paragraph',
            text: 'A session cookie keeps you signed in, and a security cookie protects forms from forged requests. Both expire when you sign out or after 30 days, and turning them off breaks sign-in.',
          },
        ],
      },
      {
        id: 'optional',
        title: 'Cookies you can refuse',
        blocks: [
          {
            kind: 'paragraph',
            text: 'On the marketing site only, an audience measurement cookie counts visits without identifying you. It is set after you accept it in the banner, and you can change that choice from the link at the bottom of every page.',
          },
        ],
      },
      {
        id: 'removing',
        title: 'Removing cookies',
        blocks: [
          {
            kind: 'paragraph',
            text: 'Your browser can list and delete cookies at any time. Deleting the session cookie signs you out.',
          },
        ],
      },
    ],
  },
];
