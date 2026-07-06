import type { SeriesSlot } from '@/registry/ndeko/lib/agent-run';

export const PIPELINE_NAME = 'Help center answers';

/** What travels along a wire. A wire only joins two ports of the same type. */
export type PortType = 'documents' | 'chunks' | 'vectors' | 'text';

export const PORT_TYPES: PortType[] = [
  'documents',
  'chunks',
  'vectors',
  'text',
];

export const TYPE_WORD: Record<PortType, string> = {
  documents: 'Documents',
  chunks: 'Chunks',
  vectors: 'Vectors',
  text: 'Text',
};

/** Each type keeps one series colour, on its ports, its wires and the legend. */
export const TYPE_SERIES: Record<PortType, SeriesSlot> = {
  documents: 1,
  chunks: 2,
  vectors: 3,
  text: 4,
};

export type NodeId = 'load' | 'split' | 'embed' | 'search' | 'answer';

export type NodeSpec = {
  id: NodeId;
  title: string;
  /** What the node takes. The first node of a pipeline takes nothing. */
  input: PortType | null;
  output: PortType;
  /** Its place along the pipeline, and whether it sits a step aside so the wires curve. */
  column: number;
  isAside: boolean;
  /** Said in the node while it runs. */
  workingLine: string;
  /** How long it runs in this demo, in milliseconds. */
  runMs: number;
};

export const NODES: NodeSpec[] = [
  {
    id: 'load',
    title: 'Load documents',
    input: null,
    output: 'documents',
    column: 0,
    isAside: false,
    workingLine: 'Reading the help center',
    runMs: 800,
  },
  {
    id: 'split',
    title: 'Split into chunks',
    input: 'documents',
    output: 'chunks',
    column: 1,
    isAside: true,
    workingLine: 'Cutting at headings',
    runMs: 1100,
  },
  {
    id: 'embed',
    title: 'Embed',
    input: 'chunks',
    output: 'vectors',
    column: 2,
    isAside: false,
    workingLine: 'Embedding the chunks',
    runMs: 1300,
  },
  {
    id: 'search',
    title: 'Search',
    input: 'vectors',
    output: 'chunks',
    column: 3,
    isAside: true,
    workingLine: 'Ranking the closest chunks',
    runMs: 1000,
  },
  {
    id: 'answer',
    title: 'Answer',
    input: 'chunks',
    output: 'text',
    column: 4,
    isAside: false,
    workingLine: 'Writing the answer',
    runMs: 1400,
  },
];

export function nodeOf(id: NodeId) {
  const node = NODES.find((candidate) => candidate.id === id);
  return node ?? NODES[0];
}

export function nodeIdOf(value: string | undefined | null) {
  const node = NODES.find((candidate) => candidate.id === value);
  return node?.id ?? null;
}

export type Link = {
  from: NodeId;
  to: NodeId;
};

/** The pipeline as it opens: nothing feeds Search yet. */
export const LINKS: Link[] = [
  { from: 'load', to: 'split' },
  { from: 'split', to: 'embed' },
  { from: 'search', to: 'answer' },
];

export type EmbedModelId = 'small' | 'large';

export type EmbedModel = {
  value: EmbedModelId;
  label: string;
  dimensions: number;
};

/** Invented models of an invented lab. */
export const EMBED_MODELS: EmbedModel[] = [
  { value: 'small', label: 'Lumen Embed Small', dimensions: 384 },
  { value: 'large', label: 'Lumen Embed Large', dimensions: 1024 },
];

export type Params = {
  chunkSize: number;
  model: EmbedModelId;
  topK: number;
  prompt: string;
};

export const CHUNK_SIZE = { min: 200, max: 1200, step: 100 };

export const TOP_K = { min: 1, max: 10 };

export const PARAMS: Params = {
  chunkSize: 400,
  model: 'small',
  topK: 5,
  prompt: 'How do I export my invoices?',
};

export const ARTICLE_COUNT = 42;

/** The tokens of the invented help center, which the chunk size divides. */
export const TOTAL_TOKENS = 109_200;

export type Passage = {
  title: string;
  score: string;
};

/** What Search finds for the sample question, best first. Illustrative. */
export const PASSAGES: Passage[] = [
  { title: 'Export invoices as CSV', score: '0.91' },
  { title: 'Download a receipt', score: '0.84' },
  { title: 'Change the billing email', score: '0.77' },
];

export const ANSWER_TEXT =
  'Open Billing, choose Invoices, then Export. The file is sent to your email.';

/** The one failure of the demo: Embed gives up the first time it runs. */
export const EMBED_FAILURE = 'The embedding service timed out after 30s';
