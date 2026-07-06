export type DocsExample = {
  /** The docs page the example belongs to, such as `dock`. */
  slug: string;
  /** The file of the example in that folder, without its extension. */
  example: string;
  title: string;
  pageTitle: string;
  /** The id of the heading above the example; empty when the heading has no plain text id. */
  anchor: string;
  isReplayable: boolean;
};
