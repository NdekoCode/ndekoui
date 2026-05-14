import type { CatalogEntry } from './types';

/** How much of the catalogue row a preview takes, so every composition shows whole. */
export type PreviewWidth = 'compact' | 'wide' | 'full';

const CATEGORY_WIDTHS: Record<string, PreviewWidth> = {
  accordion: 'wide',
  alert: 'wide',
  banner: 'full',
  breadcrumb: 'wide',
  'calendar-date-picker': 'wide',
  'event-calendar': 'full',
  'file-upload': 'wide',
  'image-cropper': 'wide',
  navbar: 'full',
  notification: 'wide',
  pagination: 'wide',
  stepper: 'full',
  table: 'full',
  tabs: 'wide',
  timeline: 'wide',
};

const ENTRY_WIDTHS: Record<string, PreviewWidth> = {
  'calendar-date-picker-19': 'full',
  'calendar-date-picker-20': 'full',
  'calendar-date-picker-21': 'full',
  'calendar-date-picker-22': 'full',
  'calendar-date-picker-23': 'full',
  'calendar-date-picker-24': 'full',
  'file-upload-11': 'full',
  'stepper-14': 'wide',
  'stepper-15': 'wide',
  'stepper-16': 'wide',
  'stepper-17': 'wide',
  'timeline-11': 'full',
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
