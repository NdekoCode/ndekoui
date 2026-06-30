import { ClaudeMark, CursorMark, V0Mark } from '@/app/_site/open-in/tool-marks';
import {
  MCP_URL,
  SERVER_NAME,
  SERVER_TITLE,
} from '@/app/mcp/_shared/mcp-config';

import {
  ClaudeCodeMark,
  GeminiMark,
  McpMark,
  monogramOf,
  OpenCodeMark,
  WarpMark,
  WindsurfMark,
  ZedMark,
  type MarkComponent,
} from './client-marks';

export type SnippetLanguage = 'bash' | 'json' | 'toml';

export type SetupSnippet = {
  label: string;
  language: SnippetLanguage;
  code: string;
};

/** Text may hold `inline code` between backticks. */
export type SetupStep = {
  text: string;
  snippet?: SetupSnippet;
  /** Shows the name, transport and address to type into a form. */
  showsFields?: boolean;
};

export type ClientSetup = {
  id: string;
  name: string;
  Mark: MarkComponent;
  /** Shown as an "Add to" button in the hero. */
  isFeatured: boolean;
  installLink?: string;
  steps: SetupStep[];
  note?: string;
  sourceUrl: string;
  /** Defaults to the client's own docs. */
  sourceLabel?: string;
};

const JSON_INDENT = 2;

function jsonOf(value: unknown) {
  return JSON.stringify(value, null, JSON_INDENT);
}

function cursorInstallLink() {
  const config = JSON.stringify({ url: MCP_URL });
  const encodedConfig = btoa(config);
  const query = new URLSearchParams({
    name: SERVER_NAME,
    config: encodedConfig,
  });
  const queryString = query.toString();
  return `cursor://anysphere.cursor-deeplink/mcp/install?${queryString}`;
}

/** VS Code documents an https wrapper for links on websites, which opens the `vscode:` install link. */
function vsCodeInstallLink() {
  const config = JSON.stringify({
    name: SERVER_NAME,
    type: 'http',
    url: MCP_URL,
  });
  const encodedConfig = encodeURIComponent(config);
  const editorLink = `vscode:mcp/install?${encodedConfig}`;
  const encodedEditorLink = encodeURIComponent(editorLink);
  return `https://vscode.dev/redirect?url=${encodedEditorLink}`;
}

function kiroInstallLink() {
  const config = JSON.stringify({ url: MCP_URL });
  const query = new URLSearchParams({ name: SERVER_NAME, config });
  const queryString = query.toString();
  return `https://kiro.dev/launch/mcp/add?${queryString}`;
}

const VS_CODE_CLI_CONFIG = JSON.stringify({
  name: SERVER_NAME,
  type: 'http',
  url: MCP_URL,
});

const MCP_SERVERS_URL_ONLY = jsonOf({
  mcpServers: { [SERVER_NAME]: { url: MCP_URL } },
});

const CLAUDE_CODE: ClientSetup = {
  id: 'claude-code',
  name: 'Claude Code',
  Mark: ClaudeCodeMark,
  isFeatured: true,
  steps: [
    {
      text: 'Run this in a terminal. Add `--scope user` to use the server in every project, not only the current one.',
      snippet: {
        label: 'Terminal',
        language: 'bash',
        code: `claude mcp add --transport http ${SERVER_NAME} ${MCP_URL}`,
      },
    },
    {
      text: 'To share it with everyone on the project, commit it in `.mcp.json` at the root instead.',
      snippet: {
        label: '.mcp.json',
        language: 'json',
        code: jsonOf({
          mcpServers: { [SERVER_NAME]: { type: 'http', url: MCP_URL } },
        }),
      },
    },
  ],
  sourceUrl: 'https://code.claude.com/docs/en/mcp',
};

const CLAUDE: ClientSetup = {
  id: 'claude',
  name: 'Claude',
  Mark: ClaudeMark,
  isFeatured: true,
  steps: [
    {
      text: 'In Claude, on the web or in the desktop app, open Customize, then Connectors. Press Add and choose Add custom connector.',
    },
    {
      text: `Name it ${SERVER_TITLE}, paste the server address and continue. Under Authentication, choose No sign in, then press Add.`,
      showsFields: true,
    },
  ],
  note: 'On Team and Enterprise plans, an owner adds the connector once in Organization settings, then members connect it from Customize, Connectors. A free account holds one custom connector.',
  sourceUrl:
    'https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp',
};

