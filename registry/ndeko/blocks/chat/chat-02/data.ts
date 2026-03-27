export type ModelValue = 'swift' | 'deep';

export type Model = {
  value: ModelValue;
  label: string;
  hint: string;
};

export type AttachmentKind = 'document' | 'image';

export type Attachment = {
  id: string;
  name: string;
  size: number;
  kind: AttachmentKind;
};

export const models: Model[] = [
  { value: 'swift', label: 'Quill Swift', hint: 'Quick drafts and rewrites' },
  { value: 'deep', label: 'Quill Deep', hint: 'Careful edits on long pages' },
];

export const suggestions = [
  'Summarise this page in five lines',
  'Rewrite the intro for new hires',
  'Turn my meeting notes into a checklist',
];

export const seedAttachments: Attachment[] = [
  {
    id: 'seed-notes',
    name: 'Interview notes, March.pdf',
    size: 186_000,
    kind: 'document',
  },
];

export const maxFiles = 4;

export const maxBytes = 10 * 1024 * 1024;

export const sendingMs = 1100;

export const sentMs = 1400;
