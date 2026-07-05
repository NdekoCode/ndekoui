import type { SeriesSlot } from '@/registry/ndeko/lib/agent-run';
import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';

/** A fictional server: the address answers nothing. */
export const SERVER = {
  title: 'Harbor docs',
  name: 'harbor',
  url: 'https://mcp.example.dev/mcp',
  localCommand: 'npx',
  localArgs: ['-y', '@harbor-example/mcp'],
  toolCount: 7,
};

export type Transport = 'remote' | 'local';

export type Scope = 'project' | 'everywhere';

export type EditorId =
  'claude-code' | 'cursor' | 'vs-code' | 'windsurf' | 'zed' | 'codex';

export type Editor = {
  id: EditorId;
  name: string;
  /** The mark of the editor when the mark set holds it; its initial on a tile otherwise. */
  brand?: BrandSlug;
  initial: string;
  /** The colour the card takes while it waits for this editor. */
  series: SeriesSlot;
  /** Said under the switches when the editor keeps one list of servers for every project. */
  scopeNote?: string;
};

export const EDITORS: Editor[] = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    brand: 'claudecode',
    initial: 'C',
    series: 1,
  },
  { id: 'cursor', name: 'Cursor', brand: 'cursor', initial: 'C', series: 2 },
  { id: 'vs-code', name: 'VS Code', initial: 'V', series: 3 },
  {
    id: 'windsurf',
    name: 'Windsurf',
    brand: 'windsurf',
    initial: 'W',
    series: 4,
    scopeNote: 'Windsurf keeps one list of servers for every project',
  },
  { id: 'zed', name: 'Zed', brand: 'zed', initial: 'Z', series: 5 },
  {
    id: 'codex',
    name: 'Codex',
    brand: 'codex',
    initial: 'C',
    series: 1,
    scopeNote: 'Codex keeps its servers in one file for every project',
  },
];

export function editorOf(id: EditorId) {
  const editor = EDITORS.find((candidate) => candidate.id === id);
  return editor ?? EDITORS[0];
}

export type SnippetLanguage = 'bash' | 'json' | 'toml' | 'fields';

export type Snippet = {
  /** A terminal, the path of a file, or the settings screen the values go in. */
  label: string;
  language: SnippetLanguage;
  lines: string[];
  /** What Copy puts on the clipboard. */
  copyText: string;
  copyLabel: string;
};

const JSON_INDENT = 2;

function linesOfJson(value: unknown) {
  const text = JSON.stringify(value, null, JSON_INDENT);
  return text.split('\n');
}

function snippetOfLines(
  label: string,
  language: SnippetLanguage,
  lines: string[]
): Snippet {
  return {
    label,
    language,
    lines,
    copyText: lines.join('\n'),
    copyLabel: 'Copy',
  };
}

function localCommandLine() {
  const args = SERVER.localArgs.join(' ');
  return `${SERVER.localCommand} ${args}`;
}

function scopeFlagOf(scope: Scope) {
  if (scope === 'everywhere') {
    return ' --scope user';
  }
  return '';
}

function claudeCodeSnippet(transport: Transport, scope: Scope) {
  const scopeFlag = scopeFlagOf(scope);
  if (transport === 'local') {
    const command = localCommandLine();
    const line = `claude mcp add${scopeFlag} ${SERVER.name} -- ${command}`;
    return snippetOfLines('Terminal', 'bash', [line]);
  }
  const line = `claude mcp add --transport http${scopeFlag} ${SERVER.name} ${SERVER.url}`;
  return snippetOfLines('Terminal', 'bash', [line]);
}

function mcpServersEntryOf(transport: Transport) {
  if (transport === 'local') {
    return { command: SERVER.localCommand, args: SERVER.localArgs };
  }
  return { url: SERVER.url };
}

function cursorPathOf(scope: Scope) {
  if (scope === 'everywhere') {
    return '~/.cursor/mcp.json';
  }
  return '.cursor/mcp.json';
}

function cursorSnippet(transport: Transport, scope: Scope) {
  const entry = mcpServersEntryOf(transport);
  const lines = linesOfJson({ mcpServers: { [SERVER.name]: entry } });
  return snippetOfLines(cursorPathOf(scope), 'json', lines);
}

function vsCodeEntryOf(transport: Transport) {
  if (transport === 'local') {
    return {
      type: 'stdio',
      command: SERVER.localCommand,
      args: SERVER.localArgs,
    };
  }
  return { type: 'http', url: SERVER.url };
}

/** In a workspace VS Code reads a file; for every workspace its command line adds the server to the user profile. */
function vsCodeSnippet(transport: Transport, scope: Scope) {
  const entry = vsCodeEntryOf(transport);
  if (scope === 'everywhere') {
    const config = JSON.stringify({ name: SERVER.name, ...entry });
    const line = `code --add-mcp '${config}'`;
    return snippetOfLines('Terminal', 'bash', [line]);
  }
  const lines = linesOfJson({ servers: { [SERVER.name]: entry } });
  return snippetOfLines('.vscode/mcp.json', 'json', lines);
}

function windsurfSnippet(transport: Transport): Snippet {
  if (transport === 'local') {
    const command = localCommandLine();
    return {
      label: 'Windsurf, MCP settings',
      language: 'fields',
      lines: [`Name     ${SERVER.name}`, `Command  ${command}`],
      copyText: command,
      copyLabel: 'Copy the command',
    };
  }
  return {
    label: 'Windsurf, MCP settings',
    language: 'fields',
    lines: [
      `Name       ${SERVER.name}`,
      'Transport  Streamable HTTP',
      `Address    ${SERVER.url}`,
    ],
    copyText: SERVER.url,
    copyLabel: 'Copy the address',
  };
}

function zedPathOf(scope: Scope) {
  if (scope === 'everywhere') {
    return '~/.config/zed/settings.json';
  }
  return '.zed/settings.json';
}

function zedSnippet(transport: Transport, scope: Scope) {
  const entry = mcpServersEntryOf(transport);
  const lines = linesOfJson({ context_servers: { [SERVER.name]: entry } });
  return snippetOfLines(zedPathOf(scope), 'json', lines);
}

function codexSnippet(transport: Transport) {
  const header = `[mcp_servers.${SERVER.name}]`;
  if (transport === 'local') {
    const args = JSON.stringify(SERVER.localArgs).replaceAll(',', ', ');
    const lines = [
      header,
      `command = "${SERVER.localCommand}"`,
      `args = ${args}`,
    ];
    return snippetOfLines('~/.codex/config.toml', 'toml', lines);
  }
  const lines = [header, `url = "${SERVER.url}"`];
  return snippetOfLines('~/.codex/config.toml', 'toml', lines);
}

/** The config each editor reads, in the form its own documentation gives. */
export function snippetOf(
  editorId: EditorId,
  transport: Transport,
  scope: Scope
): Snippet {
  switch (editorId) {
    case 'claude-code':
      return claudeCodeSnippet(transport, scope);
    case 'cursor':
      return cursorSnippet(transport, scope);
    case 'vs-code':
      return vsCodeSnippet(transport, scope);
    case 'windsurf':
      return windsurfSnippet(transport);
    case 'zed':
      return zedSnippet(transport, scope);
    case 'codex':
      return codexSnippet(transport);
  }
}
