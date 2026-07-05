import type { SessionStep } from '@/registry/ndeko/hooks/use-session';

import {
  DELIVERIES,
  DEMO_URL,
  ENDPOINTS,
  FAILED_DELIVERY_ID,
  NEW_SECRETS,
  RETRY_OK,
  type Delivery,
  type Endpoint,
  type EventName,
  type HourBucket,
} from './data';

export type InspectorTab = 'payload' | 'headers';

/** Rotated: the new secret is on screen, for the one time it is shown. */
export type RotateStatus = 'idle' | 'asking' | 'rotated';

/** Created: the endpoint exists and its secret is on screen, for the one time it is shown. */
export type FormPhase = 'closed' | 'editing' | 'created';

export type FormState = {
  phase: FormPhase;
  url: string;
  events: EventName[];
  error: string | null;
  /** The secret of the endpoint the form just created. */
  secret: string | null;
};

export type WebhookState = {
  endpoints: Endpoint[];
  deliveries: Delivery[];
  selectedId: string;
  /** On a phone the detail replaces the list; a wide block shows both. */
  isDetailOpen: boolean;
  openDeliveryId: string | null;
  tab: InspectorTab;
  isSecretShown: boolean;
  rotate: RotateStatus;
  form: FormState;
  secretsIssued: number;
};

export type WebhookAction =
  | { type: 'selected'; id: string }
  | { type: 'back' }
  | { type: 'deliveryOpened'; id: string }
  | { type: 'tab'; tab: InspectorTab }
  | { type: 'retry'; id: string }
  | { type: 'retried'; id: string }
  | { type: 'secretToggled' }
  | { type: 'rotateAsked' }
  | { type: 'rotateCancelled' }
  | { type: 'rotated' }
  | { type: 'rotateDone' }
  | { type: 'formOpened' }
  | { type: 'formClosed' }
  | { type: 'urlTyped'; text: string }
  | { type: 'eventToggled'; event: EventName }
  | { type: 'created' };

type Step = SessionStep<WebhookState, WebhookAction>;

const CLOSED_FORM: FormState = {
  phase: 'closed',
  url: '',
  events: ['run.completed'],
  error: null,
  secret: null,
};

export const INITIAL: WebhookState = {
  endpoints: ENDPOINTS,
  deliveries: DELIVERIES,
  selectedId: 'calder',
  isDetailOpen: false,
  openDeliveryId: null,
  tab: 'payload',
  isSecretShown: false,
  rotate: 'idle',
  form: CLOSED_FORM,
  secretsIssued: 0,
};

export function endpointOf(state: WebhookState, id: string) {
  const endpoint = state.endpoints.find((candidate) => candidate.id === id);
  return endpoint ?? state.endpoints[0];
}

export function deliveriesOf(state: WebhookState, endpointId: string) {
  return state.deliveries.filter(
    (delivery) => delivery.endpointId === endpointId
  );
}

export type Health = 'healthy' | 'retrying' | 'failing';

export function healthOf(state: WebhookState, endpointId: string): Health {
  const deliveries = deliveriesOf(state, endpointId);
  const hasFailed = deliveries.some((delivery) => delivery.status === 'failed');
  if (hasFailed) {
    return 'failing';
  }
  const hasPending = deliveries.some(
    (delivery) => delivery.status === 'pending'
  );
  if (hasPending) {
    return 'retrying';
  }
  return 'healthy';
}

/** A delivery that was retried with success leaves the failures of the current hour. */
function recoveredCountOf(state: WebhookState, endpointId: string) {
  const deliveries = deliveriesOf(state, endpointId);
  const recovered = deliveries.filter((delivery) => {
    const wasRetried = delivery.attempt > 1;
    const isDone = delivery.status === 'done';
    return wasRetried && isDone;
  });
  return recovered.length;
}

