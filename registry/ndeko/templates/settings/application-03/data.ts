import {
  BellIcon,
  MailIcon,
  MonitorIcon,
  SettingsIcon,
  SmartphoneIcon,
  UserIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';

export type PageId = 'profile' | 'notifications' | 'workspace';

export type Entity = {
  id: string;
  name: string;
  color: string;
};

export type Workspace = {
  id: string;
  name: string;
  memberCount: number;
};

export type NavItem = {
  id: PageId;
  label: string;
  icon: Icon;
};

export type NavGroup = {
  id: string;
  label?: string;
  team?: Entity;
  items: NavItem[];
};

export type Person = {
  id: string;
  name: string;
  role: string;
  /** The uploaded profile photo, when there is one. */
  avatar?: string;
};

export const WORKSPACE_ID = 'lattice';

export const CURRENT_USER_ID = 'amara';

export const PEOPLE: Person[] = [
  {
    id: 'amara',
    name: 'Amara Okafor',
    role: 'Product designer',
  },
  {
    id: 'lucas',
    name: 'Lucas Moreau',
    role: 'Engineering lead',
  },
  {
    id: 'priya',
    name: 'Priya Raman',
    role: 'Frontend engineer',
  },
  {
    id: 'mateo',
    name: 'Mateo Silva',
    role: 'Backend engineer',
  },
  {
    id: 'hana',
    name: 'Hana Kobayashi',
    role: 'Product manager',
  },
  {
    id: 'jonas',
    name: 'Jonas Weber',
    role: 'QA engineer',
  },
];

export const SETTINGS_GROUPS: NavGroup[] = [
  {
    id: 'account',
    label: 'Account',
    items: [
      { id: 'profile', label: 'Profile', icon: UserIcon },
      { id: 'notifications', label: 'Notifications', icon: BellIcon },
    ],
  },
  {
    id: 'workspace',
    label: 'Workspace',
    items: [{ id: 'workspace', label: 'General', icon: SettingsIcon }],
  },
];

export type ProfileSectionId = 'profile' | 'contact' | 'region';

export type WeekStart = 'monday' | 'sunday';

export type TimeFormat = '24h' | '12h';

export type ProfileValues = {
  photo: string;
  name: string;
  username: string;
  title: string;
  bio: string;
  email: string;
  phone: string;
  showEmail: boolean;
  language: string;
  timeZone: string;
  weekStart: WeekStart;
  timeFormat: TimeFormat;
};

export type ProfileField = keyof ProfileValues;

export const INITIAL_PROFILE: ProfileValues = {
  photo: '',
  name: 'Amara Okafor',
  username: 'amara',
  title: 'Product designer',
  bio: 'Designs the onboarding and the reports. Ask me about empty states.',
  email: 'amara.okafor@lattice.example',
  phone: '',
  showEmail: true,
  language: 'en-GB',
  timeZone: 'africa-lagos',
  weekStart: 'monday',
  timeFormat: '24h',
};

export const PROFILE_HOST = 'lattice.example/';

export const BIO_MAX_LENGTH = 160;

const MEGABYTE = 1024 * 1024;

export const PHOTO_MAX_BYTES = 2 * MEGABYTE;

export const PHOTO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export const PROFILE_SECTION_KEYS: Record<ProfileSectionId, ProfileField[]> = {
  profile: ['photo', 'name', 'username', 'title', 'bio'],
  contact: ['email', 'phone', 'showEmail'],
  region: ['language', 'timeZone', 'weekStart', 'timeFormat'],
};

export const LANGUAGES = [
  { value: 'en-GB', label: 'English (United Kingdom)' },
  { value: 'en-US', label: 'English (United States)' },
  { value: 'fr-FR', label: 'Français' },
  { value: 'pt-PT', label: 'Português' },
  { value: 'sw', label: 'Kiswahili' },
];

export const TIME_ZONES = [
  { value: 'africa-lagos', label: 'Lagos, West Africa Time' },
  { value: 'africa-kinshasa', label: 'Kinshasa, West Africa Time' },
  { value: 'europe-london', label: 'London, Greenwich Mean Time' },
  { value: 'europe-paris', label: 'Paris, Central European Time' },
  { value: 'america-new-york', label: 'New York, Eastern Time' },
  { value: 'asia-tokyo', label: 'Tokyo, Japan Standard Time' },
];

export const WEEK_STARTS: { value: WeekStart; label: string }[] = [
  { value: 'monday', label: 'Monday' },
  { value: 'sunday', label: 'Sunday' },
];

export const TIME_FORMATS: { value: TimeFormat; label: string }[] = [
  { value: '24h', label: '24-hour' },
  { value: '12h', label: '12-hour' },
];

export const TIME_FORMAT_SAMPLE: Record<TimeFormat, string> = {
  '24h': 'A meeting at half past two shows as 14:30',
  '12h': 'A meeting at half past two shows as 2:30 PM',
};

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
    masterLine: 'Sent to amara.okafor@lattice.example',
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
    masterLine: 'On the 2 phones signed in to Lattice Studio',
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
    masterLine: 'In this browser while Lattice Studio is open',
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

export type WorkspaceSectionId = 'general' | 'members' | 'danger';

export type Role = 'member' | 'viewer' | 'guest';

export type InvitePolicy = 'admins' | 'admins-members';

export type WorkspaceValues = {
  name: string;
  slug: string;
  timeZone: string;
  defaultRole: Role;
  invitePolicy: InvitePolicy;
  approveJoins: boolean;
  allowedDomain: string;
};

export type WorkspaceField = keyof WorkspaceValues;

export type RoleOption = {
  value: Role;
  label: string;
  line: string;
  /** How many people hold the role today, so the choice reads against real numbers. */
  holders: number;
};

export const INITIAL_WORKSPACE: WorkspaceValues = {
  name: 'Lattice Studio',
  slug: 'lattice-studio',
  timeZone: 'africa-lagos',
  defaultRole: 'member',
  invitePolicy: 'admins-members',
  approveJoins: true,
  allowedDomain: 'lattice.example',
};

export const WORKSPACE_HOST = 'app.lattice.example/';

export const WORKSPACE_FACTS = {
  members: 14,
  projects: 6,
  tasks: 1284,
  graceDays: 14,
  deletionDate: '19 November 2026',
};

export const WORKSPACE_SECTION_KEYS: Record<
  WorkspaceSectionId,
  WorkspaceField[]
> = {
  general: ['name', 'slug', 'timeZone'],
  members: ['defaultRole', 'invitePolicy', 'approveJoins', 'allowedDomain'],
  danger: [],
};

export const WORKSPACE_FIELD_SECTION: Record<
  WorkspaceField,
  WorkspaceSectionId
> = {
  name: 'general',
  slug: 'general',
  timeZone: 'general',
  defaultRole: 'members',
  invitePolicy: 'members',
  approveJoins: 'members',
  allowedDomain: 'members',
};

export const ROLE_OPTIONS: RoleOption[] = [
  {
    value: 'member',
    label: 'Member',
    line: 'Creates and edits tasks, tracks time, sees every project',
    holders: 11,
  },
  {
    value: 'viewer',
    label: 'Viewer',
    line: 'Reads and comments, cannot track time or edit',
    holders: 2,
  },
  {
    value: 'guest',
    label: 'Guest',
    line: 'Sees only the projects someone invites them to',
    holders: 1,
  },
];

export const INVITE_POLICIES: { value: InvitePolicy; label: string }[] = [
  { value: 'admins', label: 'Admins only' },
  { value: 'admins-members', label: 'Admins and members' },
];
