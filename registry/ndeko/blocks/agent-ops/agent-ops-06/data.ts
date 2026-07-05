export type EventName =
  'run.completed' | 'run.failed' | 'approval.requested' | 'tool.called';

export const EVENT_NAMES: EventName[] = [
  'run.completed',
  'run.failed',
  'approval.requested',
  'tool.called',
];

export type HourBucket = {
  ok: number;
  failed: number;
};

export type Endpoint = {
  id: string;
  url: string;
  events: EventName[];
  secret: string;
  /** Deliveries of the last 24 hours, oldest hour first. */
  hours: HourBucket[];
};

const HOURS = 24;

/** The shape of a working day: quiet at night, busy from mid-morning. */
const DAY_WAVE = [
  0.2, 0.15, 0.1, 0.1, 0.15, 0.3, 0.5, 0.75, 0.9, 1, 0.95, 0.85, 0.9, 1, 0.95,
  0.85, 0.75, 0.6, 0.5, 0.45, 0.4, 0.35, 0.3, 0.25,
];

function hoursOf(
  peak: number,
  shift: number,
  failedByHour: Record<number, number>
) {
  return DAY_WAVE.map((_, hour): HourBucket => {
    const wave = DAY_WAVE[(hour + shift) % HOURS];
    const total = Math.max(1, Math.round(peak * wave));
    const failed = Math.min(total, failedByHour[hour] ?? 0);
    return { ok: total - failed, failed };
  });
}

/** Invented endpoints and secrets. The figures are illustrative. */
export const ENDPOINTS: Endpoint[] = [
  {
    id: 'calder',
    url: 'https://api.calderfreight.example/hooks/agents',
    events: ['run.completed', 'run.failed', 'approval.requested'],
    secret: 'whsec_7Qm2xN4kVt9LpR3sWb8YcA6dHf1a91f',
    hours: hoursOf(42, 0, {}),
  },
  {
    id: 'juniper',
    url: 'https://ops.juniperhealth.example/webhooks/runs',
    events: ['run.failed'],
    secret: 'whsec_Zt5uG8jMq1XnB4vC7kLw2SeP9yD3c07',
    hours: hoursOf(9, 3, { 22: 2, 23: 1 }),
  },
  {
    id: 'pinecrest',
    url: 'https://hooks.pinecrest.example/agent-events',
    events: ['run.completed', 'tool.called'],
    secret: 'whsec_Hd3fK9pW2rT6mJ8xQ1zN5bV4cL7e5d2',
    hours: hoursOf(118, 6, { 9: 1 }),
  },
];

/** The secrets handed out by Create and by Rotate, in order. */
export const NEW_SECRETS = [
  'whsec_Rb6nY2wE8qU4tK1mS9xF3vJ7pA5g2b8',
  'whsec_Lc4jP7sD1hX9zM3aQ6uW8eT2yN5k4f1',
  'whsec_Vg8mB5rC2nH7kT4dZ1qJ9wS3xE6p7a3',
];

export type DeliveryStatus = 'done' | 'failed' | 'pending';

export type Delivery = {
  id: string;
  endpointId: string;
  event: EventName;
  status: DeliveryStatus;
  /** The HTTP status the endpoint answered with; none while the delivery is on its way. */
  code: number | null;
  time: string;
  ms: number | null;
  attempt: number;
  responseBody: string;
  payload: Record<string, unknown>;
};

const RUN_DATA: Record<EventName, Record<string, unknown>> = {
  'run.completed': {
    run: 'run_41c7e0',
    agent: 'Writer',
    steps: 6,
    cost_usd: 0.214,
  },
  'run.failed': {
    run: 'run_8f2c19',
    agent: 'Researcher',
    error: 'Tool timed out after 30 s',
  },
  'approval.requested': {
    run: 'run_5d90ab',
    agent: 'Reviewer',
    request: 'Send the policy update to 212 customers',
  },
  'tool.called': {
    run: 'run_2b6f44',
    agent: 'Coder',
    tool: 'run_tests',
    duration_ms: 4180,
  },
};

function payloadOf(id: string, event: EventName, time: string) {
  return {
    id: `evt_${id}`,
    type: event,
    created: `2026-11-12T${time}Z`,
    data: RUN_DATA[event],
  };
}

