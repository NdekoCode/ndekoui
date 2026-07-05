'use client';

import { useSession } from '@/registry/ndeko/hooks/use-session';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { CheckIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { Fold, Swap } from '@/registry/ndeko/ui/chat-motion';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { Spinner } from '@/registry/ndeko/ui/spinner';

import { EditorTiles, OptionSwitch, type Option } from './choices';
import { ConfigBlock } from './config-block';
import {
  editorOf,
  SERVER,
  snippetOf,
  type Editor,
  type Scope,
  type Snippet,
  type Transport,
} from './data';
import {
  CONNECT_MS,
  INITIAL,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  SCRIPT,
  type Connection,
} from './session';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

const TRANSPORTS: Option<Transport>[] = [
  { value: 'remote', label: 'Remote' },
  { value: 'local', label: 'Local' },
];

const SCOPES: Option<Scope>[] = [
  { value: 'project', label: 'This project' },
  { value: 'everywhere', label: 'Everywhere' },
];

type EdgeStyle = React.CSSProperties & { '--edge': string };

/** The edge takes the colour of the editor the card waits for, and keeps it once connected. */
function edgeOf(isLit: boolean) {
  if (isLit) {
    return 'ring-2 ring-(--edge)';
  }
  return 'hairline-ring ring-border';
}

/** An editor with one list of servers has no project choice to offer. */
function shownScopeOf(editor: Editor, scope: Scope): Scope {
  if (editor.scopeNote) {
    return 'everywhere';
  }
  return scope;
}

function idleLineOf(snippet: Snippet, editor: Editor) {
  if (snippet.language === 'bash') {
    return 'Copy the command and run it in a terminal';
  }
  if (snippet.language === 'fields') {
    return `Copy the values into the MCP settings of ${editor.name}`;
  }
  return `Copy the config into ${snippet.label}`;
}

function toolsWordOf(count: number) {
  if (count === 1) {
    return '1 tool';
  }
  return `${count} tools`;
}

function statusLineOf(
  connection: Connection,
  snippet: Snippet,
  editor: Editor
) {
  if (connection === 'waiting') {
    return `Waiting for the first connection from ${editor.name}`;
  }
  if (connection === 'connected') {
    return `Connected, ${toolsWordOf(SERVER.toolCount)}`;
  }
  return idleLineOf(snippet, editor);
}

function statusToneOf(connection: Connection) {
  if (connection === 'idle') {
    return 'text-muted-foreground';
  }
  return 'text-foreground';
}

export default function AgentOps05() {
  const {
    ref,
    isInView,
    isAutoplaying,
    state,
    act,
    pressed,
    isFinished,
    restart,
  } = useSession(SESSION);
  const { schedule } = useTimeouts();
  const editor = editorOf(state.editorId);
  const scope = shownScopeOf(editor, state.scope);
  const snippet = snippetOf(editor.id, state.transport, scope);
  const configKey = `${editor.id}:${state.transport}:${scope}`;
  const isCopied = state.connection !== 'idle';
  const isWaiting = state.connection === 'waiting';
  const isConnected = state.connection === 'connected';
  const hasScopeNote = editor.scopeNote !== undefined;
  const statusLine = statusLineOf(state.connection, snippet, editor);
  const edgeStyle: EdgeStyle = { '--edge': seriesColorOf(editor.series) };
  const message = spokenUnless(isAutoplaying, statusLine);
  const canReplay = isFinished && !isAutoplaying;

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet.copyText);
    } catch {
      return;
    }
    act({ type: 'copied' });
    schedule(() => act({ type: 'connected' }), CONNECT_MS);
  }

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-background text-foreground @container min-h-dvh w-full'
      >
        <div className='mx-auto flex max-w-2xl flex-col gap-5 p-4 @3xl:p-8'>
          <header className='flex flex-wrap items-center gap-x-3 gap-y-2'>
            <BrandTile brand='mcp' size='lg' />
            <div className='flex min-w-40 flex-1 flex-col gap-0.5 leading-tight'>
              <h1 className='text-lg font-semibold text-balance'>
                Add {SERVER.title} to your editor
              </h1>
              <code className='text-muted-foreground truncate font-mono text-xs'>
                {SERVER.url}
              </code>
            </div>
            <ReplayButton
              isShown={canReplay}
              onReplay={restart}
              label='Replay the install'
            />
          </header>

          <section
            aria-label='Install'
            style={edgeStyle}
            className={cn(
              'bg-card dark:bg-foreground/[0.03] flex flex-col gap-4 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-shadow duration-300 ease-(--ease-out-strong)',
              edgeOf(isCopied)
            )}
          >
            <EditorTiles
              value={editor.id}
              onValueChange={(id) => act({ type: 'editor', id })}
            />

            <div className='flex flex-col gap-2'>
              <div className='flex flex-wrap items-center gap-2'>
                <OptionSwitch
                  label='Where the server runs'
                  value={state.transport}
                  options={TRANSPORTS}
                  onValueChange={(transport) =>
                    act({ type: 'transport', transport })
                  }
                  className='w-40'
                />
                <OptionSwitch
                  label='Where the editor uses it'
                  value={scope}
                  options={SCOPES}
                  isDisabled={hasScopeNote}
                  onValueChange={(next) => act({ type: 'scope', scope: next })}
                  className='w-52'
                />
              </div>
              <Fold open={hasScopeNote}>
                <p className='text-muted-foreground text-xs'>
                  {editor.scopeNote}
                </p>
              </Fold>
            </div>

            <ConfigBlock
              editorId={editor.id}
              configKey={configKey}
              snippet={snippet}
              isCopied={isCopied}
              isCopyPressed={pressed === 'copy'}
              onCopy={copy}
            />

            <p
              className={cn(
                'flex min-h-6 items-center gap-2 text-[13px] transition-colors duration-200',
                statusToneOf(state.connection)
              )}
            >
              <Swap swapKey={state.connection} className='size-4 shrink-0'>
                {isWaiting && <Spinner label='Waiting' />}
                {isConnected && (
                  <CheckIcon className='text-success-foreground size-4' />
                )}
                {!isCopied && (
                  <span
                    aria-hidden='true'
                    className='bg-muted-foreground/40 m-auto size-1.5 rounded-full'
                  />
                )}
              </Swap>
              <Swap swapKey={statusLine}>{statusLine}</Swap>
            </p>
          </section>
        </div>
        <LiveRegion message={message} />
      </div>
    </ClockGate>
  );
}
