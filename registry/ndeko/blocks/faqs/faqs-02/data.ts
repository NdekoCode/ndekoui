export type Question = {
  id: string;
  question: string;
  answer: string;
};

export const SECTION = {
  title: 'Questions about Fernpost',
  description: 'What writers ask most before sending their first issue',
};

export const QUESTIONS: Question[] = [
  {
    id: 'import',
    question: 'Can I bring my subscribers from another service?',
    answer:
      'Yes. Upload a CSV or connect your old account. Subscribers keep their sign-up date, and anyone who unsubscribed before stays unsubscribed.',
  },
  {
    id: 'domain',
    question: 'Do issues go out from my own domain?',
    answer:
      'On both plans. Add two DNS records and Fernpost checks them for you. Until then, issues are sent from a shared Fernpost address.',
  },
  {
    id: 'paid',
    question: 'Can readers pay for some issues?',
    answer:
      'On Studio. Mark an issue as paid and free subscribers receive a preview with a link to subscribe.',
  },
  {
    id: 'archive',
    question: 'Is there a public archive?',
    answer:
      'Every newsletter gets a web archive you can turn off. Paid issues stay behind the subscription there too.',
  },
  {
    id: 'leave',
    question: 'What happens if I leave?',
    answer:
      'Export your subscribers and every issue as HTML at any time. Nothing is deleted until you close the account yourself.',
  },
];

export const CONTACT = {
  person: { name: 'Lucia Ferro', image: '/avatars/avatar-05.svg' },
  lead: 'Still wondering about something?',
  linkLabel: 'Write to hello@fernpost.example',
  href: 'mailto:hello@fernpost.example',
  tail: 'and a person from the team answers.',
};
