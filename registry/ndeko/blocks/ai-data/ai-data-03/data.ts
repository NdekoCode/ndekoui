import type { SeriesSlot } from '@/registry/ndeko/lib/agent-run';

/** The person answering the inbox. */
export const ME = { name: 'Lena Brandt' };

export type Agent = {
  name: string;
  series: SeriesSlot;
};

/** The agent that sorted the inbox and wrote the drafts. */
export const WRITER: Agent = { name: 'Writer', series: 3 };

export type TopicId = 'urgent' | 'billing' | 'bugs' | 'questions';

export type Topic = {
  id: TopicId;
  label: string;
};

export const TOPICS: Topic[] = [
  { id: 'urgent', label: 'Urgent' },
  { id: 'billing', label: 'Billing' },
  { id: 'bugs', label: 'Bugs' },
  { id: 'questions', label: 'Questions' },
];

export type Article = {
  id: number;
  title: string;
};

/** Invented help center articles. */
export const ARTICLES: Article[] = [
  { id: 1, title: 'Renew a single sign-on certificate' },
  { id: 2, title: 'When sign-in says session expired' },
  { id: 3, title: 'Why a payment can be taken twice' },
  { id: 4, title: 'When a refund reaches your card' },
  { id: 5, title: 'Change your invoice details' },
  { id: 6, title: 'Monthly or yearly billing' },
  { id: 7, title: 'What happens when a payment fails' },
  { id: 8, title: 'Known issues this week' },
  { id: 9, title: 'Guests and what they can see' },
  { id: 10, title: 'API rate limits' },
  { id: 11, title: 'Export your workspace' },
];

export type Conversation = {
  id: string;
  topic: TopicId;
  customer: string;
  company: string;
  subject: string;
  receivedAgo: string;
  /** Why the agent sorted it under its topic, in a few words. */
  reason: string;
  message: string;
  /** The replies the agent wrote. Regenerate goes from one to the next. */
  drafts: string[];
  /** The help articles the replies are drawn from. */
  sources: number[];
};