const CHATGPT: ClientSetup = {
  id: 'chatgpt',
  name: 'ChatGPT',
  Mark: monogramOf('G'),
  isFeatured: true,
  steps: [
    {
      text: 'Open chatgpt.com/plugins, press the plus button and choose Add custom MCP server.',
    },
    {
      text: 'Enter a name and a short description, then paste the server address as the connection.',
      showsFields: true,
    },
    {
      text: 'The server needs no authentication. Confirm the warning and choose Create as a plugin.',
    },
  ],
  note: 'Your plan and your workspace settings decide whether custom MCP servers are available.',
  sourceUrl: 'https://developers.openai.com/apps-sdk/deploy/connect-chatgpt',
};

const CODEX: ClientSetup = {
  id: 'codex',
  name: 'Codex',
  Mark: monogramOf('Cx'),
  isFeatured: true,
  steps: [
    {
      text: 'Run this in a terminal.',
      snippet: {
        label: 'Terminal',
        language: 'bash',
        code: `codex mcp add ${SERVER_NAME} --url ${MCP_URL}`,
      },
    },
    {
      text: 'Or add the server to `~/.codex/config.toml` yourself.',
      snippet: {
        label: '~/.codex/config.toml',
        language: 'toml',
        code: `[mcp_servers.${SERVER_NAME}]\nurl = "${MCP_URL}"`,
      },
    },
  ],
  sourceUrl: 'https://learn.chatgpt.com/docs/extend/mcp?surface=cli',
};

const CURSOR: ClientSetup = {
  id: 'cursor',
  name: 'Cursor',
  Mark: CursorMark,
  isFeatured: true,
  installLink: cursorInstallLink(),
  steps: [
    {
      text: 'Press Add to Cursor above and confirm in Cursor, or add the server to `~/.cursor/mcp.json` for every project, `.cursor/mcp.json` for one.',
      snippet: {
        label: 'mcp.json',
        language: 'json',
        code: MCP_SERVERS_URL_ONLY,
      },
    },
  ],
  sourceUrl: 'https://cursor.com/docs/context/mcp',
};

const VS_CODE: ClientSetup = {
  id: 'vs-code',
  name: 'VS Code',
  Mark: monogramOf('VS'),
  isFeatured: true,
  installLink: vsCodeInstallLink(),
  steps: [
    {
      text: 'Press Add to VS Code above and review the server before you install it. Or add it to `.vscode/mcp.json` in your workspace.',
      snippet: {
        label: '.vscode/mcp.json',
        language: 'json',
        code: jsonOf({
          servers: { [SERVER_NAME]: { type: 'http', url: MCP_URL } },
        }),
      },
    },
    {
      text: 'From a terminal, this adds it to your user profile.',
      snippet: {
        label: 'Terminal',
        language: 'bash',
        code: `code --add-mcp '${VS_CODE_CLI_CONFIG}'`,
      },
    },
  ],
  sourceUrl:
    'https://code.visualstudio.com/docs/agents/reference/mcp-configuration',
};

const WINDSURF: ClientSetup = {
  id: 'windsurf',
  name: 'Windsurf',
  Mark: WindsurfMark,
  isFeatured: false,
  steps: [
    {
      text: 'Open the MCP settings and add a custom server with these values.',
      showsFields: true,
    },
  ],
  note: 'The Windsurf docs now open on the Devin Desktop docs, which list Streamable HTTP among the supported transports.',
  sourceUrl: 'https://docs.devin.ai/desktop/cascade/mcp',
  sourceLabel: 'Devin Desktop docs',
};

const GEMINI_CLI: ClientSetup = {
  id: 'gemini-cli',
  name: 'Gemini CLI',
  Mark: GeminiMark,
  isFeatured: false,
  steps: [
    {
      text: 'Run this in a terminal. Without `--scope user`, the server is added to the current project only.',
      snippet: {
        label: 'Terminal',
        language: 'bash',
        code: `gemini mcp add --transport http --scope user ${SERVER_NAME} ${MCP_URL}`,
      },
    },
    {
      text: 'Or add it to `~/.gemini/settings.json`. `httpUrl` is the key for a Streamable HTTP server.',
      snippet: {
        label: '~/.gemini/settings.json',
        language: 'json',
        code: jsonOf({
          mcpServers: { [SERVER_NAME]: { httpUrl: MCP_URL } },
        }),
      },
    },
  ],
  sourceUrl: 'https://geminicli.com/docs/tools/mcp-server/',
};

const ZED: ClientSetup = {
  id: 'zed',
  name: 'Zed',
  Mark: ZedMark,
  isFeatured: false,
  steps: [
    {
      text: 'Add the server under `context_servers` in your Zed `settings.json`.',
      snippet: {
        label: 'settings.json',
        language: 'json',
        code: jsonOf({
          context_servers: { [SERVER_NAME]: { url: MCP_URL } },
        }),
      },
    },
  ],
  sourceUrl: 'https://zed.dev/docs/ai/mcp',
};

