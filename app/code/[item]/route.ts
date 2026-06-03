import fs from 'node:fs/promises';
import path from 'node:path';

import { codeToHtml } from '@/lib/shiki';
import registry from '@/registry.json';

type RegistryFile = { path: string; target?: string };

type RegistryEntry = { name: string; files?: RegistryFile[] };

type CodeRouteContext = { params: Promise<{ item: string }> };

const ENTRIES = registry.items as RegistryEntry[];

const READABLE_ROOTS = ['registry/', 'components/core/', 'hooks/'];

export const dynamic = 'force-static';

function hasFiles(entry: RegistryEntry) {
  const fileCount = entry.files?.length ?? 0;
  return fileCount > 0;
}

export function generateStaticParams() {
  const withFiles = ENTRIES.filter(hasFiles);
  return withFiles.map((entry) => ({ item: entry.name }));
}

function isReadable(filePath: string) {
  const normalized = path.posix.normalize(filePath);
  const isInsideRoot = READABLE_ROOTS.some((root) =>
    normalized.startsWith(root)
  );
  const climbsOut = normalized.includes('..');
  return isInsideRoot && !climbsOut;
}

function labelOf(file: RegistryFile) {
  if (file.target) {
    return file.target;
  }
  return path.posix.basename(file.path);
}

async function highlightedFileOf(file: RegistryFile) {
  const absolutePath = path.join(process.cwd(), file.path);
  const source = await fs.readFile(absolutePath, 'utf8');
  const html = await codeToHtml({ code: source, lang: 'tsx' });
  return { label: labelOf(file), source, html };
}

/** The highlighted source of one registry item, loaded when its code dialog opens. */
export async function GET(_request: Request, { params }: CodeRouteContext) {
  const { item } = await params;
  const entry = ENTRIES.find((candidate) => candidate.name === item);
  if (!entry) {
    return Response.json({ error: 'Unknown item' }, { status: 404 });
  }
  const files = entry.files ?? [];
  const readableFiles = files.filter((file) => isReadable(file.path));
  const highlighted = await Promise.all(readableFiles.map(highlightedFileOf));
  return Response.json({ files: highlighted });
}
