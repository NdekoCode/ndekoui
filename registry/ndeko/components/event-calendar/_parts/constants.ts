import type { CalendarView, EventColor, EventColorOption } from './types';

export const EventHeight = 24;

export const EventGap = 4;

export const WeekCellsHeight = 64;

export const AgendaDaysToShow = 30;

export const StartHour = 0;
export const EndHour = 24;

export const DefaultStartHour = 9;
export const DefaultEndHour = 10;

/** The hour the week and day grids open on, so the morning shows without scrolling. */
export const ScrollToHour = 7;

export const WeekStartsOn = 0;

/** Height of the scrolling time grid and agenda when the calendar sizes itself to its content. */
export const ScrollAreaHeight = '34rem';

export const DefaultEventColor: EventColor = 'info';

export const EventColors: EventColorOption[] = [
  { value: 'info', label: 'Blue' },
  { value: 'primary', label: 'Indigo' },
  { value: 'success', label: 'Green' },
  { value: 'warning', label: 'Amber' },
  { value: 'destructive', label: 'Red' },
];

export type ViewOption = {
  view: CalendarView;
  label: string;
  shortcut: string;
};

export const ViewOptions: ViewOption[] = [
  { view: 'day', label: 'Day', shortcut: 'D' },
  { view: 'week', label: 'Week', shortcut: 'W' },
  { view: 'month', label: 'Month', shortcut: 'M' },
  { view: 'year', label: 'Year', shortcut: 'Y' },
  { view: 'agenda', label: 'Agenda', shortcut: 'A' },
];

export const AllViews: CalendarView[] = ViewOptions.map(
  (option) => option.view
);
