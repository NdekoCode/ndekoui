import { createMcpHandler } from 'mcp-handler';

import packageJson from '@/package.json';

import { registerPrompts } from './_server/register-prompts';
import { registerTools } from './_server/register-tools';
import { MCP_PAGE_PATH, SERVER_NAME } from './_shared/mcp-config';

export const dynamic = 'force-dynamic';

const SERVER_INSTRUCTIONS = [
  'Ndeko UI is an open-source React library (Base UI, motion, Tailwind CSS 4) installed with the shadcn CLI: primitives, components, blocks, templates and motion components that share one theme.',
  'Call get_design_guidelines once before writing UI. Find pieces with search_items, or browse with list_categories and list_items. Read one with get_item, then install with the command from get_install_command.',
  'The server is read-only: it returns data and commands, and never changes a project.',
].join('\n');

/** Browser-based clients call from another origin; the server is public and keeps no credentials, so any origin may read it. */
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Accept, Authorization, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID',
  'Access-Control-Expose-Headers': 'Mcp-Session-Id, Mcp-Protocol-Version',
  'Access-Control-Max-Age': '86400',
};

const BROWSER_REDIRECT_STATUS = 307;

const mcpHandler = createMcpHandler(
  (server) => {
    registerTools(server);
    registerPrompts(server);
  },
  {
    serverInfo: { name: SERVER_NAME, version: packageJson.version },
    instructions: SERVER_INSTRUCTIONS,
  }
);

function withCors(response: Response) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(CORS_HEADERS)) {
    headers.set(name, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/** MCP clients never ask for HTML, so a person who opens the server address lands on the setup page. */
function isBrowserVisit(request: Request) {
  const accept = request.headers.get('accept') ?? '';
  return accept.includes('text/html');
}

async function handle(request: Request) {
  const response = await mcpHandler(request);
  return withCors(response);
}

export async function GET(request: Request) {
  if (isBrowserVisit(request)) {
    const pageUrl = new URL(MCP_PAGE_PATH, request.url);
    return Response.redirect(pageUrl, BROWSER_REDIRECT_STATUS);
  }
  return handle(request);
}

export function POST(request: Request) {
  return handle(request);
}

export function DELETE(request: Request) {
  return handle(request);
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