export function hoursOf(state: WebhookState, endpoint: Endpoint) {
  const recovered = recoveredCountOf(state, endpoint.id);
  const lastHour = endpoint.hours.length - 1;
  return endpoint.hours.map((bucket, hour): HourBucket => {
    if (hour !== lastHour) {
      return bucket;
    }
    const moved = Math.min(recovered, bucket.failed);
    return { ok: bucket.ok + moved, failed: bucket.failed - moved };
  });
}

export type DayTotals = {
  ok: number;
  failed: number;
  /** Share of the deliveries that were answered with a success, from 0 to 100. */
  rate: number;
};

export function totalsOf(hours: HourBucket[]): DayTotals {
  let ok = 0;
  let failed = 0;
  for (const bucket of hours) {
    ok += bucket.ok;
    failed += bucket.failed;
  }
  const total = Math.max(1, ok + failed);
  const rate = (ok / total) * 100;
  return { ok, failed, rate };
}

function withDelivery(
  state: WebhookState,
  id: string,
  change: (delivery: Delivery) => Delivery
): WebhookState {
  const deliveries = state.deliveries.map((delivery) => {
    if (delivery.id === id) {
      return change(delivery);
    }
    return delivery;
  });
  return { ...state, deliveries };
}

function retry(delivery: Delivery): Delivery {
  if (delivery.status !== 'failed') {
    return delivery;
  }
  return {
    ...delivery,
    status: 'pending',
    code: null,
    ms: null,
    attempt: delivery.attempt + 1,
  };
}

function retried(delivery: Delivery): Delivery {
  if (delivery.status !== 'pending') {
    return delivery;
  }
  return { ...delivery, status: 'done', ...RETRY_OK };
}

function selected(state: WebhookState, id: string): WebhookState {
  const isSame = state.selectedId === id;
  if (isSame) {
    return { ...state, isDetailOpen: true };
  }
  return {
    ...state,
    selectedId: id,
    isDetailOpen: true,
    openDeliveryId: null,
    isSecretShown: false,
    rotate: 'idle',
  };
}

function deliveryOpened(state: WebhookState, id: string): WebhookState {
  if (state.openDeliveryId === id) {
    return { ...state, openDeliveryId: null };
  }
  return { ...state, openDeliveryId: id };
}

function nextSecretOf(state: WebhookState) {
  return NEW_SECRETS[state.secretsIssued % NEW_SECRETS.length];
}

function rotated(state: WebhookState): WebhookState {
  if (state.rotate !== 'asking') {
    return state;
  }
  const secret = nextSecretOf(state);
  const endpoints = state.endpoints.map((endpoint) => {
    if (endpoint.id === state.selectedId) {
      return { ...endpoint, secret };
    }
    return endpoint;
  });
  return {
    ...state,
    endpoints,
    rotate: 'rotated',
    isSecretShown: false,
    secretsIssued: state.secretsIssued + 1,
  };
}

function eventToggled(state: WebhookState, event: EventName): WebhookState {
  const isOn = state.form.events.includes(event);
  let events = [...state.form.events, event];
  if (isOn) {
    events = state.form.events.filter((candidate) => candidate !== event);
  }
  return { ...state, form: { ...state.form, events, error: null } };
}

export function formErrorOf(form: FormState) {
  const url = form.url.trim();
  if (!url.startsWith('https://')) {
    return 'Use an https address, so payloads stay private on the way';
  }
  if (form.events.length === 0) {
    return 'Pick at least one event to send';
  }
  return null;
}

const EMPTY_DAY: HourBucket[] = ENDPOINTS[0].hours.map(() => ({
  ok: 0,
  failed: 0,
}));

function created(state: WebhookState): WebhookState {
  if (state.form.phase !== 'editing') {
    return state;
  }
  const error = formErrorOf(state.form);
  if (error) {
    return { ...state, form: { ...state.form, error } };
  }
  const secret = nextSecretOf(state);
  const count = state.secretsIssued + 1;
  const endpoint: Endpoint = {
    id: `new-${count}`,
    url: state.form.url.trim(),
    events: state.form.events,
    secret,
    hours: EMPTY_DAY,
  };
  return {
    ...state,
    endpoints: [...state.endpoints, endpoint],
    form: { ...state.form, phase: 'created', error: null, secret },
    secretsIssued: count,
  };
}

