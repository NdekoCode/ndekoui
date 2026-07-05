export const PRODUCT_NAME = 'Marlow';

export type ServiceId = 'models' | 'tools' | 'vectors' | 'runs';

export type Service = {
  id: ServiceId;
  name: string;
  detail: string;
  /** What the response time is measured on. */
  measure: string;
  targetMs: number;
  /** The top of the chart for this service. */
  topMs: number;
  p50: number[];
  p95: number[];
};

const HOURS = 24;

/** The shape of a working day: quiet at night, busy from mid-morning. */
const DAY_WAVE = [
  0.82, 0.8, 0.79, 0.8, 0.84, 0.9, 0.98, 1.06, 1.12, 1.15, 1.13, 1.1, 1.12,
  1.16, 1.14, 1.09, 1.04, 1, 0.97, 0.95, 0.92, 0.89, 0.86, 0.84,
];

const JITTER = [
  0, 0.03, -0.02, 0.01, -0.03, 0.02, 0.04, -0.01, 0.02, -0.02, 0.03, 0, -0.03,
  0.02, 0.01, -0.01, 0.03, -0.02, 0, 0.02, -0.03, 0.01, 0.02, -0.01,
];

function seriesOf(baseMs: number, shift: number, swing: number) {
  return DAY_WAVE.map((_, hour) => {
    const wave = DAY_WAVE[(hour + shift) % HOURS];
    const jitter = JITTER[(hour + shift * 3) % HOURS];
    const lift = (wave - 1) * swing;
    const factor = 1 + lift + jitter;
    return Math.round(baseMs * factor);
  });
}

/** Response times over the last 24 hours, one value per hour. Illustrative. */
export const SERVICES: Service[] = [
  {
    id: 'models',
    name: 'Model endpoints',
    detail: 'Lumen and Lumen Swift',
    measure: 'Time to first token',
    targetMs: 900,
    topMs: 2400,
    p50: seriesOf(520, 0, 1),
    p95: seriesOf(760, 2, 1.1),
  },
  {
    id: 'tools',
    name: 'Tool gateway',
    detail: 'Calls from agents to connected tools',
    measure: 'Time per tool call',
    targetMs: 250,
    topMs: 400,
    p50: seriesOf(110, 5, 1.6),
    p95: seriesOf(186, 7, 1.8),
  },
  {
    id: 'vectors',
    name: 'Vector store',
    detail: 'Search over indexed knowledge',
    measure: 'Time per search',
    targetMs: 80,
    topMs: 120,
    p50: seriesOf(38, 11, 0.7),
    p95: seriesOf(61, 9, 0.9),
  },
  {
    id: 'runs',
    name: 'Agent runs',
    detail: 'Queue and start of every run',
    measure: 'Time to first step',
    targetMs: 3000,
    topMs: 5000,
    p50: seriesOf(1400, 16, 1.3),
    p95: seriesOf(2500, 14, 1.2),
  },
];

/** How many of the last hours the capacity fault slowed, and by how much. */
const FAULT_HOURS = 3;

const FAULT_P50 = 1.5;

const FAULT_P95 = 2.5;

function slowedTail(values: number[], factor: number) {
  const firstSlowHour = values.length - FAULT_HOURS;
  return values.map((value, hour) => {
    if (hour < firstSlowHour) {
      return value;
    }
    return Math.round(value * factor);
  });
}

const MODELS = SERVICES[0];

/** The model endpoints while the fault lasts: the end of both lines lifts. */
export const MODELS_DURING_FAULT: Service = {
  ...MODELS,
  p50: slowedTail(MODELS.p50, FAULT_P50),
  p95: slowedTail(MODELS.p95, FAULT_P95),
};

export function serviceOf(id: ServiceId) {
  const service = SERVICES.find((candidate) => candidate.id === id);
  return service ?? MODELS;
}

export const DAY_COUNT = 90;

export const TODAY = DAY_COUNT - 1;

export type DayStatus = 'ok' | 'degraded' | 'outage';

export type DayEvent = {
  status: DayStatus;
  minutes: number;
};

const NO_EVENT: DayEvent = { status: 'ok', minutes: 0 };

