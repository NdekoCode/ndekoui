export type BlockManifestEntry = {
  /** Folder name and registry item name: `app-shell-01`. */
  name: string;
  title: string;
  description: string;
  /** Files of the block folder; the first one default-exports the block. */
  files: string[];
  /** Height of the preview frame in pixels. */
  previewHeight?: number;
};

export type BlockManifest = BlockManifestEntry[];
