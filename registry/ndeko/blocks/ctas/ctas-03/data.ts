export type QueueTask = {
  id: string;
  title: string;
};

export const SECTION = {
  title: 'Start Monday with an empty queue',
  description:
    'Use your work email and Ferrywell sorts the conversations already waiting in your inbox. What it can answer lands in Done before you open the first one.',
  placeholder: 'you@company.com',
  emailLabel: 'Work email',
};

export const QUEUE = {
  title: 'Support queue',
  badge: 'Sample queue',
};

export const TASKS: QueueTask[] = [
  { id: 'refund', title: 'Refund for order 4821' },
  { id: 'password', title: 'Password reset for the Lubumbashi office' },
  { id: 'invoice', title: 'Invoice copy for March' },
  { id: 'delivery', title: 'Delivery to Goma is a day late' },
  { id: 'limits', title: 'Question about the API limits' },
];