export function reducer(
  state: WebhookState,
  action: WebhookAction
): WebhookState {
  switch (action.type) {
    case 'selected':
      return selected(state, action.id);
    case 'back':
      return { ...state, isDetailOpen: false };
    case 'deliveryOpened':
      return deliveryOpened(state, action.id);
    case 'tab':
      return { ...state, tab: action.tab };
    case 'retry':
      return withDelivery(state, action.id, retry);
    case 'retried':
      return withDelivery(state, action.id, retried);
    case 'secretToggled':
      return { ...state, isSecretShown: !state.isSecretShown };
    case 'rotateAsked':
      return { ...state, rotate: 'asking' };
    case 'rotateCancelled':
      return { ...state, rotate: 'idle' };
    case 'rotated':
      return rotated(state);
    case 'rotateDone':
      return { ...state, rotate: 'idle' };
    case 'formOpened':
      return { ...state, form: { ...CLOSED_FORM, phase: 'editing' } };
    case 'formClosed':
      return { ...state, form: CLOSED_FORM };
    case 'urlTyped':
      return {
        ...state,
        form: { ...state.form, url: action.text, error: null },
      };
    case 'eventToggled':
      return eventToggled(state, action.event);
    case 'created':
      return created(state);
  }
}

const CHUNK = 3;

function delayOfChunk(index: number) {
  if (index === 0) {
    return 800;
  }
  return 70;
}

function typingSteps(): Step[] {
  const steps: Step[] = [];
  const last = DEMO_URL.length + CHUNK;
  for (let end = CHUNK; end < last; end += CHUNK) {
    const text = DEMO_URL.slice(0, end);
    const after = delayOfChunk(steps.length);
    steps.push({ after, by: 'demo', action: { type: 'urlTyped', text } });
  }
  return steps;
}

function hasRetried(state: WebhookState) {
  const delivery = state.deliveries.find(
    (candidate) => candidate.id === FAILED_DELIVERY_ID
  );
  return delivery?.status !== 'failed';
}

/** A request that waits on a person is answered by the demonstration after this long. */
const DECIDE_AFTER_MS = 2500;

export const RETRY_MS = 1500;

const OPENING: Step[] = [
  {
    after: 1300,
    by: 'demo',
    press: 'endpoint-juniper',
    action: { type: 'selected', id: 'juniper' },
  },
  {
    after: 1300,
    by: 'demo',
    press: `delivery-${FAILED_DELIVERY_ID}`,
    action: { type: 'deliveryOpened', id: FAILED_DELIVERY_ID },
  },
];

export const SCRIPT: Step[] = [
  ...OPENING,
  { after: 1600, by: 'demo', action: { type: 'tab', tab: 'headers' } },
  {
    after: DECIDE_AFTER_MS,
    by: 'person',
    press: `retry-${FAILED_DELIVERY_ID}`,
    action: { type: 'retry', id: FAILED_DELIVERY_ID },
    isAnswered: hasRetried,
  },
  { after: RETRY_MS, action: { type: 'retried', id: FAILED_DELIVERY_ID } },
  { after: 1700, by: 'demo', press: 'back', action: { type: 'back' } },
  { after: 900, by: 'demo', press: 'add', action: { type: 'formOpened' } },
  ...typingSteps(),
  {
    after: 600,
    by: 'demo',
    action: { type: 'eventToggled', event: 'run.failed' },
  },
  { after: 1000, by: 'demo', press: 'create', action: { type: 'created' } },
];

/** Under reduced motion the failing endpoint is picked and its failed delivery is open. */
function restingOf() {
  let state = INITIAL;
  for (const step of OPENING) {
    state = reducer(state, step.action);
  }
  return { ...state, isDetailOpen: false };
}

export const RESTING = restingOf();

export const LOOP_AFTER_MS = 4200;
