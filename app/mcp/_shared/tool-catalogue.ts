/*
 * One description per tool and prompt, read by the MCP server (for the agent) and by the page (for people),
 * so the two never disagree.
 */

export type ToolName =
  | 'list_items'
  | 'search_items'
  | 'get_item'
  | 'get_install_command'
  | 'get_theme'
  | 'get_design_guidelines'
  | 'list_categories';

export type ToolSummary = {
  name: ToolName;
  title: string;
  /** What the agent reads in its tool list. */
  description: string;
  /** What the page tells people. */
  summary: string;
  takes: string;
  returns: string;
};

export type PromptName = 'build_page' | 'rebuild_screen';

export type PromptSummary = {
  name: PromptName;
  title: string;
  description: string;
  takes: string;
};

export const TOOLS: ToolSummary[] = [
  {
    name: 'search_items',
    title: 'Search items',
    description:
      'Search the Ndeko UI registry by words, ranked like the search on ui.ndekocode.dev: titles first, then names, groups and descriptions. Use it before list_items when you know what you need ("pricing", "date range", "kanban"). Filter by kind: primitive, component, block, template, motion or lib.',
    summary:
      'Finds pieces by what they do, ranked the way the search on this site ranks them.',
    takes: 'query, optional kind and limit',
    returns: 'name, title, kind, category and description of each match',
  },
  {
    name: 'list_items',
    title: 'List items',
    description:
      'List Ndeko UI registry items of one kind. Kinds: primitive (Base UI building blocks such as button or dialog), component (ready compositions such as accordion-01), block (product sections such as heroes-01), template (whole pages), motion (animation components) and lib (theme, utilities, icons, sample images, hooks). Narrow with category: a category or group slug such as accordion, heroes or application, or a component family such as forms or overlays. Paged with offset and limit.',
    summary:
      'Walks one shelf of the catalogue, narrowed to a category, a family or a group.',
    takes: 'kind, optional category, offset and limit',
    returns: 'name, title, kind, category and description, with the total',
  },
  {
    name: 'get_item',
    title: 'Get item',
    description:
      'Get one Ndeko UI item by name: the full source of its files, its npm dependencies, the registry items it pulls in, the shadcn command that installs it and its page on ui.ndekocode.dev. Large templates return the source of their first files and list the rest; pass file with a path from that list to read one file.',
    summary:
      'Returns the source of every file, what it depends on, the command that installs it and the page that shows it.',
    takes: 'name, optional file',
    returns: 'files with source, dependencies, install command, preview link',
  },
  {
    name: 'get_install_command',
    title: 'Get install command',
    description:
      'Build the shadcn CLI command that installs one or more Ndeko UI items, for npm, pnpm, yarn or bun. Returns the command with full registry URLs, which works in any shadcn project, and the shorter @ndeko form for projects whose components.json declares the namespace.',
    summary:
      'Writes the shadcn command for several pieces at once, for npm, pnpm, yarn or bun.',
    takes: 'names, optional package manager',
    returns: 'the command with URLs and the @ndeko form',
  },
  {
    name: 'get_theme',
    title: 'Get theme',
    description:
      'Summarise the theme item every Ndeko UI piece depends on: the colour tokens with their light and dark values, the radius and easing tokens, and the utilities it adds (hairlines, chip-3d, keycap-3d, gem-plate, surface-raised, surface-brand). Read it before changing colours or writing new styles.',
    summary:
      'Lists the tokens for light and dark, the radius and easing scales and the utilities the theme adds.',
    takes: 'nothing',
    returns: 'tokens, Tailwind names, utilities and keyframes',
  },
  {
    name: 'get_design_guidelines',
    title: 'Get design guidelines',
    description:
      'The rules for writing UI that looks and moves like Ndeko UI: surfaces and hairlines, radius, colour, type, how to compose the Base UI primitives, the motion signatures and their timing, and what to avoid. Call it once before writing UI. Pass section with a number or a title ("7", "motion") to read one section of the design system in full, or "all" for the whole document.',
    summary:
      'Gives the agent the rules of the design system before it writes a line: radius, hairlines, materials, motion.',
    takes: 'optional section',
    returns: 'the key rules, or one section of the design system',
  },
  {
    name: 'list_categories',
    title: 'List categories',
    description:
      'The map of the Ndeko UI catalogue with counts: primitive groups, component families and their categories, block groups, template groups, motion groups and library items. Use the slugs it returns as the category of list_items.',
    summary:
      'Draws the map of the catalogue: families, categories and groups, each with its count.',
    takes: 'nothing',
    returns: 'every family, category and group with its count',
  },
];

export const PROMPTS: PromptSummary[] = [
  {
    name: 'build_page',
    title: 'Build a page with Ndeko UI',
    description:
      'Plans and builds a page from Ndeko UI blocks and components, following the design guidelines.',
    takes: 'what the page is for',
  },
  {
    name: 'rebuild_screen',
    title: 'Rebuild a screen with Ndeko UI',
    description:
      'Replaces the hand-made parts of an existing screen with the matching Ndeko UI pieces, keeping its data and behaviour.',
    takes: 'the screen, as a file path or a description',
  },
];

export function toolSummaryOf(name: ToolName) {
  const summary = TOOLS.find((tool) => tool.name === name);
  if (!summary) {
    throw new Error(`No summary for the tool ${name}`);
  }
  return summary;
}

export function promptSummaryOf(name: PromptName) {
  const summary = PROMPTS.find((prompt) => prompt.name === name);
  if (!summary) {
    throw new Error(`No summary for the prompt ${name}`);
  }
  return summary;
}
