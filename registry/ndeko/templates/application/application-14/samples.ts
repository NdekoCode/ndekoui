import type { Step, StepKind } from './model';

export type SampleId = 'delivery' | 'refund';

/** What an approval asks a person for when this sample reaches it. */
export type SampleRequest = {
  amount: string;
  order: string;
  item: string;
  /** How the live region names it: "refund of 34.90 EUR". */
  spoken: string;
};

export type SampleFailure = {
  stepId: string;
  error: string;
};

export type Sample = {
  id: SampleId;
  from: string;
  address: string;
  subject: string;
  body: string;
  /** What the email is about. A branch takes the output that carries this label. */
  topic: string;
  runLabel: string;
  reply: string;
  replyIfDenied: string;
  request: SampleRequest | null;
  /** A step that fails on its first try with this sample. Kestrel Post is invented, so the failure names no real product. */
  failure: SampleFailure | null;
};

const REFUND = {
  amount: '34.90 EUR',
  order: 'AB-20874',
  item: 'Hedge shears, 60 cm',
};

const DELIVERY_BODY = 'Where is my order AB-20931? It was due on Tuesday.';

const REFUND_BODY =
  'The hedge shears came with a bent blade. I would like a refund for order AB-20874.';

/** Two invented customers of an invented shop. */
const SAMPLES: Sample[] = [
  {
    id: 'delivery',
    from: 'Tamsin Okoro',
    address: 'tamsin.okoro@fernhill.example',
    subject: 'Where is my order?',
    body: DELIVERY_BODY,
    topic: 'Delivery',
    runLabel: 'Run with a delivery question',
    reply:
      'Hello Tamsin, your order AB-20931 left our depot on Monday and is on its way with Kestrel Post. It should reach you on Thursday, two days later than planned. We are sorry for the wait. The Alderbank team',
    replyIfDenied:
      'Hello Tamsin, thank you for your message about order AB-20931. A member of our team will follow up with you today. The Alderbank team',
    request: null,
    failure: { stepId: 'track', error: 'Carrier did not answer' },
  },
  {
    id: 'refund',
    from: 'Jonas Lindqvist',
    address: 'jonas.lindqvist@marlowe.example',
    subject: 'Damaged hedge shears',
    body: REFUND_BODY,
    topic: 'Refund',
    runLabel: 'Run with a refund request',
    reply:
      'Hello Jonas, we are sorry the hedge shears arrived with a bent blade. We refunded 34.90 EUR to your card, and you can keep the pair. The money shows within a few days. The Alderbank team',
    replyIfDenied:
      'Hello Jonas, thank you for telling us about the hedge shears. A member of our team will follow up on your refund today. The Alderbank team',
    request: {
      amount: REFUND.amount,
      order: `Order ${REFUND.order}`,
      item: REFUND.item,
      spoken: `refund of ${REFUND.amount}`,
    },
    failure: null,
  },
];

export function samplePressKeyOf(id: SampleId) {
  return `sample-${id}`;
}

export function sampleOf(id: SampleId) {
  const sample = SAMPLES.find((candidate) => candidate.id === id);
  return sample ?? SAMPLES[0];
}

export function otherSampleOf(id: SampleId) {
  const other = SAMPLES.find((candidate) => candidate.id !== id);
  return other ?? SAMPLES[0];
}

/** What a step took and gave in a run. `text` is what an agent wrote, for the ones that write prose. */
export type StepResult = {
  ms: number;
  usd: number;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  text?: string;
};

export const FAILED_TRY_MS = 700;

