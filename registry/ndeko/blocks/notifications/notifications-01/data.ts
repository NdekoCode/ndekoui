export type IssueTypeId = 'task' | 'bug' | 'story' | 'epic';

export type NotificationKind = 'mention' | 'comment' | 'assigned' | 'status';

export type Person = {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
};

export type InboxItem = {
  id: string;
  kind: NotificationKind;
  senderId: string;
  taskNumber: number;
  taskTitle: string;
  taskType: IssueTypeId;
  event: string;
  excerpt?: string;
  age: string;
  isUnread: boolean;
};

export type AssignedTask = {
  number: number;
  title: string;
  type: IssueTypeId;
  status: string;
};

export const TEAM_KEY = 'MOS';

export const WORKSPACE_NAME = 'Mossline';

export const PEOPLE: Person[] = [
  {
    id: 'leo',
    name: 'Léo Martin',
    initials: 'LM',
    avatar: '/avatars/avatar-04.svg',
  },
  {
    id: 'sana',
    name: 'Sana Iqbal',
    initials: 'SI',
    avatar: '/avatars/avatar-05.svg',
  },
  {
    id: 'tomas',
    name: 'Tomás Rivera',
    initials: 'TR',
    avatar: '/avatars/avatar-06.svg',
  },
  {
    id: 'mei',
    name: 'Mei Lin',
    initials: 'ML',
    avatar: '/avatars/avatar-07.svg',
  },
];

export const INBOX: InboxItem[] = [
  {
    id: 'n-1',
    kind: 'mention',
    senderId: 'sana',
    taskNumber: 148,
    taskTitle: 'Booking calendar skips the first week on Safari',
    taskType: 'bug',
    event: 'mentioned you',
    excerpt: 'Can you check the empty week on the mobile view?',
    age: '4m',
    isUnread: true,
  },
  {
    id: 'n-2',
    kind: 'comment',
    senderId: 'leo',
    taskNumber: 152,
    taskTitle: 'Offline drafts for field notes',
    taskType: 'story',
    event: 'commented',
    excerpt: 'Drafts now sync as soon as the tab is back online',
    age: '38m',
    isUnread: true,
  },
  {
    id: 'n-3',
    kind: 'assigned',
    senderId: 'mei',
    taskNumber: 164,
    taskTitle: 'Copy for the weekly digest email',
    taskType: 'task',
    event: 'assigned it to you',
    age: '2h',
    isUnread: true,
  },
  {
    id: 'n-4',
    kind: 'status',
    senderId: 'sana',
    taskNumber: 139,
    taskTitle: 'Rate limit the public share links',
    taskType: 'task',
    event: 'moved it to In review',
    age: '5h',
    isUnread: false,
  },
  {
    id: 'n-5',
    kind: 'comment',
    senderId: 'tomas',
    taskNumber: 160,
    taskTitle: 'Sync photo captions across devices',
    taskType: 'story',
    event: 'commented',
    excerpt: 'Captions written offline keep their order now',
    age: 'Yesterday',
    isUnread: false,
  },
  {
    id: 'n-6',
    kind: 'status',
    senderId: 'leo',
    taskNumber: 127,
    taskTitle: 'Paginate the notes list',
    taskType: 'task',
    event: 'moved it to Done',
    age: 'Mon',
    isUnread: false,
  },
];

export const ASSIGNED_TASKS: AssignedTask[] = [
  {
    number: 155,
    title: 'Empty states for the plant library',
    type: 'task',
    status: 'In review',
  },
  {
    number: 152,
    title: 'Offline drafts for field notes',
    type: 'story',
    status: 'In progress',
  },
  {
    number: 164,
    title: 'Copy for the weekly digest email',
    type: 'task',
    status: 'Todo',
  },
];
