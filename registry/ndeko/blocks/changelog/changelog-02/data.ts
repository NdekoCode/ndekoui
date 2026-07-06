export type ChangeKind = 'new' | 'improved' | 'fixed';

export type TypeFilter = ChangeKind | 'all';

export type Entry = {
  id: string;
  date: string;
  title: string;
  kind: ChangeKind;
  summary: string;
  changes: string[];
};

export const KIND_STYLES: Record<ChangeKind, { label: string; color: string }> =
  {
    new: { label: 'New', color: 'var(--primary)' },
    improved: { label: 'Improved', color: 'var(--info)' },
    fixed: { label: 'Fixed', color: 'var(--success)' },
  };

export const FILTERS: { id: TypeFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'improved', label: 'Improved' },
  { id: 'fixed', label: 'Fixed' },
];

export const SECTION = {
  title: 'Tidepool changelog',
  description: 'What changed in the shared calendar, by month.',
  badge: 'Sample release notes',
};

export const ENTRIES: Entry[] = [
  {
    id: 'quiet-hours',
    date: '2026-10-27',
    title: 'Quiet hours for every teammate',
    kind: 'new',
    summary:
      'Set the hours you do not want invites, and Tidepool proposes other times for the people who write to you.',
    changes: [
      'Pick your quiet hours once, in your profile',
      'An invite inside them shows a gentle warning to its sender',
      'Suggested times skip them automatically',
    ],
  },
  {
    id: 'zone-strip',
    date: '2026-10-14',
    title: 'A time zone strip on every invite',
    kind: 'improved',
    summary:
      'Add up to four cities and see each guest’s local time right on the invite.',
    changes: [
      'Pick cities such as Kinshasa, Lisbon or Nairobi',
      'Hours outside working time are dimmed',
      'The strip remembers your last four cities',
    ],
  },
  {
    id: 'recurring-shift',
    date: '2026-10-06',
    title: 'Recurring events keep their place after a clock change',
    kind: 'fixed',
    summary:
      'A weekly event no longer moves by an hour for people whose region changes its clocks.',
    changes: [
      'Events follow the time zone of their owner',
      'Existing series were repaired in place',
    ],
  },
  {
    id: 'room-search',
    date: '2026-09-23',
    title: 'Find a room by what it has',
    kind: 'new',
    summary:
      'Search for a free room that has a screen, a whiteboard or enough chairs.',
    changes: [
      'Filter by equipment and by seats',
      'Rooms that fit are listed first',
      'Booking a room adds it to the invite',
    ],
  },
  {
    id: 'agenda-notes',
    date: '2026-09-09',
    title: 'Agenda notes follow the event',
    kind: 'improved',
    summary:
      'Notes written before a meeting stay with it when it moves to another day.',
    changes: [
      'Notes carry over when an event is rescheduled',
      'Guests see the latest notes in the invite',
    ],
  },
  {
    id: 'holiday-copies',
    date: '2026-09-02',
    title: 'Imported calendars no longer double their holidays',
    kind: 'fixed',
    summary:
      'Public holidays imported from a file are matched with the ones already there.',
    changes: [
      'Duplicate holidays are merged on import',
      'A summary lists what was merged',
    ],
  },
  {
    id: 'weekly-digest',
    date: '2026-08-26',
    title: 'A weekly digest of what changed',
    kind: 'new',
    summary:
      'One email on Monday with the events that moved, were added or were cancelled this week.',
    changes: [
      'Choose the day and the time it arrives',
      'Only your own calendars are included',
      'Turn it off from the email itself',
    ],
  },
  {
    id: 'midnight-drag',
    date: '2026-08-18',
    title: 'Dragging an event across midnight keeps its length',
    kind: 'fixed',
    summary:
      'An event dragged past midnight used to lose an hour. It now keeps the length it had.',
    changes: [
      'The new end time is shown while you drag',
      'Events of a whole day are not affected',
    ],
  },
  {
    id: 'arrow-keys',
    date: '2026-08-05',
    title: 'Move between days with the arrow keys',
    kind: 'improved',
    summary:
      'The day view answers to the arrow keys, so a keyboard is enough to plan a week.',
    changes: [
      'Left and right change the day',
      'Up and down move through the hours',
      'Enter opens the event under the cursor',
    ],
  },
  {
    id: 'file-import',
    date: '2026-07-21',
    title: 'Bring a calendar in from a file',
    kind: 'new',
    summary:
      'Drop a calendar file and choose which events to keep before anything is added.',
    changes: [
      'A preview lists every event found in the file',
      'Untick the ones you do not want',
    ],
  },
  {
    id: 'declined-flash',
    date: '2026-07-08',
    title: 'Declined invites no longer flash back',
    kind: 'fixed',
    summary:
      'An invite you declined used to appear again for a second before it left the list.',
    changes: ['The list updates once, when the answer is saved'],
  },
];
