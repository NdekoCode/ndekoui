import type { CatalogEntry } from './types';

/** How much of the catalogue row a preview takes, so every composition shows whole. */
export type PreviewWidth = 'compact' | 'wide' | 'full';

const CATEGORY_WIDTHS: Record<string, PreviewWidth> = {
  accordion: 'wide',
  activity: 'wide',
  agent: 'wide',
  answer: 'wide',
  background: 'full',
  chart: 'wide',
  alert: 'wide',
  aside: 'wide',
  banner: 'full',
  breadcrumb: 'wide',
  'calendar-date-picker': 'wide',
  comment: 'wide',
  'event-calendar': 'full',
  'file-upload': 'wide',
  'image-cropper': 'wide',
  illustration: 'wide',
  loading: 'wide',
  modal: 'full',
  navbar: 'full',
  notification: 'wide',
  pagination: 'wide',
  prompt: 'wide',
  review: 'wide',
  run: 'wide',
  stepper: 'full',
  subtask: 'wide',
  table: 'full',
  tabs: 'wide',
  teams: 'wide',
  'text-effect': 'wide',
  timeline: 'wide',
};

const ENTRY_WIDTHS: Record<string, PreviewWidth> = {
  'agent-02': 'full',
  'agent-03': 'full',
  'agent-06': 'full',
  'run-02': 'full',
  'run-04': 'full',
  'activity-03': 'compact',
  'calendar-date-picker-19': 'full',
  'calendar-date-picker-20': 'full',
  'calendar-date-picker-21': 'full',
  'calendar-date-picker-22': 'full',
  'calendar-date-picker-23': 'full',
  'calendar-date-picker-24': 'full',
  'checkbox-19': 'wide',
  'file-upload-11': 'full',
  'input-45': 'wide',
  'pagination-09': 'full',
  'pagination-10': 'full',
  'radio-19': 'wide',
  'slider-14': 'wide',
  'slider-27': 'wide',
  'stepper-14': 'wide',
  'stepper-15': 'wide',
  'stepper-16': 'wide',
  'stepper-17': 'wide',
  'teams-02': 'compact',
  'teams-03': 'full',
  'teams-06': 'full',
  'teams-07': 'compact',
  'timeline-11': 'full',
  'tooltip-09': 'wide',
  'timeline-12': 'full',
};

const WIDTH_CLASSES: Record<PreviewWidth, string> = {
  compact: 'sm:col-span-3 xl:col-span-2',
  wide: 'sm:col-span-6 xl:col-span-3',
  full: 'sm:col-span-6',
};

export function previewWidthOf(entry: CatalogEntry): PreviewWidth {
  const entryWidth = ENTRY_WIDTHS[entry.name];
  if (entryWidth) {
    return entryWidth;
  }
  const categoryWidth = CATEGORY_WIDTHS[entry.category];
  if (categoryWidth) {
    return categoryWidth;
  }
  return 'compact';
}

export function widthClassOf(width: PreviewWidth) {
  return WIDTH_CLASSES[width];
}
