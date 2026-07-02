import Link from 'next/link';
import type { CSSProperties } from 'react';

import { CopyButton } from '@/app/_site/copy-button';
import { CLIENTS, type ClientSetup } from '@/app/mcp/_components/clients';
import { MCP_PAGE_PATH, MCP_URL } from '@/app/mcp/_shared/mcp-config';
import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';

/** The editors and assistants shown in the grid, in the order of the MCP page. */
const GRID_CLIENT_IDS = [
  'claude',
  'claude-code',
  'chatgpt',
  'codex',
  'cursor',
  'vs-code',
  'windsurf',
  'gemini-cli',
  'zed',
  'kiro',
  'opencode',
  'warp',
];

const OTHER_CLIENT_ID = 'other';

/* Tile colours from Simple Icons 16.33.0, the set the marks come from. Clients it has no mark for keep a neutral tile. */
const TILE_COLOURS: Record<string, string> = {
  claude: '#D97757',
  'claude-code': '#D97757',
  cursor: '#000000',
  windsurf: '#0B100F',
  'gemini-cli': '#8E75B2',
  zed: '#084CCF',
  opencode: '#000000',
  warp: '#01A4FF',
};

const NEUTRAL_TILE = '#27272a';

function gridClients() {
  const shown: ClientSetup[] = [];
  for (const id of GRID_CLIENT_IDS) {
    const client = CLIENTS.find((candidate) => candidate.id === id);
    if (client) {
      shown.push(client);
    }
  }
  return shown;
}

function tileStyleOf(clientId: string) {
  const colour = TILE_COLOURS[clientId] ?? NEUTRAL_TILE;
  return { '--tile': colour } as CSSProperties;
}

/** Where a client's link goes: its own install link when it has one, otherwise its steps on the MCP page. */
export function clientGuideHrefOf(client: ClientSetup) {
  if (client.installLink) {
    return client.installLink;
  }
  return `${MCP_PAGE_PATH}?client=${client.id}`;
}

function actionLabelOf(client: ClientSetup) {
  if (client.isFeatured) {
    return `Add to ${client.name}`;
  }
  return 'View install guide';
}

function AppTile({ client }: { client: ClientSetup }) {
  const { Mark } = client;

  return (
    <span
      style={tileStyleOf(client.id)}
      className='flex size-10 items-center justify-center rounded-[0.7rem] bg-[linear-gradient(to_bottom,color-mix(in_oklab,var(--tile)_80%,white),var(--tile))] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.22),inset_0_0_0_1px_rgb(255_255_255/0.08),0_1px_2px_rgb(0_0_0/0.3)]'
    >
      <Mark className='size-5 text-[10px] text-white' />
    </span>
  );
}

const CELL_LINK =
  'group hover:bg-foreground/[0.03] focus-visible:ring-ring/50 flex h-full min-h-36 flex-col justify-between gap-8 p-5 transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-inset';

type CellLinkProps = {
  href: string;
  children: React.ReactNode;
};

/** Install links open the editor itself (cursor://, vscode:), so only site paths go through Next's Link. */
function CellLink({ href, children }: CellLinkProps) {
  const isSitePath = href.startsWith('/');
  if (isSitePath) {
    return (
      <Link href={href} className={CELL_LINK}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={CELL_LINK}>
      {children}
    </a>
  );
}

function ClientCell({ client }: { client: ClientSetup }) {
  return (
    <li className='bg-background'>
      <CellLink href={clientGuideHrefOf(client)}>
        <AppTile client={client} />
        <span className='flex flex-col gap-0.5'>
          <span className='text-muted-foreground text-[13px]'>
            {client.name}
          </span>
          <span className='flex items-center gap-1 text-sm font-medium'>
            {actionLabelOf(client)}
            <ArrowRightIcon className='size-3.5 transition-transform duration-150 group-hover:translate-x-0.5' />
          </span>
        </span>
      </CellLink>
    </li>
  );
}

/** One cell per editor, each with its app tile and the link that connects it, and the server address for the rest. */
export function EditorGrid() {
  const clients = gridClients();

  return (
    <div className='hairline-ring ring-border overflow-hidden rounded-2xl'>
      <ul className='bg-border grid grid-cols-2 gap-(--hairline) md:grid-cols-3 lg:grid-cols-4'>
        {clients.map((client) => (
          <ClientCell key={client.id} client={client} />
        ))}
        <li className='bg-background col-span-full flex flex-wrap items-center justify-between gap-4 p-5'>
          <p className='text-muted-foreground text-sm text-pretty'>
            {'Using an app that is not listed? '}
            <Link
              href={`${MCP_PAGE_PATH}?client=${OTHER_CLIENT_ID}`}
              className='text-foreground focus-visible:ring-ring/50 rounded-sm underline underline-offset-4 outline-none focus-visible:ring-[3px]'
            >
              Follow the manual setup guide
            </Link>
            {' and use this server address.'}
          </p>
          <div className='bg-foreground/[0.05] flex max-w-full items-center gap-1 rounded-lg py-1 ps-3 pe-1'>
            <code className='min-w-0 truncate font-mono text-[13px]'>
              {MCP_URL}
            </code>
            <CopyButton value={MCP_URL} label='Copy the server address' />
          </div>
        </li>
      </ul>
    </div>
  );
}