/** Invented customers, companies and messages. */
export const CONVERSATIONS: Conversation[] = [
  {
    id: 'locked-out',
    topic: 'urgent',
    customer: 'Ines Marchetti',
    company: 'Halden Works',
    subject: 'Whole team locked out since this morning',
    receivedAgo: '6 min',
    reason: 'Nobody on the team can sign in',
    message:
      'Since 8 this morning none of us can sign in. We get "session expired" right after the password. We have a client demo at 2.',
    drafts: [
      'Hi Ines, sorry for the scare. "Session expired" right after the password means the single sign-on certificate of your workspace has run out. Any admin can renew it under Settings, Security in about a minute. If someone is still kept out after that, clearing the cookie of the app once is enough. Write back if the renewal is greyed out and I will do it from our side.',
      'Hi Ines, this is an expired single sign-on certificate. An admin renews it under Settings, Security and everyone can sign in again right away. One or two people may still see the message because of an old cookie: clearing it once fixes that. I am staying on this thread until your demo is over.',
    ],
    sources: [1, 2],
  },
  {
    id: 'double-charge',
    topic: 'urgent',
    customer: 'Aiko Tanaka',
    company: 'Pallas Robotics',
    subject: 'Charged twice for November',
    receivedAgo: '14 min',
    reason: 'Two charges of the same amount, month end tomorrow',
    message:
      'We were charged twice for November, two payments of $480 on the same card. Please refund one of them today, finance closes the month tomorrow.',
    drafts: [
      'Hi Aiko, you are right: two payments of $480.00 went through for the November invoice. The first attempt timed out at the bank and was sent again, and both were accepted. I am refunding the second one now. It reaches the card in 3 to 5 working days, and a corrected receipt for your finance team is attached.',
      'Hi Aiko, I can see both payments of $480.00 on the November invoice. The bank accepted a retry of a payment it had already taken. The second payment is refunded today and a corrected receipt is attached, so your finance team can close the month with one charge.',
    ],
    sources: [3, 4],
  },
  {
    id: 'vat-number',
    topic: 'billing',
    customer: 'Clara Jensen',
    company: 'Solway Books',
    subject: 'VAT number missing on invoices',
    receivedAgo: '32 min',
    reason: 'Asks to change what the invoices show',
    message:
      'Our invoices do not show our VAT number. Can you add it and send October again?',
    drafts: [
      'Hi Clara, you can add the VAT number under Billing, Invoice details. Every invoice issued after that carries it. For October, open the invoice and choose Reissue: the new copy replaces the old one and keeps the same number.',
      'Hi Clara, the VAT number goes under Billing, Invoice details and shows on every invoice from then on. October can be reissued from the invoice itself, with the same invoice number, so nothing changes for your accountant.',
    ],
    sources: [5],
  },
  {
    id: 'yearly-billing',
    topic: 'billing',
    customer: 'Samuel Okoye',
    company: 'Ironbridge Tools',
    subject: 'Switch to yearly billing',
    receivedAgo: '1 h',
    reason: 'Wants to change the billing period',
    message:
      'We would like to pay yearly from January. Is there a discount, and what happens to the month we already paid?',
    drafts: [
      'Hi Samuel, paying yearly costs ten months instead of twelve. You can switch under Billing, Plan at any time: the days already paid this month are credited against the first yearly invoice, so nothing is paid twice.',
      'Hi Samuel, yes: a year costs the price of ten months. Switch under Billing, Plan when you are ready. What is left of the month you paid comes off the first yearly invoice.',
    ],
    sources: [6],
  },
  {
    id: 'card-declined',
    topic: 'billing',
    customer: 'Rosa Delgado',
    company: 'Verano Foods',
    subject: 'Card declined, are we cut off?',
    receivedAgo: '2 h',
    reason: 'A payment failed twice',
    message:
      'I got two emails saying our card was declined. Are we going to lose access?',
    drafts: [
      'Hi Rosa, nothing is cut off: a workspace stays active for 14 days after a failed payment. The card on file expired last month. Once a new one is saved under Billing, Payment method, the open invoice is paid on its own.',
      'Hi Rosa, you keep full access for 14 days after a failed payment. The reason is simple: the card on file expired last month. Save a new one under Billing, Payment method and the open invoice settles itself.',
    ],
    sources: [7],
  },
  {
    id: 'empty-export',
    topic: 'bugs',
    customer: 'Henrik Aalto',
    company: 'Tidemark Energy',
    subject: 'CSV export comes out empty',
    receivedAgo: '47 min',
    reason: 'A feature that worked until yesterday',
    message:
      'Since yesterday the CSV export of the report page downloads a file with only the header row. The spreadsheet export still works.',
    drafts: [
      'Hi Henrik, thank you for the clear report. Exports whose date range ends today come out empty since yesterday: the fault is on our side and a fix ships tomorrow. Until then, ending the range a day earlier gives the full file.',
      'Hi Henrik, you found a bug of ours: since yesterday a CSV export whose range ends today only holds the header. The fix ships tomorrow. For now, end the range yesterday or use the spreadsheet export.',
    ],
    sources: [8],
  },
  {
    id: 'photo-crash',
    topic: 'bugs',
    customer: 'Greta Lindqvist',
    company: 'Rowan Clinics',
    subject: 'App closes when I attach a photo',
    receivedAgo: '3 h',
    reason: 'A crash with the steps to reproduce it',
    message:
      'On my phone the app closes every time I attach a photo to a note. It started with version 4.2.',
    drafts: [
      'Hi Greta, sorry about that. Version 4.2 closes when a photo is larger than 10 MB. Version 4.2.1 fixes it and reaches every phone this week. Until then, the Medium photo size in the camera settings avoids the problem.',
      'Hi Greta, this is a fault of version 4.2 with photos over 10 MB. The fix is in 4.2.1, out this week. Choosing the Medium photo size in the camera settings keeps you going until it arrives.',
    ],
    sources: [8],
  },
  {
    id: 'client-guest',
    topic: 'questions',
    customer: 'Nadia Rahman',
    company: 'Aster Studio',
    subject: 'Can a client see only one project?',
    receivedAgo: '1 h',
    reason: 'A how-to question about access',
    message:
      'Can I invite a client so they only see one project and nothing else?',
    drafts: [
      'Hi Nadia, yes. Invite them as a guest and pick the project when you send the invitation. A guest sees that project only, cannot see who works on the others, and does not count as a paid seat.',
      'Hi Nadia, that is what guests are for. Choose Guest when you invite the client and pick the one project. They see nothing else, and guests are free.',
    ],
    sources: [9],
  },
  {
    id: 'rate-limits',
    topic: 'questions',
    customer: 'Felix Hartmann',
    company: 'Corvid Security',
    subject: 'What are the API rate limits?',
    receivedAgo: '4 h',
    reason: 'Asks for a figure from the docs',
    message:
      'What are the rate limits of the API? We plan a nightly sync of about 40,000 records.',
    drafts: [
      'Hi Felix, the limit is 600 requests a minute for a workspace, and a bulk request counts as 10. Above it the API answers 429 with a Retry-After header. A nightly sync of 40,000 records fits well inside it with the bulk endpoints.',
      'Hi Felix, 600 requests a minute per workspace, a bulk request counting as 10. With the bulk endpoints your 40,000 records take a few minutes. When the limit is reached the answer is a 429 that says how long to wait.',
    ],
    sources: [10],
  },
  {
    id: 'full-export',
    topic: 'questions',
    customer: 'Elena Petrova',
    company: 'Larkspur Media',
    subject: 'How do I export everything?',
    receivedAgo: '5 h',
    reason: 'A how-to question about exports',
    message:
      'How do I export everything we have in the workspace, files included?',
    drafts: [
      'Hi Elena, an owner can export the whole workspace under Settings, Data, Export. You receive one archive with every project as CSV and the files in folders, usually within the hour.',
      'Hi Elena, go to Settings, Data, Export as an owner of the workspace. The archive holds every project as CSV with its files beside it, and a link reaches you by email when it is ready.',
    ],
    sources: [11],
  },
];

const FALLBACK_CONVERSATION = CONVERSATIONS[0];

export function conversationOf(id: string) {
  const conversation = CONVERSATIONS.find((candidate) => candidate.id === id);
  return conversation ?? FALLBACK_CONVERSATION;
}

export function articlesOf(conversation: Conversation) {
  return ARTICLES.filter((article) =>
    conversation.sources.includes(article.id)
  );
}

export function topicLabelOf(id: TopicId) {
  const topic = TOPICS.find((candidate) => candidate.id === id);
  return topic?.label ?? '';
}
