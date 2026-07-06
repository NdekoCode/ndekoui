export type TopicId = 'start' | 'payments' | 'hardware' | 'data';

export type TopicFilter = TopicId | 'all';

export type Topic = {
  id: TopicFilter;
  label: string;
};

export type Question = {
  id: string;
  topic: TopicId;
  question: string;
  answer: string;
};

export const SECTION = {
  title: 'Questions shop owners ask before switching',
  description:
    'Search by a word, narrow by topic and copy the link to any answer.',
  searchLabel: 'Search the questions',
  searchPlaceholder: 'Search the questions',
};

export const TOPICS: Topic[] = [
  { id: 'all', label: 'All' },
  { id: 'start', label: 'Getting started' },
  { id: 'payments', label: 'Payments' },
  { id: 'hardware', label: 'Hardware' },
  { id: 'data', label: 'Your data' },
];

export const PERSON = {
  name: 'Grace Mbuyi',
  firstName: 'Grace',
  role: 'Support lead at Tallymark',
  href: 'mailto:support@tallymark.example',
};

export const QUESTIONS: Question[] = [
  {
    id: 'setup',
    topic: 'start',
    question: 'How long does it take to set up a shop?',
    answer:
      'Most shops sell the same afternoon. Add your products from a spreadsheet, pick a receipt layout and invite the people who work the till.',
  },
  {
    id: 'split',
    topic: 'start',
    question: 'Can a café split one bill between guests?',
    answer:
      'Yes. Open the table, choose Split and share the items by guest or in equal parts. Each guest pays their own way and gets their own receipt.',
  },
  {
    id: 'import',
    topic: 'start',
    question: 'Can I import my products from a spreadsheet?',
    answer:
      'Yes. Upload a CSV with a name, a price and an optional barcode. Tallymark shows what it understood before anything is added.',
  },
  {
    id: 'currencies',
    topic: 'payments',
    question: 'Can I take payments in Congolese francs?',
    answer:
      'Yes. Prices can be set in francs, dollars or both, and the rate of the day is kept on every receipt. A shop in Kinshasa or Lubumbashi can show both on one screen.',
  },
  {
    id: 'refunds',
    topic: 'payments',
    question: 'How do refunds work?',
    answer:
      'Open the sale, choose Refund and pick the items. The money goes back the way it came in, and the stock is added back if you ask for it.',
  },
  {
    id: 'fees',
    topic: 'payments',
    question: 'Does Tallymark charge for card payments?',
    answer:
      'Tallymark adds no fee of its own. The fees of your card provider apply, and each sale lists them.',
  },
  {
    id: 'readers',
    topic: 'hardware',
    question: 'Which card readers work with it?',
    answer:
      'Any reader that speaks the standard protocol of your provider. The setup screen lists the ones it finds nearby.',
  },
  {
    id: 'offline',
    topic: 'hardware',
    question: 'Does the till work without internet?',
    answer:
      'Yes. Sales are saved on the device and sent when the connection returns. Cash and stored-value sales never wait for a signal.',
  },
  {
    id: 'printers',
    topic: 'hardware',
    question: 'Can I print receipts on a thermal printer?',
    answer:
      'Yes, over Bluetooth or a cable. A receipt can also go to the guest by email or message.',
  },
  {
    id: 'export',
    topic: 'data',
    question: 'Can I take my sales history with me?',
    answer:
      'Yes. Export every sale as a CSV or a spreadsheet at any time, with no waiting period.',
  },
  {
    id: 'region',
    topic: 'data',
    question: 'Where is my data kept?',
    answer:
      'In the region you pick when you create the shop. Backups stay in the same region.',
  },
  {
    id: 'staff',
    topic: 'data',
    question: 'Can I limit what my staff see?',
    answer:
      'Yes. Give each person a role: they can sell, refund up to a limit or manage the stock. Reports stay with the owner.',
  },
];
