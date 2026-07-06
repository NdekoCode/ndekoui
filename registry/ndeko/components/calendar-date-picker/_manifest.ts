import type { ComponentManifest } from '@/registry/ndeko/components/types';

export const manifest: ComponentManifest = [
  {
    name: 'calendar-date-picker-01',
    source: 'comp-487',
    title: 'Calendar',
    description: 'A react-aria calendar with today picked.',
  },
  {
    name: 'calendar-date-picker-02',
    source: 'comp-488',
    title: 'Range calendar',
    description:
      'A react-aria range of four days, tinted between its two ends.',
  },
  {
    name: 'calendar-date-picker-03',
    source: 'comp-489',
    title: 'Calendar with unavailable dates',
    description:
      'A react-aria range calendar that skips weekends, past days and booked days.',
  },
  {
    name: 'calendar-date-picker-04',
    source: 'comp-490',
    title: 'Day picker calendar',
    description: 'A react-day-picker calendar with today picked.',
  },
  {
    name: 'calendar-date-picker-05',
    source: 'comp-491',
    title: 'Day picker range',
    description: 'A range of four days that grows from its start to its end.',
  },
  {
    name: 'calendar-date-picker-06',
    source: 'comp-492',
    title: 'Range with closed days',
    description:
      'A range calendar that refuses past days, weekends and two closed periods.',
  },
  {
    name: 'calendar-date-picker-07',
    source: 'comp-493',
    title: 'Multiple days',
    description: 'Several days picked one by one.',
  },
  {
    name: 'calendar-date-picker-08',
    source: 'comp-494',
    title: 'Round picked day',
    description: 'The picked day drawn as a full circle.',
  },
  {
    name: 'calendar-date-picker-09',
    source: 'comp-495',
    title: 'Round range ends',
    description: 'Circular range ends joined by a tinted band.',
  },
  {
    name: 'calendar-date-picker-10',
    source: 'comp-496',
    title: 'Navigation on the right',
    description: 'The month on the left and both arrows on the right.',
  },
  {
    name: 'calendar-date-picker-11',
    source: 'comp-497',
    title: 'Month and year selects',
    description: 'Two selects replace the arrows to jump to any month.',
  },
  {
    name: 'calendar-date-picker-12',
    source: 'comp-498',
    title: 'Year select with arrows',
    description: 'A year select between the month arrows.',
  },
  {
    name: 'calendar-date-picker-13',
    source: 'comp-499',
    title: 'Week numbers',
    description: 'Six weeks shown at all times with their numbers.',
  },
  {
    name: 'calendar-date-picker-14',
    source: 'comp-500',
    title: 'Back to the current month',
    description: 'A button that brings the current month back into view.',
  },
  {
    name: 'calendar-date-picker-15',
    source: 'comp-501',
    title: 'Jump to today',
    description: 'A button that picks today and shows its month.',
  },
  {
    name: 'calendar-date-picker-16',
    source: 'comp-502',
    title: 'Calendar with date field',
    description: 'A typed date and the calendar stay in step.',
  },
  {
    name: 'calendar-date-picker-17',
    source: 'comp-503',
    title: 'Calendar with time field',
    description: 'A calendar followed by a time field with seconds.',
  },
  {
    name: 'calendar-date-picker-18',
    source: 'comp-504',
    title: 'Month and year view',
    description:
      'The month name opens a list of years to jump to any month between 1980 and 2030.',
  },
  {
    name: 'calendar-date-picker-19',
    source: 'comp-505',
    title: 'Appointment picker',
    description: 'A day and its free time slots side by side.',
  },
  {
    name: 'calendar-date-picker-20',
    source: 'comp-506',
    title: 'Calendar with presets',
    description: 'Quick picks beside the calendar, from today to last year.',
  },
  {
    name: 'calendar-date-picker-21',
    source: 'comp-507',
    title: 'Range with presets',
    description: 'Report ranges beside the calendar, from today to last year.',
  },
  {
    name: 'calendar-date-picker-22',
    source: 'comp-508',
    title: 'Two months',
    description: 'A range across two months that page together.',
  },
  {
    name: 'calendar-date-picker-23',
    source: 'comp-509',
    title: 'Three months',
    description: 'A range across three months that page together.',
  },
  {
    name: 'calendar-date-picker-24',
    source: 'comp-510',
    title: 'Pricing calendar',
    description:
      'Two months with a fictional fare under each day, the cheap ones in green.',
  },
  {
    name: 'calendar-date-picker-25',
    source: 'comp-41',
    title: 'Date picker',
    description: 'A react-aria date field that opens a calendar.',
  },
  {
    name: 'calendar-date-picker-26',
    source: 'comp-42',
    title: 'Date range picker',
    description:
      'A react-aria pair of date fields that opens a range calendar.',
  },
  {
    name: 'calendar-date-picker-27',
    source: 'comp-511',
    title: 'Popover date picker',
    description: 'A field-like trigger that opens a calendar in a popover.',
  },
  {
    name: 'calendar-date-picker-28',
    source: 'comp-512',
    title: 'Popover range picker',
    description:
      'A field-like trigger that opens a range calendar in a popover.',
  },
  {
    name: 'calendar-date-picker-29',
    source: 'ndeko',
    title: 'Typed date',
    description:
      'A date field that reads typed words such as "next fri 3pm" or "in 3 days", rolls the date it understood under the field, and opens a calendar from its button.',
  },
  {
    name: 'calendar-date-picker-30',
    source: 'ndeko',
    title: 'Period picker',
    description:
      'A popover that reads "since sep 3" or "last 2 weeks", lists periods with their dates, steps to a two-month range calendar, and shows the previous period when you compare.',
  },
];
