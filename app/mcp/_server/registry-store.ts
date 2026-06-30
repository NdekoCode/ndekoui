import fs from 'node:fs/promises';
import path from 'node:path';

import { z } from 'zod';

/*
 * The registry JSON and the design system are read from disk. `public/` is served by the CDN and is not
 * part of a serverless function, so `next.config.mjs` traces these files into the `/mcp` function.
 */

const registryFileSchema = z.object({
  path: z.string(),
  type: z.string(),
  target: z.string().optional(),
  content: z.string().optional(),
});

const registryItemSchema = z.object({
  name: z.string(),
  type: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  categories: z.array(z.string()).optional(),
  dependencies: z.array(z.string()).optional(),
  devDependencies: z.array(z.string()).optional(),
  registryDependencies: z.array(z.string()).optional(),
  files: z.array(registryFileSchema).optional(),
  cssVars: z.record(z.string(), z.record(z.string(), z.string())).optional(),
  css: z.record(z.string(), z.unknown()).optional(),
});

const registryIndexSchema = z.object({
  items: z.array(registryItemSchema),
});

export type RegistryFile = z.infer<typeof registryFileSchema>;

export type RegistryItem = z.infer<typeof registryItemSchema>;

const REGISTRY_DIRECTORY = ['public', 'r'];

const DESIGN_SYSTEM_PATH = ['docs', 'DESIGN-SYSTEM.md'];

let indexPromise: Promise<RegistryItem[]> | null = null;

let designSystemPromise: Promise<string> | null = null;

function projectPathOf(segments: string[]) {
  return path.join(/*turbopackIgnore: true*/ process.cwd(), ...segments);
}

async function readJson(segments: string[]) {
  const filePath = projectPathOf(segments);
  const text = await fs.readFile(filePath, 'utf8');
  const parsed: unknown = JSON.parse(text);
  return parsed;
}

async function readIndex() {
  const segments = [...REGISTRY_DIRECTORY, 'registry.json'];
  const parsed = await readJson(segments);
  const index = registryIndexSchema.parse(parsed);
  return index.items;
}

/** Every item of the registry, without file contents. A failed read is retried on the next call. */
export function loadRegistryIndex() {
  if (!indexPromise) {
    indexPromise = readIndex().catch((error: unknown) => {
      indexPromise = null;
      throw error;
    });
  }
  return indexPromise;
}

/** One built item with the source of its files. Callers pass a name taken from the index, never raw input. */
export async function loadRegistryItem(name: string) {
  const segments = [...REGISTRY_DIRECTORY, `${name}.json`];
  const parsed = await readJson(segments);
  return registryItemSchema.parse(parsed);
}

async function readDesignSystem() {
  const filePath = projectPathOf(DESIGN_SYSTEM_PATH);
  return fs.readFile(filePath, 'utf8');
}

export function loadDesignSystem() {
  if (!designSystemPromise) {
    designSystemPromise = readDesignSystem().catch((error: unknown) => {
      designSystemPromise = null;
      throw error;
    });
  }
  return designSystemPromise;
}