const KIRO: ClientSetup = {
  id: 'kiro',
  name: 'Kiro',
  Mark: monogramOf('K'),
  isFeatured: false,
  installLink: kiroInstallLink(),
  steps: [
    {
      text: 'Press Add to Kiro above, or add the server to `.kiro/settings/mcp.json` in your workspace, `~/.kiro/settings/mcp.json` for every workspace.',
      snippet: {
        label: 'mcp.json',
        language: 'json',
        code: MCP_SERVERS_URL_ONLY,
      },
    },
  ],
  sourceUrl: 'https://kiro.dev/docs/mcp/configuration/',
};

const OPENCODE: ClientSetup = {
  id: 'opencode',
  name: 'OpenCode',
  Mark: OpenCodeMark,
  isFeatured: false,
  steps: [
    {
      text: 'Add the server to `opencode.json` at the root of the project, or to `~/.config/opencode/opencode.json` for every project.',
      snippet: {
        label: 'opencode.json',
        language: 'json',
        code: jsonOf({
          $schema: 'https://opencode.ai/config.json',
          mcp: {
            [SERVER_NAME]: { type: 'remote', url: MCP_URL, enabled: true },
          },
        }),
      },
    },
  ],
  sourceUrl: 'https://opencode.ai/docs/mcp-servers/',
};

const WARP: ClientSetup = {
  id: 'warp',
  name: 'Warp',
  Mark: WarpMark,
  isFeatured: false,
  steps: [
    {
      text: 'Open Settings, then Agents, then MCP servers. Choose Add and paste this configuration.',
      snippet: {
        label: 'MCP server',
        language: 'json',
        code: MCP_SERVERS_URL_ONLY,
      },
    },
  ],
  sourceUrl:
    'https://docs.warp.dev/agent-platform/warp-agents/agent-context/mcp',
};

const V0: ClientSetup = {
  id: 'v0',
  name: 'v0',
  Mark: V0Mark,
  isFeatured: false,
  steps: [
    {
      text: 'In the prompt form, open the plus menu and choose MCPs.',
    },
    {
      text: 'Add a custom server with the address below and no authentication.',
      showsFields: true,
    },
  ],
  sourceUrl: 'https://v0.app/docs/MCP',
};

const LOVABLE: ClientSetup = {
  id: 'lovable',
  name: 'Lovable',
  Mark: monogramOf('L'),
  isFeatured: false,
  steps: [
    {
      text: 'Open Connectors, choose Add custom, then MCP server.',
    },
    {
      text: 'Enter the name and the server address, and connect without credentials.',
      showsFields: true,
    },
  ],
  note: 'Lovable uses the server while it chats with you; the app it publishes does not call it.',
  sourceUrl: 'https://docs.lovable.dev/integrations/custom-mcp',
};

const OTHER_CLIENTS: ClientSetup = {
  id: 'other',
  name: 'Other clients',
  Mark: McpMark,
  isFeatured: false,
  steps: [
    {
      text: 'Any client that speaks MCP over Streamable HTTP takes these values.',
      showsFields: true,
    },
    {
      text: 'A client that only starts local servers can reach it through `mcp-remote`, which runs on your machine and forwards every call.',
      snippet: {
        label: 'Local bridge',
        language: 'json',
        code: jsonOf({
          mcpServers: {
            [SERVER_NAME]: {
              command: 'npx',
              args: ['-y', 'mcp-remote', MCP_URL],
            },
          },
        }),
      },
    },
  ],
  sourceUrl: 'https://www.npmjs.com/package/mcp-remote',
  sourceLabel: 'mcp-remote on npm',
};

export const CLIENTS: ClientSetup[] = [
  CLAUDE_CODE,
  CLAUDE,
  CHATGPT,
  CODEX,
  CURSOR,
  VS_CODE,
  WINDSURF,
  GEMINI_CLI,
  ZED,
  KIRO,
  OPENCODE,
  WARP,
  V0,
  LOVABLE,
  OTHER_CLIENTS,
];

export const DEFAULT_CLIENT_ID = CLAUDE_CODE.id;

export const SETUP_SECTION_ID = 'setup';

function isFeatured(client: ClientSetup) {
  return client.isFeatured;
}

export const FEATURED_CLIENTS = CLIENTS.filter(isFeatured);

export function sourceLabelOf(client: ClientSetup) {
  if (client.sourceLabel) {
    return client.sourceLabel;
  }
  return `${client.name} docs`;
}

export function clientTabIdOf(clientId: string) {
  return `mcp-client-${clientId}`;
}
