import { groupsOf } from '@/app/blocks/_shared/bundles';
import type { BundleKind } from '@/app/blocks/_shared/types';
import { countComponents } from '@/app/components/_catalog/families';
import { catalog } from '@/app/components/_generated/catalog';
import { NAVIGATION } from '@/app/docs/navigation';
import { MCP_PAGE_PATH, MCP_URL } from '@/app/mcp/_shared/mcp-config';
import { countLabel, installCommandOf, REGISTRY_URL } from '@/lib/site';
import { chatItems } from '@/registry/chat-items';
import { primitiveItems } from '@/registry/items';

import { absoluteUrlOf, AUTHOR_URL, SITE_NAME } from './seo';

/*
 * The llms.txt convention (llmstxt.org): a short Markdown map of the site for language models,
 * and a longer file with every installable item. Both are built from the same data as the pages.
 */

const GETTING_STARTED = 'Getting Started';

function linkLineOf(name: string, path: string, note: string) {
  const url = absoluteUrlOf(path);
  return `- [${name}](${url}): ${note}`;
}

function entryTotalOf(kind: BundleKind) {
  let total = 0;
  for (const group of groupsOf(kind)) {
    total += group.entries.length;
  }
  return total;
}

function primitiveTotal() {
  return primitiveItems.length + chatItems.length;
}

function summaryOf() {
  const components = countLabel(
    countComponents(catalog),
    'component',
    'components'
  );
  const categories = countLabel(catalog.length, 'category', 'categories');
  const blocks = countLabel(entryTotalOf('blocks'), 'block', 'blocks');
  const templates = countLabel(
    entryTotalOf('templates'),
    'template',
    'templates'
  );
  const primitives = countLabel(primitiveTotal(), 'primitive', 'primitives');
  return `${SITE_NAME} is an open-source React library under the MIT licence: ${components} in ${categories}, ${blocks}, ${templates} and ${primitives}, built on Base UI, motion and Tailwind CSS 4. Every item animates its changes of state and installs with the shadcn CLI, with the theme and the primitives it uses.`;
}

function installSection() {
  const example = installCommandOf('notification-28');
  return [
    '## Install',
    '',
    `Each item is a shadcn registry item at ${REGISTRY_URL}/<name>.json. For example: \`${example}\`.`,
    `Editors and assistants can also connect to the MCP server at ${MCP_URL} to search the catalogue, read the source of an item and get its install command.`,
  ];
}

function groupNamesOf(kind: BundleKind) {
  const names = groupsOf(kind).map((group) => group.name.toLowerCase());
  return names.join(', ');
}

/** The cases where an assistant can point to the library, so it can match a request to it. */
function whenToUseSection() {
  return [
    '## When to use it',
    '',
    '- A React 19 app or site styled with Tailwind CSS 4 and set up with the shadcn CLI, in Next.js, Vite, React Router or another framework the CLI supports.',
    `- Product screens, ready as blocks: ${groupNamesOf('blocks')}.`,
    `- Whole pages, ready as templates: ${groupNamesOf('templates')}.`,
    '- Interfaces where state changes should be animated: the components use motion for their enter, exit and layout changes.',
    `- Building with an AI assistant: connect the MCP server at ${MCP_URL} so the assistant searches the catalogue and installs finished items instead of writing them from scratch.`,
  ];
}

function docsSection() {
  return [
    '## Docs',
    '',
    linkLineOf(
      'Installation',
      '/docs/installation',
      'set up a project and add the first item'
    ),
    linkLineOf(
      'MCP server',
      MCP_PAGE_PATH,
      'connect Claude, Cursor, Codex and other MCP clients'
    ),
    linkLineOf(
      'Primitives',
      '/kit',
      `the ${primitiveTotal()} building blocks every component uses`
    ),
    `- [Registry index](${REGISTRY_URL}/registry.json): every item with its files, in the shadcn registry format`,
  ];
}

function componentsSection() {
  const lines = catalog.map((category) => {
    const count = countLabel(
      category.entries.length,
      'component',
      'components'
    );
    return linkLineOf(category.name, `/components/${category.slug}`, count);
  });
  return ['## Components', '', ...lines];
}

function bundleSection(kind: BundleKind, heading: string) {
  const lines = groupsOf(kind).map((group) => {
    const count = countLabel(group.entries.length, 'entry', 'entries');
    return linkLineOf(group.name, `/${kind}/${group.slug}`, count);
  });
  return [`## ${heading}`, '', ...lines];
}

function motionSection() {
  const motionGroups = NAVIGATION.filter(
    (group) => group.name !== GETTING_STARTED
  );
  const lines = motionGroups.flatMap((group) =>
    group.children.map((child) =>
      linkLineOf(child.name, child.href, group.name.toLowerCase())
    )
  );
  return ['## Motion components', '', ...lines];
}

/** The map: what the library is, how to install it, and one link per section of the catalogue. */
export function llmsIndexText() {
  const lines = [
    `# ${SITE_NAME}`,
    '',
    `> ${summaryOf()}`,
    '',
    ...installSection(),
    '',
    ...whenToUseSection(),
    '',
    ...docsSection(),
    '',
    ...componentsSection(),
    '',
    ...bundleSection('blocks', 'Blocks'),
    '',
    ...bundleSection('templates', 'Templates'),
    '',
    ...motionSection(),
    '',
    '## Optional',
    '',
    linkLineOf(
      'Full catalogue',
      '/llms-full.txt',
      'every component, block and template with its description and install command'
    ),
    `- [Author](${AUTHOR_URL}): ndekocode`,
    '',
  ];
  return lines.join('\n');
}

type InstallableEntry = {
  name: string;
  title: string;
  description: string;
};

function entryLineOf(entry: InstallableEntry) {
  const command = installCommandOf(entry.name);
  return `- ${entry.name}, ${entry.title}: ${entry.description} Install: \`${command}\``;
}

function fullComponentsSection() {
  return catalog.flatMap((category) => [
    `### ${category.name}`,
    '',
    ...category.entries.map(entryLineOf),
    '',
  ]);
}

function fullBundleSection(kind: BundleKind) {
  return groupsOf(kind).flatMap((group) => [
    `### ${group.name}`,
    '',
    ...group.entries.map(entryLineOf),
    '',
  ]);
}

/** Every installable item, one line each, grouped as on the site. */
export function llmsFullText() {
  const primitives = [...primitiveItems, ...chatItems];
  const lines = [
    `# ${SITE_NAME}: full catalogue`,
    '',
    `> ${summaryOf()}`,
    '',
    ...installSection(),
    '',
    '## Primitives',
    '',
    ...primitives.map(entryLineOf),
    '',
    '## Components',
    '',
    ...fullComponentsSection(),
    '## Blocks',
    '',
    ...fullBundleSection('blocks'),
    '## Templates',
    '',
    ...fullBundleSection('templates'),
  ];
  return lines.join('\n');
}
