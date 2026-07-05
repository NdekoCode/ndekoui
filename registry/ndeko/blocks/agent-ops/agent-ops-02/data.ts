import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';

type Prompt = {
  name: string;
  team: string;
  /** A family without a version number. */
  model: string;
  brand: BrandSlug;
};

export const PROMPT: Prompt = {
  name: 'Support reply',
  team: 'Solway Books support',
  model: 'Claude Sonnet',
  brand: 'claude',
};

export type TargetId = 'production' | 'candidate';

export type Target = {
  id: TargetId;
  label: string;
  version: string;
};

export const TARGETS: Record<TargetId, Target> = {
  production: { id: 'production', label: 'Production', version: 'v12' },
  candidate: { id: 'candidate', label: 'Candidate', version: 'v13' },
};

export type Outcome = 'pass' | 'fail' | 'flaky';

export type Output = {
  outcome: Outcome;
  text: string;
  /** The part of the text the grader points at. */
  marked?: string;
  /** What the grader said about a result that is not a plain pass. */
  note?: string;
  tokens: number;
  costUsd: number;
};

export type EvalCase = {
  id: string;
  name: string;
  input: string;
  expected: string;
  production: Output;
  candidate: Output;
};

/** Customer messages and replies written for this demo. Tokens and costs are illustrative. */
export const CASES: EvalCase[] = [
  {
    id: 'refund-in-window',
    name: 'Refund inside 30 days',
    input: 'I bought the atlas 12 days ago and I would like my money back.',
    expected: 'Offers the refund and says it takes 5 to 7 business days.',
    production: {
      outcome: 'pass',
      text: 'You are inside the 30 day window, so I have started the refund. It takes 5 to 7 business days to reach your card.',
      tokens: 412,
      costUsd: 0.004,
    },
    candidate: {
      outcome: 'pass',
      text: 'I have started your refund. Expect it on your card in 5 to 7 business days.',
      tokens: 371,
      costUsd: 0.004,
    },
  },
  {
    id: 'refund-late',
    name: 'Refund after 30 days',
    input: 'Can I return a cookbook I bought in March?',
    expected: 'Explains the 30 day window and offers store credit.',
    production: {
      outcome: 'pass',
      text: 'Returns close after 30 days, so a refund is not possible. I can offer store credit for the full price instead.',
      tokens: 398,
      costUsd: 0.004,
    },
    candidate: {
      outcome: 'pass',
      text: 'The 30 day window has passed. I can give you store credit for the full price if that helps.',
      tokens: 362,
      costUsd: 0.004,
    },
  },
  {
    id: 'damaged-order',
    name: 'Order arrived damaged',
    input: 'The cover of my book arrived torn. What now?',
    expected: 'Apologises, asks for a photo and offers a replacement.',
    production: {
      outcome: 'pass',
      text: 'I am sorry about the torn cover. Send me a photo and I will ship a replacement today.',
      tokens: 344,
      costUsd: 0.003,
    },
    candidate: {
      outcome: 'flaky',
      text: 'Sorry about that. I will ship a replacement today.',
      note: 'Passed 2 of 3 runs. One run did not ask for a photo.',
      tokens: 318,
      costUsd: 0.003,
    },
  },
  {
    id: 'asks-human',
    name: 'Asks for a person',
    input: 'I want to talk to a real person please.',
    expected: 'Hands over to the support team and gives the opening hours.',
    production: {
      outcome: 'fail',
      text: 'I can help you with most questions right here. What is it about?',
      marked: 'I can help you with most questions right here.',
      note: 'The reply keeps the customer instead of handing over.',
      tokens: 301,
      costUsd: 0.003,
    },
    candidate: {
      outcome: 'pass',
      text: 'Of course. I have passed your conversation to the team. They answer on weekdays from 9 to 17.',
      tokens: 356,
      costUsd: 0.004,
    },
  },
  {
    id: 'change-address',
    name: 'Change the delivery address',
    input: 'I moved last week. Can you send order SB-20388 to my new place?',
    expected: 'Changes the address if the order has not shipped.',
    production: {
      outcome: 'pass',
      text: 'Order SB-20388 has not shipped yet, so I have updated the address. You will get a new confirmation.',
      tokens: 420,
      costUsd: 0.004,
    },
    candidate: {
      outcome: 'pass',
      text: 'Done. SB-20388 had not shipped, so it now goes to your new address.',
      tokens: 377,
      costUsd: 0.004,
    },
  },
  {
    id: 'double-charge',
    name: 'Charged twice',
    input: 'My card shows two payments for order SB-20418.',
    expected:
      'Refunds the second payment and says it takes 5 to 7 business days.',
    production: {
      outcome: 'pass',
      text: 'I found the second payment and refunded it. It takes 5 to 7 business days to show on your card.',
      tokens: 433,
      costUsd: 0.004,
    },
    candidate: {
      outcome: 'fail',
      text: 'I found the second payment and refunded it. You will see it on your statement in a few days.',
      marked: 'in a few days',
      note: 'The reply leaves out the 5 to 7 business days of the policy.',
      tokens: 391,
      costUsd: 0.004,
    },
  },
  {
    id: 'gift-card',
    name: 'Gift card balance',
    input: 'How much is left on my gift card?',
    expected: 'Asks for the last 4 digits of the card, then gives the balance.',
    production: {
      outcome: 'pass',
      text: 'Happy to check. What are the last 4 digits of the card?',
      tokens: 287,
      costUsd: 0.003,
    },
    candidate: {
      outcome: 'fail',
      text: 'You can see the balance at any time on solwaybooks.example/gift-cards, signed in with the email the card was sent to.',
      marked:
        'You can see the balance at any time on solwaybooks.example/gift-cards',
      note: 'The reply sends a link instead of asking for the card digits.',
      tokens: 342,
      costUsd: 0.003,
    },
  },
  {
    id: 'cancel-preorder',
    name: 'Cancel a pre-order',
    input: 'Please cancel my pre-order of the winter anthology.',
    expected: 'Cancels the pre-order and confirms nothing was charged.',
    production: {
      outcome: 'pass',
      text: 'Your pre-order is cancelled. Nothing was charged, so there is no refund to wait for.',
      tokens: 352,
      costUsd: 0.004,
    },
    candidate: {
      outcome: 'pass',
      text: 'Cancelled. Pre-orders are only charged on release, so you paid nothing.',
      tokens: 329,
      costUsd: 0.003,
    },
  },
  {
    id: 'late-parcel',
    name: 'Angry about a late parcel',
    input: 'Three weeks and still nothing. This is a joke.',
    expected:
      'Apologises first, then gives the tracking state and a next step.',
    production: {
      outcome: 'fail',
      text: 'Your parcel left the warehouse on the 4th. Delivery times vary by courier.',
      marked: 'Delivery times vary by courier.',
      note: 'No apology and no next step.',
      tokens: 338,
      costUsd: 0.003,
    },
    candidate: {
      outcome: 'pass',
      text: 'I am sorry, three weeks is too long. The parcel is stuck at the depot, so I am sending a new one today by express.',
      tokens: 402,
      costUsd: 0.004,
    },
  },
  {
    id: 'vat-invoice',
    name: 'Invoice with a VAT number',
    input: 'I need an invoice with our VAT number for order SB-20455.',
    expected: 'Asks for the VAT number and sends the corrected invoice.',
    production: {
      outcome: 'pass',
      text: 'Send me the VAT number and I will issue a corrected invoice for SB-20455 right away.',
      tokens: 366,
      costUsd: 0.004,
    },
    candidate: {
      outcome: 'pass',
      text: 'Share the VAT number and I will send a corrected invoice for SB-20455.',
      tokens: 331,
      costUsd: 0.003,
    },
  },
  {
    id: 'spanish',
    name: 'Writes in Spanish',
    input: 'Hola, mi pedido no ha llegado todavía.',
    expected: 'Answers in Spanish with the tracking state.',
    production: {
      outcome: 'pass',
      text: 'Hola. Tu pedido salió ayer del almacén y llega el jueves.',
      tokens: 359,
      costUsd: 0.004,
    },
    candidate: {
      outcome: 'pass',
      text: 'Hola. Tu pedido salió ayer y llegará el jueves.',
      tokens: 334,
      costUsd: 0.003,
    },
  },
  {
    id: 'delete-account',
    name: 'Delete my account',
    input: 'Please delete my account and everything you hold about me.',
    expected: 'Confirms the request and says deletion takes up to 30 days.',
    production: {
      outcome: 'pass',
      text: 'I have filed your deletion request. Your account and data are removed within 30 days.',
      tokens: 371,
      costUsd: 0.004,
    },
    candidate: {
      outcome: 'pass',
      text: 'Your deletion request is filed. Everything is removed within 30 days.',
      tokens: 340,
      costUsd: 0.003,
    },
  },
];

export const FIRST_REGRESSION = 'double-charge';

export const SECOND_REGRESSION = 'gift-card';

export function caseOf(id: string) {
  const found = CASES.find((candidate) => candidate.id === id);
  return found ?? CASES[0];
}
