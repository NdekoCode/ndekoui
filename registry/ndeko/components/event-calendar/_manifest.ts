import type { ComponentManifest } from '@/registry/ndeko/components/types';

export const manifest: ComponentManifest = [
  {
    name: 'event-calendar-01',
    source: 'comp-542',
    title: 'Event calendar',
    description:
      'Day, week, month, year and agenda views behind a segmented switch, with events you drag to a new slot and edit in one dialog',
  },
  {
    name: 'event-calendar-02',
    source: 'ndeko',
    title: 'Month view',
    description:
      'A month of events where spans read as bars and timed events as a dot with their time, and busy days fold into a list',
  },
  {
    name: 'event-calendar-03',
    source: 'ndeko',
    title: 'Week view',
    description:
      'Seven days on an hour grid that opens on the morning, with all-day events on top and a line at the current time',
  },
  {
    name: 'event-calendar-04',
    source: 'ndeko',
    title: 'Day view',
    description:
      'One day on an hour grid where overlapping events sit side by side and a click on a free slot plans a new one',
  },
  {
    name: 'event-calendar-05',
    source: 'ndeko',
    title: 'Year view',
    description:
      'Twelve compact months tinted by how busy each day is, with the picked day listed beside them',
  },
  {
    name: 'event-calendar-06',
    source: 'ndeko',
    title: 'Agenda',
    description:
      'The next thirty days as a list grouped by day, with the time, title and place of every event',
  },
  {
    name: 'event-calendar-07',
    source: 'ndeko',
    title: 'Month with the day’s events',
    description:
      'A small month with a dot on busy days beside the events of the picked day, which change in place',
  },
];
