import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';

export const AGENT_NAME = 'Support agent';

export type Transport = 'remote' | 'local';

export const TRANSPORT_WORD: Record<Transport, string> = {
  remote: 'Remote',
  local: 'Local',
};

export type Access = 'read' | 'write';

export type Tool = {
  name: string;
  summary: string;
  access: Access;
};

export type Server = {
  id: string;
  name: string;
  transport: Transport;
  /** The mark of a known product. A server of your own gets a picture drawn from its name. */
  brand?: BrandSlug;
  /** Shown for a server of your own: its address or the command that starts it. */
  address?: string;
  tools: Tool[];
};

/** Tool lists written for this demo: what a server really offers comes from the server. */
export const SERVERS: Server[] = [
  {
    id: 'github',
    name: 'GitHub',
    transport: 'remote',
    brand: 'github',
    tools: [
      {
        name: 'search_code',
        summary: 'Find code across the repositories',
        access: 'read',
      },
      {
        name: 'get_pull_request',
        summary: 'Read a pull request and its checks',
        access: 'read',
      },
      {
        name: 'list_issues',
        summary: 'List open issues by label',
        access: 'read',
      },
      {
        name: 'create_issue',
        summary: 'Open an issue in a repository',
        access: 'write',
      },
      {
        name: 'comment_on_issue',
        summary: 'Reply in an issue thread',
        access: 'write',
      },
      {
        name: 'merge_pull_request',
        summary: 'Merge a pull request into its base',
        access: 'write',
      },
    ],
  },
  {
    id: 'linear',
    name: 'Linear',
    transport: 'remote',
    brand: 'linear',
    tools: [
      {
        name: 'list_issues',
        summary: 'List the issues of a team',
        access: 'read',
      },
      { name: 'get_issue', summary: 'Read one issue', access: 'read' },
      {
        name: 'create_issue',
        summary: 'Create an issue for a team',
        access: 'write',
      },
      {
        name: 'update_issue',
        summary: 'Change the state or the owner of an issue',
        access: 'write',
      },
    ],
  },
  {
    id: 'notion',
    name: 'Notion',
    transport: 'remote',
    brand: 'notion',
    tools: [
      { name: 'search', summary: 'Search the workspace', access: 'read' },
      { name: 'get_page', summary: 'Read a page', access: 'read' },
      {
        name: 'create_page',
        summary: 'Create a page under a parent',
        access: 'write',
      },
      {
        name: 'append_to_page',
        summary: 'Add blocks at the end of a page',
        access: 'write',
      },
    ],
  },
  {
    id: 'orders',
    name: 'Orders database',
    transport: 'local',
    brand: 'postgresql',
    address: 'node ./mcp/orders-db.js',
    tools: [
      {
        name: 'describe_table',
        summary: 'Read the columns of a table',
        access: 'read',
      },
      {
        name: 'run_query',
        summary: 'Run a read-only query',
        access: 'read',
      },
      {
        name: 'update_order',
        summary: 'Change the state of one order',
        access: 'write',
      },
    ],
  },
];

export const ADDED_SERVER_ID = 'added';

/** What the test connection finds on the server the dialog adds. */
export const FOUND_TOOLS: Tool[] = [
  {
    name: 'search_docs',
    summary: 'Search the help center',
    access: 'read',
  },
  { name: 'get_article', summary: 'Read one article', access: 'read' },
  {
    name: 'list_collections',
    summary: 'List the collections of articles',
    access: 'read',
  },
  {
    name: 'suggest_edit',
    summary: 'Propose a change to an article',
    access: 'write',
  },
  {
    name: 'create_draft',
    summary: 'Start a draft article',
    access: 'write',
  },
  {
    name: 'publish_article',
    summary: 'Publish a draft',
    access: 'write',
  },
];

export const DEMO_NAME = 'Docs search';

export const DEMO_ADDRESS_FIRST = 'https://mcp.example.dev';

export const DEMO_ADDRESS = 'https://mcp.example.dev/mcp';
