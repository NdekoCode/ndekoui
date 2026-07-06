import {
  ClockIcon,
  GlobeIcon,
  type Icon,
  LinkedinBrandIcon,
  MailIcon,
  TwitterXIcon,
} from '@/registry/ndeko/lib/icons';

export const CONTACT_ANCHOR = 'contact';

export type NavLink = {
  id: string;
  label: string;
  href: string;
};

export const NAV_LINKS: NavLink[] = [
  { id: 'features', label: 'Features', href: '#' },
  { id: 'pricing', label: 'Pricing', href: '#' },
  { id: 'docs', label: 'Docs', href: '#' },
  { id: 'contact', label: 'Contact', href: `#${CONTACT_ANCHOR}` },
];

export const CURRENT_LINK_ID: string | null = 'contact';

export const HEADER = {
  tagline: 'A shared inbox that stays calm on a busy Monday',
  action: 'Ask for a trial',
  actionHref: `#${CONTACT_ANCHOR}`,
};

export type ContactDetail = {
  icon: Icon;
  label: string;
  value: string;
  href?: string;
};

export const CONTACT = {
  title: 'Talk to the people who build Driftdesk',
  description:
    'Tell us how your team answers customers today. We reply with a setup that fits, and a trial workspace if you want one.',
};

export const CONTACT_DETAILS: ContactDetail[] = [
  {
    icon: MailIcon,
    label: 'Email',
    value: 'sales@driftdesk.example',
    href: 'mailto:sales@driftdesk.example',
  },
  {
    icon: ClockIcon,
    label: 'Reply time',
    value: 'Within one working day, Monday to Friday',
  },
  {
    icon: GlobeIcon,
    label: 'Team',
    value: 'Kinshasa, Lisbon and Nairobi',
  },
];

export const TEAM_SIZES = [
  { value: '1-10', label: '1 to 10 people' },
  { value: '11-50', label: '11 to 50 people' },
  { value: '51-200', label: '51 to 200 people' },
  { value: '201+', label: 'More than 200 people' },
];

export type Question = {
  id: string;
  question: string;
  answer: string;
};

export type QuestionGroup = {
  id: string;
  title: string;
  questions: Question[];
};

export const FAQ = {
  title: 'Questions teams ask before switching',
  description:
    'Short answers about moving to Driftdesk. If yours is missing, the support team answers it by email.',
  contactLabel: 'Write to support',
  contactHref: 'mailto:support@driftdesk.example',
};

export const QUESTION_GROUPS: QuestionGroup[] = [
  {
    id: 'marketing-05-getting-started',
    title: 'Getting started',
    questions: [
      {
        id: 'import',
        question: 'Can we bring our old conversations with us?',
        answer:
          'Yes. Connect your current inbox and Driftdesk imports the last twelve months of conversations, with their tags and their authors.',
      },
      {
        id: 'setup',
        question: 'How long does the setup take?',
        answer:
          'Forwarding your support address and inviting the team is enough to start. Routing rules and saved replies can come later.',
      },
      {
        id: 'channels',
        question: 'Which channels can we answer from Driftdesk?',
        answer:
          'Email, the chat widget on your site and contact forms. Each conversation keeps its channel, so replies leave the way the message came in.',
      },
    ],
  },
  {
    id: 'marketing-05-billing',
    title: 'Billing',
    questions: [
      {
        id: 'seats',
        question: 'Do we pay for people who only read?',
        answer:
          'No. A seat is someone who replies to customers. Teammates who read conversations and leave private notes are free.',
      },
      {
        id: 'cancel',
        question: 'What happens to our data if we cancel?',
        answer:
          'You can export every conversation as CSV or JSON for thirty days after cancelling. After that the workspace is deleted.',
      },
    ],
  },
  {
    id: 'marketing-05-security',
    title: 'Data and security',
    questions: [
      {
        id: 'storage',
        question: 'Where are conversations stored?',
        answer:
          'In the region you pick when you create the workspace. Attachments stay in the same region as the messages they belong to.',
      },
      {
        id: 'access',
        question: 'Can we limit who sees which inbox?',
        answer:
          'Yes. Each inbox has its own members, and an admin can hide an inbox from everyone who is not on it.',
      },
    ],
  },
];

export type FooterLink = {
  label: string;
  href: string;
  isCurrent?: boolean;
};

export type SocialLink = {
  label: string;
  href: string;
  icon: Icon;
};

export const BRAND = {
  name: 'Driftdesk',
  copyright: '© 2026 Driftdesk',
};

export const FOOTER_LINKS: FooterLink[] = [
  { label: 'Features', href: '#' },
  { label: 'Pricing', href: '#' },
  { label: 'Docs', href: '#' },
  { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' },
  { label: 'Contact', href: `#${CONTACT_ANCHOR}`, isCurrent: true },
];

export const SOCIAL_LINKS: SocialLink[] = [
  { label: 'Driftdesk on LinkedIn', href: '#', icon: LinkedinBrandIcon },
  { label: 'Driftdesk on X', href: '#', icon: TwitterXIcon },
];
