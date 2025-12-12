export type ComponentManifestEntry = {
  /** File name without extension, also the registry item name: `button-01`. */
  name: string;
  /** The Origin UI composition it was redrawn from, for attribution: `comp-78`. */
  source: string;
  title: string;
  description: string;
};

export type ComponentManifest = ComponentManifestEntry[];