const DELIVERY_RESULTS: Record<string, StepResult> = {
  trigger: {
    ms: 300,
    usd: 0,
    input: { mailbox: 'support@alderbank.example' },
    output: {
      from: 'tamsin.okoro@fernhill.example',
      subject: 'Where is my order?',
      body: DELIVERY_BODY,
    },
  },
  classify: {
    ms: 1000,
    usd: 0.002,
    input: { subject: 'Where is my order?', body: DELIVERY_BODY },
    output: { label: 'Delivery', order: 'AB-20931' },
  },
  route: {
    ms: 200,
    usd: 0,
    input: { topic: 'Delivery' },
    output: { taken: 'Delivery' },
  },
  track: {
    ms: 800,
    usd: 0,
    input: { order: 'AB-20931' },
    output: { status: 'In transit', due: 'Thursday' },
  },
  draft: {
    ms: 1100,
    usd: 0.003,
    input: { status: 'In transit', due: 'Thursday' },
    output: {},
    text: 'Your parcel left our depot on Monday and is on its way with Kestrel Post. It should reach you on Thursday.',
  },
  write: {
    ms: 0,
    usd: 0.005,
    input: { topic: 'Delivery', order: 'AB-20931', status: 'In transit' },
    output: {},
  },
  send: {
    ms: 400,
    usd: 0,
    input: { to: 'tamsin.okoro@fernhill.example' },
    output: { sent: true },
  },
};

const REFUND_RESULTS: Record<string, StepResult> = {
  trigger: {
    ms: 300,
    usd: 0,
    input: { mailbox: 'support@alderbank.example' },
    output: {
      from: 'jonas.lindqvist@marlowe.example',
      subject: 'Damaged hedge shears',
      body: REFUND_BODY,
    },
  },
  classify: {
    ms: 1000,
    usd: 0.002,
    input: { subject: 'Damaged hedge shears', body: REFUND_BODY },
    output: { label: 'Refund', order: REFUND.order },
  },
  route: {
    ms: 200,
    usd: 0,
    input: { topic: 'Refund' },
    output: { taken: 'Refund' },
  },
  find: {
    ms: 700,
    usd: 0,
    input: { order: REFUND.order },
    output: { id: REFUND.order, total: REFUND.amount, item: REFUND.item },
  },
  ask: {
    ms: 0,
    usd: 0,
    input: { amount: REFUND.amount, order: REFUND.order },
    output: {},
  },
  issue: {
    ms: 900,
    usd: 0,
    input: { payment: REFUND.order, amount: REFUND.amount },
    output: { amount: REFUND.amount, status: 'Refunded' },
  },
  write: {
    ms: 0,
    usd: 0.005,
    input: { topic: 'Refund', order: REFUND.order },
    output: {},
  },
  send: {
    ms: 400,
    usd: 0,
    input: { to: 'jonas.lindqvist@marlowe.example' },
    output: { sent: true },
  },
};

const RESULTS: Record<SampleId, Partial<Record<string, StepResult>>> = {
  delivery: DELIVERY_RESULTS,
  refund: REFUND_RESULTS,
};

const PASSED_ON = { from: 'The step before' };

/** What a step added on the canvas takes and gives: a test run has no recorded result for it. */
const KIND_RESULT: Record<StepKind, StepResult> = {
  trigger: { ms: 300, usd: 0, input: {}, output: { received: true } },
  agent: {
    ms: 1200,
    usd: 0.002,
    input: PASSED_ON,
    output: {},
    text: 'A sample answer. A real run writes its own here.',
  },
  branch: { ms: 200, usd: 0, input: PASSED_ON, output: {} },
  approval: { ms: 0, usd: 0, input: PASSED_ON, output: {} },
  tool: { ms: 700, usd: 0, input: PASSED_ON, output: { ok: true } },
  output: { ms: 400, usd: 0, input: PASSED_ON, output: { sent: true } },
  wait: { ms: 300, usd: 0, input: {}, output: { waited: false } },
  loop: { ms: 300, usd: 0, input: PASSED_ON, output: { rounds: 1 } },
};

export function resultOf(sample: Sample, step: Step) {
  const recorded = RESULTS[sample.id][step.id];
  return recorded ?? KIND_RESULT[step.kind];
}
