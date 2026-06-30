export const SEARCH_KINDS = [
  'primitive',
  'component',
  'block',
  'template',
  'motion',
] as const;

export type SearchKind = (typeof SEARCH_KINDS)[number];

export type SearchEntry = {
  kind: SearchKind;
  name: string;
  title: string;
  group: string;
  description: string;
  href: string;
  /** Absent when the group has no page of its own, like the motion docs groups. */
  groupHref?: string;
};

export type SearchIndexPayload = {
  entries: SearchEntry[];
};
