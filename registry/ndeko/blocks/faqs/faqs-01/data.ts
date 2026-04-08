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

export const SECTION = {
  title: 'Questions teams ask before switching',
  description:
    'Short answers about moving to Driftdesk. If yours is missing, the support team answers it by email.',
  contactLabel: 'Write to support',
  contactHref: 'mailto:support@driftdesk.example',
};

export const QUESTION_GROUPS: QuestionGroup[] = [
  {
    id: 'faqs-01-getting-started',
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
    id: 'faqs-01-billing',
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
    id: 'faqs-01-security',
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
