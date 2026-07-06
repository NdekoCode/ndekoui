import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';

export type SceneModel = {
  id: string;
  /** The name people call the model by, without a version number. */
  name: string;
  brand: BrandSlug;
};

export const CLAUDE: SceneModel = {
  id: 'claude',
  name: 'Claude',
  brand: 'claude',
};

export const CHATGPT: SceneModel = {
  id: 'chatgpt',
  name: 'ChatGPT',
  brand: 'openai',
};

export const GEMINI: SceneModel = {
  id: 'gemini',
  name: 'Gemini',
  brand: 'gemini',
};

export const MISTRAL: SceneModel = {
  id: 'mistral',
  name: 'Mistral',
  brand: 'mistral',
};

export const DEEPSEEK: SceneModel = {
  id: 'deepseek',
  name: 'DeepSeek',
  brand: 'deepseek',
};

export const LLAMA: SceneModel = {
  id: 'llama',
  name: 'Llama',
  brand: 'meta',
};

export const GROK: SceneModel = {
  id: 'grok',
  name: 'Grok',
  brand: 'grok',
};

export const QWEN: SceneModel = {
  id: 'qwen',
  name: 'Qwen',
  brand: 'qwen',
};

export const COMMAND: SceneModel = {
  id: 'command',
  name: 'Command',
  brand: 'cohere',
};

export const SONAR: SceneModel = {
  id: 'sonar',
  name: 'Sonar',
  brand: 'perplexity',
};