/** The days with an incident, by their place in the last 90 days. Illustrative. */
const EVENTS: Record<ServiceId, Record<number, DayEvent>> = {
  models: {
    23: { status: 'degraded', minutes: 18 },
    61: { status: 'degraded', minutes: 41 },
  },
  tools: {
    55: { status: 'outage', minutes: 12 },
  },
  vectors: {
    12: { status: 'degraded', minutes: 9 },
    74: { status: 'degraded', minutes: 33 },
  },
  runs: {
    40: { status: 'outage', minutes: 6 },
    55: { status: 'degraded', minutes: 12 },
  },
};

/** How long the fault of the demo slows the model endpoints today. */
export const FAULT_MINUTES = 31;

export function dayEventOf(serviceId: ServiceId, day: number) {
  return EVENTS[serviceId][day] ?? NO_EVENT;
}

const MINUTES_PER_DAY = 1440;

export function uptimeOf(serviceId: ServiceId, extraMinutes: number) {
  const events = Object.values(EVENTS[serviceId]);
  let lostMinutes = extraMinutes;
  for (const event of events) {
    lostMinutes += event.minutes;
  }
  const totalMinutes = DAY_COUNT * MINUTES_PER_DAY;
  const share = 1 - lostMinutes / totalMinutes;
  return share * 100;
}

const DAY_MS = 86_400_000;

/** A fixed day, so the page reads the same on the server and in the browser. */
const TODAY_UTC = Date.UTC(2026, 10, 12);

const DATE_FORMAT = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

export function dateLabelOf(day: number) {
  const daysAgo = TODAY - day;
  const time = TODAY_UTC - daysAgo * DAY_MS;
  return DATE_FORMAT.format(time);
}

export type UpdateKind =
  'investigating' | 'identified' | 'monitoring' | 'resolved';

export type IncidentUpdate = {
  kind: UpdateKind;
  time: string;
  text: string;
};

export type Incident = {
  id: string;
  title: string;
  serviceId: ServiceId;
  date: string;
  updates: IncidentUpdate[];
};

/** The incident that unfolds in the demo, oldest update first. */
export const LIVE_INCIDENT: Incident = {
  id: 'lumen-slow',
  title: 'Slow replies from Lumen',
  serviceId: 'models',
  date: dateLabelOf(TODAY),
  updates: [
    {
      kind: 'investigating',
      time: '14:21',
      text: 'Replies from Lumen take longer than usual. We are looking at the endpoint.',
    },
    {
      kind: 'identified',
      time: '14:29',
      text: 'A capacity fault at the Lumen endpoint slows about a third of the requests.',
    },
    {
      kind: 'monitoring',
      time: '14:36',
      text: 'New conversations now go to Lumen Swift. Replies are back under the target.',
    },
    {
      kind: 'resolved',
      time: '14:52',
      text: 'Traffic moved to Lumen Swift while Lumen recovered. Lumen answers at its usual speed again.',
    },
  ],
};

export const PAST_INCIDENTS: Incident[] = [
  {
    id: 'vector-slow',
    title: 'Vector store answered slowly',
    serviceId: 'vectors',
    date: dateLabelOf(74),
    updates: [
      {
        kind: 'identified',
        time: '09:12',
        text: 'A reindex of a large workspace took the search nodes over their memory limit.',
      },
      {
        kind: 'resolved',
        time: '09:45',
        text: 'The reindex now runs in smaller batches. Searches were slow for 33 minutes.',
      },
    ],
  },
  {
    id: 'gateway-refused',
    title: 'Tool gateway refused new connections',
    serviceId: 'tools',
    date: dateLabelOf(55),
    updates: [
      {
        kind: 'investigating',
        time: '17:03',
        text: 'Agents cannot reach their tools. Runs wait instead of failing.',
      },
      {
        kind: 'resolved',
        time: '17:15',
        text: 'An expired certificate was replaced. Waiting runs picked up where they stopped.',
      },
    ],
  },
];

export const DEMO_EMAIL = 'mara@calderfreight.example';

/** The day the demonstration reads on an uptime bar. */
export const DEMO_READING: { serviceId: ServiceId; day: number } = {
  serviceId: 'vectors',
  day: 74,
};
