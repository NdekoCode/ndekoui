import { z } from 'zod';

import {
  REGISTRY_ITEM_TEMPLATE,
  REGISTRY_NAMESPACE,
} from '@/app/mcp/_shared/mcp-config';
import { toolSummaryOf, type ToolName } from '@/app/mcp/_shared/tool-catalogue';
import { REGISTRY_URL } from '@/lib/site';

import {
  catalogueMap,
  findEntry,
  findInCatalogue,
  fullPageUrlOf,
  ITEM_KINDS,
  loadCatalogue,
  matchesCategory,
  summaryOf,
  type CatalogueEntry,
  type ItemKind,
} from './catalogue';
import {
  designDocument,
  designSections,
  findSection,
  keyRules,
  type DesignSection,
} from './design-guidelines';
import {
  addCommandOf,
  initCommandOf,
  namespacedAddCommandOf,
  PACKAGE_MANAGERS,
  type PackageManager,
} from './install-commands';
import { loadRegistryItem, type RegistryFile } from './registry-store';
import { searchCatalogue } from './search';
import type { McpServer } from './server-types';
import { themeSummary } from './theme-summary';

type TextContent = { type: 'text'; text: string };

type ToolResult = { content: TextContent[]; isError?: boolean };

type ItemDetails = ReturnType<typeof itemDetailsOf>;

const READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

const DEFAULT_LIST_LIMIT = 50;

const MAX_LIST_LIMIT = 200;

const DEFAULT_SEARCH_LIMIT = 10;

const MAX_SEARCH_LIMIT = 50;

const MAX_INSTALL_NAMES = 30;

/** Past this many characters of source, get_item lists the remaining files instead of sending them. */
const SOURCE_BUDGET = 60_000;

const ALL_SECTIONS = 'all';

const JSON_SUFFIX = '.json';

const LANGUAGES_BY_EXTENSION: Record<string, string> = {
  ts: 'ts',
  tsx: 'tsx',
  css: 'css',
  svg: 'svg',
  json: 'json',
};

const kindSchema = z.enum(ITEM_KINDS);

const packageManagerSchema = z.enum(PACKAGE_MANAGERS);

const nameSchema = z
  .string()
  .min(1)
  .max(120)
  .describe(
    'Registry name of an item, such as button, accordion-01 or heroes-02'
  );