type DeliverySeed = {
  id: string;
  endpointId: string;
  event: EventName;
  time: string;
  code: number;
  ms: number;
  attempt?: number;
};

const OK_BODY = '{"received":true}';

const FAILED_BODY = '{"error":"upstream timed out"}';

function isSuccessCode(code: number) {
  return code >= 200 && code < 300;
}

function statusOfCode(code: number): DeliveryStatus {
  if (isSuccessCode(code)) {
    return 'done';
  }
  return 'failed';
}

function bodyOfCode(code: number) {
  if (isSuccessCode(code)) {
    return OK_BODY;
  }
  return FAILED_BODY;
}

function deliveryOf(seed: DeliverySeed): Delivery {
  return {
    id: seed.id,
    endpointId: seed.endpointId,
    event: seed.event,
    status: statusOfCode(seed.code),
    code: seed.code,
    time: seed.time,
    ms: seed.ms,
    attempt: seed.attempt ?? 1,
    responseBody: bodyOfCode(seed.code),
    payload: payloadOf(seed.id, seed.event, seed.time),
  };
}

export const FAILED_DELIVERY_ID = 'd-juniper-1';

const SEEDS: DeliverySeed[] = [
  {
    id: FAILED_DELIVERY_ID,
    endpointId: 'juniper',
    event: 'run.failed',
    time: '14:52:07',
    code: 500,
    ms: 1204,
    attempt: 3,
  },
  {
    id: 'd-juniper-2',
    endpointId: 'juniper',
    event: 'run.failed',
    time: '13:18:44',
    code: 200,
    ms: 186,
  },
  {
    id: 'd-juniper-3',
    endpointId: 'juniper',
    event: 'run.failed',
    time: '11:02:31',
    code: 200,
    ms: 204,
  },
  {
    id: 'd-juniper-4',
    endpointId: 'juniper',
    event: 'run.failed',
    time: '09:47:10',
    code: 200,
    ms: 171,
  },
  {
    id: 'd-calder-1',
    endpointId: 'calder',
    event: 'run.completed',
    time: '14:55:20',
    code: 200,
    ms: 142,
  },
  {
    id: 'd-calder-2',
    endpointId: 'calder',
    event: 'approval.requested',
    time: '14:51:03',
    code: 200,
    ms: 158,
  },
  {
    id: 'd-calder-3',
    endpointId: 'calder',
    event: 'run.completed',
    time: '14:40:36',
    code: 200,
    ms: 133,
  },
  {
    id: 'd-calder-4',
    endpointId: 'calder',
    event: 'run.failed',
    time: '14:22:58',
    code: 200,
    ms: 149,
  },
  {
    id: 'd-pinecrest-1',
    endpointId: 'pinecrest',
    event: 'tool.called',
    time: '14:56:41',
    code: 200,
    ms: 97,
  },
  {
    id: 'd-pinecrest-2',
    endpointId: 'pinecrest',
    event: 'tool.called',
    time: '14:56:12',
    code: 200,
    ms: 104,
  },
  {
    id: 'd-pinecrest-3',
    endpointId: 'pinecrest',
    event: 'run.completed',
    time: '14:55:48',
    code: 200,
    ms: 88,
  },
  {
    id: 'd-pinecrest-4',
    endpointId: 'pinecrest',
    event: 'tool.called',
    time: '14:54:30',
    code: 200,
    ms: 112,
  },
];

/** Newest first within each endpoint. */
export const DELIVERIES: Delivery[] = SEEDS.map(deliveryOf);

export const RETRY_OK = { code: 200, ms: 212, responseBody: OK_BODY };

/** The headers every delivery is sent with; the signature is cut short. */
export function headersOf(delivery: Delivery) {
  return {
    'content-type': 'application/json',
    'user-agent': 'agent-webhooks/1.0',
    'webhook-id': `msg_${delivery.id}`,
    'webhook-attempt': delivery.attempt,
    'webhook-signature': 'v1,K5oZ8fR2…',
  };
}

export const DEMO_URL = 'https://hooks.aldermoor.example/agents';
