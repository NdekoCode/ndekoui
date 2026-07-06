export type IssueType = 'task' | 'bug' | 'story';

export type StatusId = 'todo' | 'in-progress' | 'in-review' | 'done';

export type NotificationKind = 'mention' | 'comment' | 'assigned' | 'status';

export type DayGroup = 'today' | 'yesterday' | 'earlier';

export type InboxFilter = 'all' | 'unread' | 'mentions';

export type Person = {
  id: string;
  name: string;
};

export type TaskRef = {
  key: string;
  title: string;
  type: IssueType;
  project: string;
};

type BaseItem = {
  id: string;
  sender: Person;
  task: TaskRef;
  day: DayGroup;
  time: string;
  isUnread: boolean;
};

export type MessageItem = BaseItem & {
  kind: 'mention' | 'comment';
  quote: string;
};

export type AssignedItem = BaseItem & {
  kind: 'assigned';
  due: string;
  estimate: string;
  status: StatusId;
};

export type StatusItem = BaseItem & {
  kind: 'status';
  from: StatusId;
  to: StatusId;
};

export type InboxItem = MessageItem | AssignedItem | StatusItem;

export const WORKSPACE_NAME = 'Fernhall';

export const YOU: Person = {
  id: 'you',
  name: 'Amara Okafor',
};

const LEO: Person = {
  id: 'leo',
  name: 'Léo Martin',
};

const SANA: Person = {
  id: 'sana',
  name: 'Sana Iqbal',
};

const TOMAS: Person = {
  id: 'tomas',
  name: 'Tomás Rivera',
};

const MEI: Person = {
  id: 'mei',
  name: 'Mei Lin',
};

const JONAS: Person = { id: 'jonas', name: 'Jonas Weber' };

export const DAY_LABELS: Record<DayGroup, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  earlier: 'Earlier this week',
};

export const DAY_ORDER: DayGroup[] = ['today', 'yesterday', 'earlier'];

export const INBOX: InboxItem[] = [
  {
    id: 'n-148',
    kind: 'mention',
    sender: SANA,
    task: {
      key: 'FRN-148',
      title: 'Booking calendar skips a week',
      type: 'bug',
      project: 'Field App',
    },
    quote:
      'Can you check the empty week on the phone layout? It only happens when the month starts on a Sunday.',
    day: 'today',
    time: '09:41',
    isUnread: true,
  },
  {
    id: 'n-152',
    kind: 'comment',
    sender: LEO,
    task: {
      key: 'FRN-152',
      title: 'Offline drafts for field notes',
      type: 'story',
      project: 'Field App',
    },
    quote:
      'Drafts now sync as soon as the tab is back online. When both sides changed, the last edit wins and the other one stays in the history.',
    day: 'today',
    time: '09:05',
    isUnread: true,
  },
  {
    id: 'n-164',
    kind: 'assigned',
    sender: MEI,
    task: {
      key: 'FRN-164',
      title: 'Copy for the weekly digest',
      type: 'task',
      project: 'Growth',
    },
    due: 'Friday',
    estimate: '3h',
    status: 'todo',
    day: 'today',
    time: '08:30',
    isUnread: true,
  },
  {
    id: 'n-139',
    kind: 'status',
    sender: TOMAS,
    task: {
      key: 'FRN-139',
      title: 'Rate limit the share links',
      type: 'task',
      project: 'Platform',
    },
    from: 'in-progress',
    to: 'in-review',
    day: 'yesterday',
    time: '17:20',
    isUnread: false,
  },
  {
    id: 'n-158',
    kind: 'comment',
    sender: MEI,
    task: {
      key: 'FRN-158',
      title: 'Onboarding checklist on small screens',
      type: 'story',
      project: 'Growth',
    },
    quote:
      'The last step wraps on a 375 px screen. Could the button go under the text there?',
    day: 'yesterday',
    time: '11:02',
    isUnread: false,
  },
  {
    id: 'n-171',
    kind: 'mention',
    sender: JONAS,
    task: {
      key: 'FRN-171',
      title: 'Weekly report export',
      type: 'task',
      project: 'Platform',
    },
    quote: 'The CSV leaves out the project column. Is that on purpose?',
    day: 'earlier',
    time: 'Mon',
    isUnread: false,
  },
  {
    id: 'n-127',
    kind: 'status',
    sender: SANA,
    task: {
      key: 'FRN-127',
      title: 'Paginate the notes list',
      type: 'task',
      project: 'Field App',
    },
    from: 'in-review',
    to: 'done',
    day: 'earlier',
    time: 'Mon',
    isUnread: false,
  },
];
