import type { EventColor } from './types';

export const EventHeight = 24;

export const EventGap = 4;

export const WeekCellsHeight = 64;

export const AgendaDaysToShow = 30;

export const StartHour = 0;
export const EndHour = 24;

export const DefaultStartHour = 9;
export const DefaultEndHour = 10;

export const DefaultEventColor: EventColor = 'info';

export const EventColors: { value: EventColor; label: string }[] = [
  { value: 'info', label: 'Blue' },
  { value: 'primary', label: 'Indigo' },
  { value: 'success', label: 'Green' },
  { value: 'warning', label: 'Amber' },
  { value: 'destructive', label: 'Red' },
];
