export type ServiceStatus = 'paused' | 'readOnly' | 'working';

export type AffectedService = {
  id: string;
  name: string;
  note: string;
  status: ServiceStatus;
};

export const SITE = {
  name: 'Quayside',
  homeHref: '#',
  statusHref: 'https://status.quayside.example',
};

const MINUTE_MS = 60_000;

export const WINDOW = {
  plannedMs: 45 * MINUTE_MS,
  startedBeforeLoadMs: 6 * MINUTE_MS + 48_000,
};

export const SERVICES: AffectedService[] = [
  {
    id: 'booking',
    name: 'Online booking',
    note: 'Patients see this page and can still call the clinic',
    status: 'paused',
  },
  {
    id: 'calendars',
    name: 'Clinic calendars',
    note: 'Open to read while every appointment is copied',
    status: 'readOnly',
  },
  {
    id: 'reminders',
    name: 'Appointment reminders',
    note: 'Texts and emails go out on time',
    status: 'working',
  },
  {
    id: 'payments',
    name: 'Card payments at the desk',
    note: 'Card readers work as usual',
    status: 'working',
  },
];
