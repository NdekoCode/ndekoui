export type NoticeTone = 'warning' | 'error' | 'info';

export type SourceId = 'calendar' | 'import' | 'invites';

export type NoticeText = {
  title: string;
  line: string;
};

export type NoticeData = {
  id: string;
  sourceId: SourceId;
  tone: NoticeTone;
  open: NoticeText;
  resolved: NoticeText;
  action: string;
  workingAction: string;
  recoveryLink: string;
};

export type SourceState = {
  label: string;
  variant: 'success' | 'warning' | 'info' | 'destructive';
};

export type Source = {
  id: SourceId;
  name: string;
  detail: string;
  open: SourceState;
  resolved: SourceState;
};

export const TEAM_NAME = 'Mossline Web';

export const WORKING_DURATION_MS = 1400;

export const NOTICES: NoticeData[] = [
  {
    id: 'calendar-paused',
    sourceId: 'calendar',
    tone: 'warning',
    open: {
      title: 'Calendar feed paused',
      line: 'The feed stopped answering at 09:40, so later events are missing from plans',
    },
    resolved: {
      title: 'Calendar feed reconnected',
      line: 'Events from 09:40 onward are back in plans',
    },
    action: 'Reconnect',
    workingAction: 'Reconnecting',
    recoveryLink: 'Check the calendar feed',
  },
  {
    id: 'import-failed',
    sourceId: 'import',
    tone: 'error',
    open: {
      title: 'Member import failed',
      line: 'Row 214 of members.csv has no email address, so nobody was imported',
    },
    resolved: {
      title: 'Members imported',
      line: '47 members joined Mossline Web and row 214 was skipped',
    },
    action: 'Import without row 214',
    workingAction: 'Importing',
    recoveryLink: 'Check the import',
  },
  {
    id: 'invites-pending',
    sourceId: 'invites',
    tone: 'info',
    open: {
      title: 'Two invitations are still pending',
      line: 'Tomás and Mei have not joined Mossline Web yet',
    },
    resolved: {
      title: 'Invitations sent again',
      line: 'Tomás and Mei will get a new email in a minute',
    },
    action: 'Resend invites',
    workingAction: 'Sending',
    recoveryLink: 'Check the invitations',
  },
];

export const SOURCES: Source[] = [
  {
    id: 'calendar',
    name: 'Calendar feed',
    detail: 'Studio bookings, every 5 minutes',
    open: { label: 'Paused', variant: 'warning' },
    resolved: { label: 'Connected', variant: 'success' },
  },
  {
    id: 'import',
    name: 'Member import',
    detail: 'members.csv, uploaded today',
    open: { label: 'Failed', variant: 'destructive' },
    resolved: { label: 'Finished', variant: 'success' },
  },
  {
    id: 'invites',
    name: 'Invitations',
    detail: 'Sent on Monday',
    open: { label: '2 pending', variant: 'info' },
    resolved: { label: 'Sent again', variant: 'info' },
  },
];
