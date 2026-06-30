export type CalendarView = 'day' | 'week' | 'month' | 'year' | 'agenda';

export type TimedView = 'month' | 'week' | 'day';

export type EventColor =
  'primary' | 'info' | 'success' | 'warning' | 'destructive';

export type EventColorOption = { value: EventColor; label: string };

export type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  color?: EventColor;
  location?: string;
};
