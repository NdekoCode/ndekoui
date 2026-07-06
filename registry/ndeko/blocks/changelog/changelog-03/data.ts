export type ChangeKind = 'new' | 'improved' | 'fixed';

export type Note = {
  id: string;
  date: string;
  title: string;
  kind: ChangeKind;
  summary: string;
  href: string;
};

export const KIND_STYLES: Record<ChangeKind, { label: string; color: string }> =
  {
    new: { label: 'New', color: 'var(--primary)' },
    improved: { label: 'Improved', color: 'var(--info)' },
    fixed: { label: 'Fixed', color: 'var(--success)' },
  };

export const APP = {
  name: 'Tidepool',
  badge: 'Sample release notes',
  allNotesHref: '#all-release-notes',
};

export const NOTES: Note[] = [
  {
    id: 'quiet-hours',
    date: '27 Oct',
    title: 'Quiet hours for every teammate',
    kind: 'new',
    summary: 'Invites inside your quiet hours suggest other times.',
    href: '#note-quiet-hours',
  },
  {
    id: 'zone-strip',
    date: '14 Oct',
    title: 'A time zone strip on every invite',
    kind: 'improved',
    summary: 'See each guest’s local time, from Kinshasa to Lisbon.',
    href: '#note-zone-strip',
  },
  {
    id: 'recurring-shift',
    date: '6 Oct',
    title: 'Recurring events keep their place',
    kind: 'fixed',
    summary: 'A weekly event no longer moves when clocks change.',
    href: '#note-recurring-shift',
  },
  {
    id: 'room-search',
    date: '23 Sep',
    title: 'Find a room by what it has',
    kind: 'new',
    summary: 'Search free rooms by screen, whiteboard or seats.',
    href: '#note-room-search',
  },
  {
    id: 'agenda-notes',
    date: '9 Sep',
    title: 'Agenda notes follow the event',
    kind: 'improved',
    summary: 'Notes stay with a meeting when it moves to another day.',
    href: '#note-agenda-notes',
  },
];

export const READ_AT_START: string[] = ['room-search', 'agenda-notes'];
