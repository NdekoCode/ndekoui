import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';

export const INSTRUCTIONS_LIMIT = 600;

export type ModelId =
  'claude-haiku' | 'claude-sonnet' | 'gpt-mini' | 'gemini-pro';

export type Model = {
  id: ModelId;
  name: string;
  brand: BrandSlug;
  /** A coarse word for the demo, not a fact about the model. */
  hint: string;
};

/** Families without a version number. */
export const MODELS: Model[] = [
  {
    id: 'claude-haiku',
    name: 'Claude Haiku',
    brand: 'claude',
    hint: 'Quick replies',
  },
  {
    id: 'claude-sonnet',
    name: 'Claude Sonnet',
    brand: 'claude',
    hint: 'Everyday work',
  },
  { id: 'gpt-mini', name: 'GPT mini', brand: 'openai', hint: 'Bulk tasks' },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    brand: 'gemini',
    hint: 'Long documents',
  },
];

export function modelOf(id: ModelId) {
  const model = MODELS.find((candidate) => candidate.id === id);
  return model ?? MODELS[0];
}

export type ToolId = 'orders' | 'email' | 'refunds' | 'drive';

export type AgentTool = {
  id: ToolId;
  name: string;
  /** What switching it on lets the agent do. */
  allows: string;
  brand?: BrandSlug;
};

export const TOOLS: AgentTool[] = [
  {
    id: 'orders',
    name: 'Look up orders',
    allows: 'Reads an order, its items and where the parcel is',
  },
  {
    id: 'email',
    name: 'Send email',
    allows: 'Sends as support@solwaybooks.example, after you approve',
    brand: 'gmail',
  },
  {
    id: 'refunds',
    name: 'Refund a payment',
    allows: 'Refunds up to $50 on its own and asks you above that',
    brand: 'stripe',
  },
  {
    id: 'drive',
    name: 'Read shared files',
    allows: 'Reads the Support folder, never writes to it',
    brand: 'googledrive',
  },
];

export type KnowledgeFile = {
  id: string;
  name: string;
  size: string;
};

export const FIRST_FILES: KnowledgeFile[] = [
  { id: 'returns', name: 'Returns policy.pdf', size: '184 KB' },
  { id: 'shipping', name: 'Shipping times.md', size: '12 KB' },
];

/** The sample files Add a file brings in, in order. Nothing leaves the page. */
export const SAMPLE_FILES: KnowledgeFile[] = [
  { id: 'gift-cards', name: 'Gift cards FAQ.pdf', size: '96 KB' },
  { id: 'price-list', name: 'Price list autumn.csv', size: '41 KB' },
];

export type AgentConfig = {
  name: string;
  modelId: ModelId;
  instructions: string;
  tools: Record<ToolId, boolean>;
  fileIds: string[];
};

export const LIVE_VERSION = 3;

const LIVE_INSTRUCTIONS =
  'You answer customers of Solway Books. Be brief and kind. Look the order up before you answer a question about it.';

/** What version 3 runs with today. */
export const LIVE_CONFIG: AgentConfig = {
  name: 'Refunds helper',
  modelId: 'claude-haiku',
  instructions: LIVE_INSTRUCTIONS,
  tools: { orders: true, email: true, refunds: false, drive: false },
  fileIds: ['returns', 'shipping'],
};

/** The sentence the demonstration adds to the instructions. */
export const DEMO_SENTENCE =
  ' Refund a damaged item at once when the order is under $50.';

export const DEMO_INSTRUCTIONS = `${LIVE_INSTRUCTIONS}${DEMO_SENTENCE}`;

export const DEMO_QUESTION =
  'My copy of The Salt Road arrived torn. Can I get my money back?';

export const REPLY_WITH_REFUND =
  'I am sorry about the torn copy. I found order SB-20418 and refunded the $18.90. It reaches your card in 5 to 7 business days.';

export const REPLY_WITHOUT_REFUND =
  'I am sorry about the torn copy. I found order SB-20418, but I cannot refund it myself. I have passed it to the team.';

export const REPLY_WITHOUT_ORDERS =
  'I am sorry about the torn copy. Could you send me the order number, so the team can look it up?';

export type Sample = {
  id: string;
  prompt: string;
  /** The tool the agent needs to pass this sample. */
  needs?: ToolId;
  failure: string;
};

export const SAMPLES: Sample[] = [
  {
    id: 'where',
    prompt: 'Where is my order?',
    needs: 'orders',
    failure: 'The agent cannot look the order up',
  },
  {
    id: 'torn',
    prompt: 'My book arrived torn, I want a refund',
    needs: 'refunds',
    failure: 'The agent has no way to refund',
  },
  {
    id: 'tone',
    prompt: 'This is the worst shop I have ever used',
    failure: 'The reply was not calm',
  },
];