const searchInput = z.object({
  query: z
    .string()
    .min(1)
    .max(200)
    .describe('Words that describe the piece, such as "date range picker"'),
  kind: kindSchema.optional().describe('Only return items of this kind'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(MAX_SEARCH_LIMIT)
    .default(DEFAULT_SEARCH_LIMIT),
});

const listInput = z.object({
  kind: kindSchema,
  category: z
    .string()
    .max(80)
    .optional()
    .describe(
      'A category or group slug (accordion, heroes, application) or a component family (forms, overlays)'
    ),
  offset: z.number().int().min(0).default(0),
  limit: z
    .number()
    .int()
    .min(1)
    .max(MAX_LIST_LIMIT)
    .default(DEFAULT_LIST_LIMIT),
});

const getItemInput = z.object({
  name: nameSchema,
  file: z
    .string()
    .max(300)
    .optional()
    .describe(
      'Path of one file from a previous get_item answer, to read only that file'
    ),
});

const installInput = z.object({
  names: z.array(nameSchema).min(1).max(MAX_INSTALL_NAMES),
  packageManager: packageManagerSchema.default('npm'),
});

const guidelinesInput = z.object({
  section: z
    .string()
    .max(80)
    .optional()
    .describe(
      'A section number or title ("7", "motion"), or "all" for the whole design system'
    ),
});

const noInput = z.object({});

function textOf(text: string): TextContent {
  return { type: 'text', text };
}

function textResult(text: string): ToolResult {
  const block = textOf(text);
  return { content: [block] };
}

function jsonResult(value: unknown): ToolResult {
  const text = JSON.stringify(value);
  return textResult(text);
}

function errorResult(message: string): ToolResult {
  const block = textOf(message);
  return { content: [block], isError: true };
}

function unknownItemResult(name: string) {
  return errorResult(
    `No ndekoui item is named "${name}". Call search_items with what it does, or list_items with a kind, to find its name.`
  );
}

function toolConfigOf(name: ToolName) {
  const summary = toolSummaryOf(name);
  return {
    title: summary.title,
    description: summary.description,
    annotations: { ...READ_ONLY, title: summary.title },
  };
}

/** Turns "https://ui.ndekocode.dev/r/accordion.json" into "accordion"; other registries keep their address. */
function registryDependencyNameOf(dependency: string) {
  const prefix = `${REGISTRY_URL}/`;
  const isOurs = dependency.startsWith(prefix);
  const isJson = dependency.endsWith(JSON_SUFFIX);
  const isOurItem = isOurs && isJson;
  if (!isOurItem) {
    return dependency;
  }
  const withoutPrefix = dependency.slice(prefix.length);
  const suffixLength = JSON_SUFFIX.length;
  return withoutPrefix.slice(0, -suffixLength);
}

function installedPathOf(file: RegistryFile) {
  return file.target ?? file.path;
}

function languageOf(filePath: string) {
  const parts = filePath.split('.');
  const extension = parts[parts.length - 1];
  return LANGUAGES_BY_EXTENSION[extension] ?? '';
}

function fileBlockOf(file: RegistryFile) {
  const installedPath = installedPathOf(file);
  const language = languageOf(installedPath);
  const source = file.content ?? '';
  return textOf(`File: ${installedPath}\n\`\`\`${language}\n${source}\n\`\`\``);
}

function matchesFilePath(file: RegistryFile, wanted: string) {
  const installedPath = installedPathOf(file);
  const isExactTarget = installedPath === wanted;
  const isExactSource = file.path === wanted;
  const endsWithWanted = installedPath.endsWith(`/${wanted}`);
  return isExactTarget || isExactSource || endsWithWanted;
}

function sizeOf(file: RegistryFile) {
  return file.content?.length ?? 0;
}

/** Files go out in order until the budget is spent; the first one always goes, so a large file stays readable. */
function splitByBudget(files: RegistryFile[]) {
  const sent: RegistryFile[] = [];
  const held: RegistryFile[] = [];
  let used = 0;
  for (const file of files) {
    const size = sizeOf(file);
    const usedWithFile = used + size;
    const fitsBudget = usedWithFile <= SOURCE_BUDGET;
    const isFirst = sent.length === 0;
    const isAfterHeldFile = held.length > 0;
    const isAllowed = fitsBudget || isFirst;
    const canSend = isAllowed && !isAfterHeldFile;
    if (canSend) {
      sent.push(file);
      used += size;
      continue;
    }
    held.push(file);
  }
  return { sent, held };
}

function heldFileOf(file: RegistryFile) {
  const size = sizeOf(file);
  const installedPath = installedPathOf(file);
  return { path: installedPath, characters: size };
}

function itemDetailsOf(entry: CatalogueEntry, files: RegistryFile[]) {
  const registryDependencies = entry.item.registryDependencies ?? [];
  const names = [entry.name];
  return {
    ...summaryOf(entry),
    type: entry.item.type,
    previewUrl: entry.previewUrl,
    fullPageUrl: fullPageUrlOf(entry),
    install: addCommandOf(names, 'npm'),
    installWithNamespace: namespacedAddCommandOf(names, 'npm'),
    dependencies: entry.item.dependencies ?? [],
    devDependencies: entry.item.devDependencies ?? [],
    registryDependencies: registryDependencies.map(registryDependencyNameOf),
    files: files.map(installedPathOf),
  };
}

function headerOf(details: ItemDetails, held: RegistryFile[]) {
  if (held.length === 0) {
    return details;
  }
  const filesNotSent = held.map(heldFileOf);
  return {
    ...details,
    filesNotSent,
    hint: 'Call get_item again with file set to one of filesNotSent to read it.',
  };
}

async function searchItems({
  query,
  kind,
  limit,
}: z.infer<typeof searchInput>) {
  const { total, shown } = await searchCatalogue(query, kind, limit);
  const items = shown.map(summaryOf);
  if (total === 0) {
    return jsonResult({
      query,
      total,
      items,
      hint: 'No match. Try fewer or broader words, or call list_categories to browse.',
    });
  }
  return jsonResult({ query, total, items });
}

function isOfKind(entry: CatalogueEntry, kind: ItemKind) {
  return entry.kind === kind;
}

async function listItems({
  kind,
  category,
  offset,
  limit,
}: z.infer<typeof listInput>) {
  const catalogue = await loadCatalogue();
  const ofKind = catalogue.filter((entry) => isOfKind(entry, kind));
  let matching = ofKind;
  if (category) {
    matching = ofKind.filter((entry) => matchesCategory(entry, category));
  }
  const total = matching.length;
  const end = offset + limit;
  const page = matching.slice(offset, end);
  const items = page.map(summaryOf);
  const hasMore = end < total;
  if (total === 0) {
    return jsonResult({
      kind,
      category,
      total,
      items,
      hint: 'Nothing in that category. Call list_categories for the slugs.',
    });
  }
  if (hasMore) {
    return jsonResult({
      kind,
      category,
      total,
      offset,
      nextOffset: end,
      items,
    });
  }
  return jsonResult({ kind, category, total, offset, items });
}

function oneFileResult(
  details: ItemDetails,
  files: RegistryFile[],
  file: string
) {
  const wanted = files.find((candidate) => matchesFilePath(candidate, file));
  if (!wanted) {
    const fileList = details.files.join(', ');
    return errorResult(
      `${details.name} has no file "${file}". Its files: ${fileList}`
    );
  }
  const block = fileBlockOf(wanted);
  return { content: [block] };
}

async function getItem({ name, file }: z.infer<typeof getItemInput>) {
  const entry = await findEntry(name);
  if (!entry) {
    return unknownItemResult(name);
  }
  const built = await loadRegistryItem(entry.name);
  const files = built.files ?? [];
  const details = itemDetailsOf(entry, files);
  if (file) {
    return oneFileResult(details, files, file);
  }
  const { sent, held } = splitByBudget(files);
  const fileBlocks = sent.map(fileBlockOf);
  const header = headerOf(details, held);
  const headerText = JSON.stringify(header);
  const headerBlock = textOf(headerText);
  return { content: [headerBlock, ...fileBlocks] };
}

function installAnswerOf(names: string[], packageManager: PackageManager) {
  const initCommand = initCommandOf(packageManager);
  return {
    packageManager,
    command: addCommandOf(names, packageManager),
    commandWithNamespace: namespacedAddCommandOf(names, packageManager),
    namespaceSetup: {
      file: 'components.json',
      add: { registries: { [REGISTRY_NAMESPACE]: REGISTRY_ITEM_TEMPLATE } },
    },
    firstTimeSetup: `A project without components.json runs ${initCommand} first.`,
    note: 'The theme and every primitive the items use are installed with them.',
  };
}

async function getInstallCommand({
  names,
  packageManager,
}: z.infer<typeof installInput>) {
  const catalogue = await loadCatalogue();
  const found: string[] = [];
  const unknown: string[] = [];
  for (const name of names) {
    const entry = findInCatalogue(catalogue, name);
    if (entry) {
      found.push(entry.name);
      continue;
    }
    unknown.push(name);
  }
  if (unknown.length > 0) {
    const unknownList = unknown.join(', ');
    return errorResult(
      `Unknown items: ${unknownList}. Call search_items to find their names.`
    );
  }
  const answer = installAnswerOf(found, packageManager);
  return jsonResult(answer);
}

async function getTheme() {
  const summary = await themeSummary();
  return jsonResult(summary);
}

function sectionLineOf(section: DesignSection) {
  return `${section.number}. ${section.title}`;
}

async function guidelinesOverview() {
  const sections = await designSections();
  const lines = sections.map(sectionLineOf);
  const sectionList = lines.join('\n');
  const rules = keyRules();
  return textResult(
    `${rules}\n## Sections of the design system\nPass one as section to read it in full.\n${sectionList}\n`
  );
}

function isWholeDocument(section: string) {
  const trimmed = section.trim();
  const lowered = trimmed.toLowerCase();
  return lowered === ALL_SECTIONS;
}

async function getDesignGuidelines({
  section,
}: z.infer<typeof guidelinesInput>) {
  if (!section) {
    return guidelinesOverview();
  }
  if (isWholeDocument(section)) {
    const document = await designDocument();
    return textResult(document);
  }
  const sections = await designSections();
  const found = findSection(sections, section);
  if (!found) {
    const titles = sections.map(sectionLineOf);
    const titleList = titles.join(', ');
    return errorResult(
      `No section matches "${section}". Sections: ${titleList}`
    );
  }
  return textResult(found.markdown);
}

async function listCategories() {
  const map = await catalogueMap();
  return jsonResult(map);
}

export function registerTools(server: McpServer) {
  server.registerTool(
    'search_items',
    { ...toolConfigOf('search_items'), inputSchema: searchInput },
    searchItems
  );
  server.registerTool(
    'list_items',
    { ...toolConfigOf('list_items'), inputSchema: listInput },
    listItems
  );
  server.registerTool(
    'get_item',
    { ...toolConfigOf('get_item'), inputSchema: getItemInput },
    getItem
  );
  server.registerTool(
    'get_install_command',
    { ...toolConfigOf('get_install_command'), inputSchema: installInput },
    getInstallCommand
  );
  server.registerTool(
    'get_theme',
    { ...toolConfigOf('get_theme'), inputSchema: noInput },
    getTheme
  );
  server.registerTool(
    'get_design_guidelines',
    { ...toolConfigOf('get_design_guidelines'), inputSchema: guidelinesInput },
    getDesignGuidelines
  );
  server.registerTool(
    'list_categories',
    { ...toolConfigOf('list_categories'), inputSchema: noInput },
    listCategories
  );
}
