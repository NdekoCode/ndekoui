import {
  MailIcon,
  MonitorIcon,
  SmartphoneIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';

export type ChannelId = 'email' | 'push' | 'desktop';

export type Delivery = 'instant' | 'hourly' | 'daily';

export type NotificationValues = {
  emailOn: boolean;
  emailMentions: boolean;
  emailAssigned: boolean;
  emailComments: boolean;
  emailStatus: boolean;
  emailDue: boolean;
  emailWeekly: boolean;
  emailDelivery: Delivery;
  pushOn: boolean;
  pushMentions: boolean;
  pushAssigned: boolean;
  pushComments: boolean;
  pushDue: boolean;
  quietHours: boolean;
  quietFrom: string;
  quietTo: string;
  desktopOn: boolean;
  desktopMentions: boolean;
  desktopAssigned: boolean;
  desktopComments: boolean;
  desktopStatus: boolean;
  desktopSound: boolean;
  desktopPreview: boolean;
};

export type NotificationKey = keyof NotificationValues;

export type SwitchKey = Exclude<
  NotificationKey,
  'emailDelivery' | 'quietFrom' | 'quietTo'
>;

export type ChannelEvent = {
  key: SwitchKey;
  label: string;
  line: string;
};

export type Channel = {
  id: ChannelId;
  label: string;
  icon: Icon;
  masterKey: SwitchKey;
  masterLabel: string;
  masterLine: string;
  eventsTitle: string;
  offLine: string;
  keys: NotificationKey[];
  events: ChannelEvent[];
};

export const INITIAL_NOTIFICATIONS: NotificationValues = {
  emailOn: true,
  emailMentions: true,
  emailAssigned: true,
  emailComments: false,
  emailStatus: false,
  emailDue: true,
  emailWeekly: true,
  emailDelivery: 'hourly',
  pushOn: true,
  pushMentions: true,
  pushAssigned: true,
  pushComments: true,
  pushDue: false,
  quietHours: true,
  quietFrom: '21:00',
  quietTo: '08:00',
  desktopOn: false,
  desktopMentions: true,
  desktopAssigned: true,
  desktopComments: false,
  desktopStatus: false,
  desktopSound: false,
  desktopPreview: true,
};

export const CHANNELS: Channel[] = [
  {
    id: 'email',
    label: 'Email',
    icon: MailIcon,
    masterKey: 'emailOn',
    masterLabel: 'Email notifications',
    masterLine: 'Sent to amara.okafor@tidewell.example',
    eventsTitle: 'What reaches your inbox',
    offLine: 'Email is off. Turn it on to choose what reaches your inbox',
    keys: [
      'emailOn',
      'emailMentions',
      'emailAssigned',
      'emailComments',
      'emailStatus',
      'emailDue',
      'emailWeekly',
      'emailDelivery',
    ],
    events: [
      {
        key: 'emailMentions',
        label: 'Mentions',
        line: 'Someone writes @amara in a task or a comment',
      },
      {
        key: 'emailAssigned',
        label: 'Assigned to you',
        line: 'A task lands on your list',
      },
      {
        key: 'emailComments',
        label: 'Comments on your tasks',
        line: 'Replies on tasks you created or own',
      },
      {
        key: 'emailStatus',
        label: 'Status changes',
        line: 'Tasks you follow move to another status',
      },
      {
        key: 'emailDue',
        label: 'Due date reminders',
        line: 'The morning a task of yours is due',
      },
      {
        key: 'emailWeekly',
        label: 'Weekly summary',
        line: 'Monday morning: your hours and what closed last week',
      },
    ],
  },
  {
    id: 'push',
    label: 'Mobile push',
    icon: SmartphoneIcon,
    masterKey: 'pushOn',
    masterLabel: 'Push notifications',
    masterLine: 'On the 2 phones signed in to Tidewell',
    eventsTitle: 'What buzzes your phone',
    offLine: 'Push is off. Turn it on to choose what reaches your phone',
    keys: [
      'pushOn',
      'pushMentions',
      'pushAssigned',
      'pushComments',
      'pushDue',
      'quietHours',
      'quietFrom',
      'quietTo',
    ],
    events: [
      {
        key: 'pushMentions',
        label: 'Mentions',
        line: 'Someone writes @amara in a task or a comment',
      },
      {
        key: 'pushAssigned',
        label: 'Assigned to you',
        line: 'A task lands on your list',
      },
      {
        key: 'pushComments',
        label: 'Comments on your tasks',
        line: 'Replies on tasks you created or own',
      },
      {
        key: 'pushDue',
        label: 'Due date reminders',
        line: 'An hour before a task of yours is due',
      },
    ],
  },
  {
    id: 'desktop',
    label: 'Desktop',
    icon: MonitorIcon,
    masterKey: 'desktopOn',
    masterLabel: 'Desktop notifications',
    masterLine: 'In this browser while Tidewell is open',
    eventsTitle: 'What pops up on screen',
    offLine: 'Desktop is off. Turn it on to choose what pops up on screen',
    keys: [
      'desktopOn',
      'desktopMentions',
      'desktopAssigned',
      'desktopComments',
      'desktopStatus',
      'desktopSound',
      'desktopPreview',
    ],
    events: [
      {
        key: 'desktopMentions',
        label: 'Mentions',
        line: 'Someone writes @amara in a task or a comment',
      },
      {
        key: 'desktopAssigned',
        label: 'Assigned to you',
        line: 'A task lands on your list',
      },
      {
        key: 'desktopComments',
        label: 'Comments on your tasks',
        line: 'Replies on tasks you created or own',
      },
      {
        key: 'desktopStatus',
        label: 'Status changes',
        line: 'Tasks you follow move to another status',
      },
    ],
  },
];

export const DELIVERIES: { value: Delivery; label: string }[] = [
  { value: 'instant', label: 'Instant' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
];

export const DELIVERY_LINE: Record<Delivery, string> = {
  instant: 'One email per notification, as it happens',
  hourly: 'One email an hour at most, grouping what happened',
  daily: 'One email at 8:00 with the day before',
};

export const QUIET_TIMES = [
  { value: '18:00', label: '18:00' },
  { value: '19:00', label: '19:00' },
  { value: '20:00', label: '20:00' },
  { value: '21:00', label: '21:00' },
  { value: '22:00', label: '22:00' },
  { value: '23:00', label: '23:00' },
  { value: '06:00', label: '06:00' },
  { value: '07:00', label: '07:00' },
  { value: '08:00', label: '08:00' },
  { value: '09:00', label: '09:00' },
];
