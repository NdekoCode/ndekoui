'use client';

import { MotionNumber } from '@/components/core/motion-number';
import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import {
  ArrowRightIcon,
  CircleCheckIcon,
  CircleXIcon,
  CpuIcon,
  FileTextIcon,
  MessageSquareTextIcon,
  MinusIcon,
  PlusIcon,
  ScissorsIcon,
  SearchIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';
import { Input } from '@/registry/ndeko/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';
import { Slider } from '@/registry/ndeko/ui/slider';

import {
  CHUNK_SIZE,
  EMBED_MODELS,
  NODES,
  TOP_K,
  TYPE_WORD,
  type NodeId,
  type NodeSpec,
  type Params,
  type PortType,
} from './data';
import type { NodePlace, Point } from './layout';
import { refusalOf } from './pipeline';
import type { GraphAction, NodeRun, RunStatus, Wire } from './session';
import { typeColorOf } from './wires';

/** What a held wire makes of a node: where it leaves, a node that can take it, the one it is over, or one that cannot. */
export type Aim = 'idle' | 'source' | 'open' | 'aimed' | 'refusing' | 'closed';

const NODE_ICON: Record<NodeId, Icon> = {
  load: FileTextIcon,
  split: ScissorsIcon,
  embed: CpuIcon,
  search: SearchIcon,
  answer: MessageSquareTextIcon,
};

const STATUS_WORD: Record<RunStatus, string> = {
  idle: 'Not run',
  running: 'Running',
  done: 'Done',
  cached: 'Served from cache',
  failed: 'Failed',
  skipped: 'Skipped',
};

const CARD =
  'bg-card hairline-ring ring-border flex size-full flex-col rounded-xl p-2.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-[box-shadow,opacity] duration-150';

const STATUS_RING: Partial<Record<RunStatus, string>> = {
  running: 'ring-primary/60 ring-2',
  failed: 'ring-destructive/50 ring-2',
};

const AIM_RING: Record<Aim, string> = {
  idle: '',
  source: '',
  open: 'ring-primary/45 ring-2',
  aimed: 'ring-primary ring-2',
  refusing: 'ring-destructive/70 ring-2',
  closed: 'opacity-50',
};

const PORT =
  'group/port absolute top-0 left-0 flex size-6 items-center justify-center rounded-full outline-none';

const DOT =
  'ring-card size-3 rounded-full ring-2 transition-[scale] duration-150 ease-(--ease-out-strong) group-hover/port:scale-125 group-focus-visible/port:scale-125';

const NOTHING = 'nothing';

/** A port sits on the edge of its node, in a square large enough for a finger. */
function portStyleOf(port: Point, place: NodePlace) {
  const x = port.x - place.box.x - 12;
  const y = port.y - place.box.y - 12;
  return { transform: `translate(${x}px, ${y}px)` };
}

function heldDotOf(isHeld: boolean) {
  if (isHeld) {
    return 'scale-150';
  }
  return undefined;
}

function staleToneOf(isStale: boolean) {
  if (isStale) {
    return 'opacity-50';
  }
  return undefined;
}

function TypeMark({ type }: { type: PortType }) {
  return (
    <span className='flex items-center gap-1'>
      <span
        aria-hidden='true'
        style={{ backgroundColor: typeColorOf(type) }}
        className='size-1.5 rounded-full'
      />
      {TYPE_WORD[type]}
    </span>
  );
}

/** The ring closes over the time the node runs. It is drawn once per run and never loops. */
function ProgressRing({ ms }: { ms: number }) {
  const ringStyle = { transitionDuration: `${ms}ms` };

  return (
    <svg viewBox='0 0 16 16' aria-hidden='true' className='size-4 -rotate-90'>
      <circle
        cx='8'
        cy='8'
        r='6'
        className='stroke-foreground/15 fill-none stroke-2'
      />
      <circle
        cx='8'
        cy='8'
        r='6'
        pathLength='1'
        strokeDasharray='1'
        style={ringStyle}
        className='stroke-primary fill-none stroke-2 transition-[stroke-dashoffset] ease-linear [stroke-dashoffset:0] [stroke-linecap:round] starting:[stroke-dashoffset:1]'
      />
    </svg>
  );
}

function StatusMark({ status, ms }: { status: RunStatus; ms: number }) {
  return (
    <span className='flex h-5 shrink-0 items-center'>
      <Swap swapKey={status}>
        {status === 'running' && <ProgressRing ms={ms} />}
        {status === 'done' && (
          <CircleCheckIcon className='text-success-foreground size-4' />
        )}
        {status === 'cached' && <Badge variant='secondary'>Cached</Badge>}
        {status === 'failed' && (
          <CircleXIcon className='text-destructive-ink size-4' />
        )}
        {status === 'skipped' && <Badge variant='outline'>Skipped</Badge>}
      </Swap>
      <span className='sr-only'>{STATUS_WORD[status]}</span>
    </span>
  );
}

type WidgetProps = {
  node: NodeSpec;
  params: Params;
  isLocked: boolean;
  onAction: (action: GraphAction) => void;
};

function SizeWidget({ node, params, isLocked, onAction }: WidgetProps) {
  function change(next: number | readonly number[]) {
    if (typeof next === 'number') {
      onAction({ type: 'paramsChanged', params: { chunkSize: next } });
    }
  }

  return (
    <>
      <span className='text-muted-foreground shrink-0 text-xs'>Size</span>
      <Slider
        value={params.chunkSize}
        min={CHUNK_SIZE.min}
        max={CHUNK_SIZE.max}
        step={CHUNK_SIZE.step}
        disabled={isLocked}
        thumbLabels={[`Chunk size of ${node.title}, in tokens`]}
        onValueChange={change}
      />
      <span className='w-9 shrink-0 text-end text-xs tabular-nums'>
        {params.chunkSize}
      </span>
    </>
  );
}

function ModelWidget({ node, params, isLocked, onAction }: WidgetProps) {
  function change(next: unknown) {
    const model = EMBED_MODELS.find((candidate) => candidate.value === next);
    if (model) {
      onAction({ type: 'paramsChanged', params: { model: model.value } });
    }
  }

  return (
    <Select
      items={EMBED_MODELS}
      value={params.model}
      disabled={isLocked}
      onValueChange={change}
    >
      <SelectTrigger size='sm' aria-label={`Model of ${node.title}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {EMBED_MODELS.map((model) => (
          <SelectItem key={model.value} value={model.value}>
            {model.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function TopWidget({ params, isLocked, onAction }: WidgetProps) {
  const isLowest = params.topK <= TOP_K.min;
  const isHighest = params.topK >= TOP_K.max;

  function step(by: number) {
    onAction({ type: 'paramsChanged', params: { topK: params.topK + by } });
  }

  return (
    <>
      <span className='text-muted-foreground flex-1 text-xs'>Passages</span>
      <Button
        type='button'
        variant='outline'
        size='icon-sm'
        aria-label='One passage fewer'
        disabled={isLocked || isLowest}
        focusableWhenDisabled
        onClick={() => step(-1)}
        className='size-6'
      >
        <MinusIcon className='size-3.5' />
      </Button>
      <output
        aria-label='Passages to keep'
        className='w-5 text-center text-xs font-medium'
      >
        <MotionNumber value={params.topK} />
      </output>
      <Button
        type='button'
        variant='outline'
        size='icon-sm'
        aria-label='One passage more'
        disabled={isLocked || isHighest}
        focusableWhenDisabled
        onClick={() => step(1)}
        className='size-6'
      >
        <PlusIcon className='size-3.5' />
      </Button>
    </>
  );
}

function PromptWidget({ node, params, isLocked, onAction }: WidgetProps) {
  return (
    <Input
      size='sm'
      value={params.prompt}
      disabled={isLocked}
      autoComplete='off'
      aria-label={`Question for ${node.title}`}
      placeholder='Ask the help center'
      onChange={(event) =>
        onAction({
          type: 'paramsChanged',
          params: { prompt: event.target.value },
        })
      }
    />
  );
}

/** The setting of each node, edited where it applies. Loading has nothing to set. */
function Widget(props: WidgetProps) {
  const id = props.node.id;
  if (id === 'split') {
    return <SizeWidget {...props} />;
  }
  if (id === 'embed') {
    return <ModelWidget {...props} />;
  }
  if (id === 'search') {
    return <TopWidget {...props} />;
  }
  if (id === 'answer') {
    return <PromptWidget {...props} />;
  }
  return (
    <span className='text-muted-foreground truncate text-xs'>
      Source · Help center
    </span>
  );
}

type PreviewProps = {
  node: NodeSpec;
  run: NodeRun;
  isStale: boolean;
  isRetryPressed: boolean;
  onRun: () => void;
};

/** What the node last produced. A result older than its settings stays, dimmed, until the next run. */
function Preview({ node, run, isStale, isRetryPressed, onRun }: PreviewProps) {
  const { status, result } = run;

  if (status === 'running') {
    return <p className='text-muted-foreground text-xs'>{node.workingLine}</p>;
  }
  if (status === 'failed') {
    return (
      <div className='flex items-start gap-2'>
        <p className='text-destructive-ink line-clamp-2 min-w-0 flex-1 text-xs'>
          {run.message}
        </p>
        <Button
          type='button'
          size='sm'
          variant='outline'
          data-canvas-control
          onClick={onRun}
          className={cn('h-6 shrink-0 px-2', pressedQuietOf(isRetryPressed))}
        >
          Retry
        </Button>
      </div>
    );
  }
  if (status === 'skipped') {
    return <p className='text-muted-foreground text-xs'>{run.message}</p>;
  }
  if (!result) {
    return <p className='text-muted-foreground text-xs'>Not run yet</p>;
  }

  return (
    <div
      className={cn(
        'flex flex-col transition-opacity duration-200',
        staleToneOf(isStale)
      )}
    >
      <p className='text-[13px] leading-5 font-medium tabular-nums'>
        {result.headline}
        {isStale && <span className='sr-only'>, out of date</span>}
      </p>
      <p className='text-muted-foreground line-clamp-2 text-xs leading-4'>
        {result.lines.join(', ')}
      </p>
    </div>
  );
}

type InputPortProps = {
  node: NodeSpec;
  type: PortType;
  port: Point;
  place: NodePlace;
  wires: Wire[];
  sourceId: NodeId | null;
  isLocked: boolean;
  onAction: (action: GraphAction) => void;
};

function sourceWordOf(sourceId: NodeId | null) {
  const source = NODES.find((candidate) => candidate.id === sourceId);
  if (!source) {
    return 'Not connected';
  }
  return `Fed by ${source.title}`;
}

/** Connecting without dragging: the port opens the nodes that can feed it. The others say what they give. */
function InputPort({
  node,
  type,
  port,
  place,
  wires,
  sourceId,
  isLocked,
  onAction,
}: InputPortProps) {
  const others = NODES.filter((candidate) => candidate.id !== node.id);

  function choose(next: unknown) {
    const source = others.find((candidate) => candidate.id === next);
    if (source) {
      onAction({ type: 'connected', from: source.id, to: node.id });
      return;
    }
    onAction({ type: 'disconnected', to: node.id });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-canvas-control
        disabled={isLocked}
        aria-label={`Input of ${node.title}: ${TYPE_WORD[type]}. ${sourceWordOf(sourceId)}`}
        style={portStyleOf(port, place)}
        className={cn(
          PORT,
          'focus-visible:ring-ring cursor-pointer focus-visible:ring-2'
        )}
      >
        <span style={{ backgroundColor: typeColorOf(type) }} className={DOT} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className='min-w-60'>
        <DropdownMenuLabel>Feed {node.title} from</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={sourceId ?? NOTHING}
          onValueChange={choose}
        >
          {others.map((candidate) => (
            <DropdownMenuRadioItem
              key={candidate.id}
              value={candidate.id}
              disabled={refusalOf(wires, candidate.id, node.id) !== null}
            >
              {candidate.title}
              <DropdownMenuShortcut>
                {TYPE_WORD[candidate.output]}
              </DropdownMenuShortcut>
            </DropdownMenuRadioItem>
          ))}
          <DropdownMenuRadioItem value={NOTHING}>Nothing</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function spokenOf(node: NodeSpec, run: NodeRun, sourceId: NodeId | null) {
  const status = STATUS_WORD[run.status];
  if (node.input === null) {
    return `${node.title}. ${status}`;
  }
  return `${node.title}. ${sourceWordOf(sourceId)}. ${status}`;
}

export type NodeCardProps = {
  node: NodeSpec;
  place: NodePlace;
  run: NodeRun;
  params: Params;
  wires: Wire[];
  sourceId: NodeId | null;
  /** What the node would compute now. A result with another signature is out of date. */
  signature: string;
  aim: Aim;
  /** A wire is held out of its output, by a pointer or by the demonstration. */
  isOutputHeld: boolean;
  /** A run is going: settings and wires wait until it ends. */
  isLocked: boolean;
  isRetryPressed: boolean;
  onAction: (action: GraphAction) => void;
  onRun: () => void;
  onReveal: (id: NodeId) => void;
};

export function NodeCard({
  node,
  place,
  run,
  params,
  wires,
  sourceId,
  signature,
  aim,
  isOutputHeld,
  isLocked,
  isRetryPressed,
  onAction,
  onRun,
  onReveal,
}: NodeCardProps) {
  const Glyph = NODE_ICON[node.id];
  const { box } = place;
  const cardStyle = { transform: `translate(${box.x}px, ${box.y}px)` };

  return (
    <div
      data-node={node.id}
      role='group'
      aria-label={spokenOf(node, run, sourceId)}
      style={cardStyle}
      onFocus={() => onReveal(node.id)}
      className='absolute top-0 left-0 h-[168px] w-[216px]'
    >
      <div className={cn(CARD, STATUS_RING[run.status], AIM_RING[aim])}>
        <p className='text-muted-foreground flex h-5 items-center gap-1.5 text-[11px]'>
          {node.input && <TypeMark type={node.input} />}
          {node.input && <ArrowRightIcon className='size-3' />}
          <TypeMark type={node.output} />
        </p>
        <div className='mt-1 flex h-7 items-center gap-2'>
          <span
            aria-hidden='true'
            className='keycap-3d text-muted-foreground inline-flex size-6 shrink-0 items-center justify-center rounded-md'
          >
            <Glyph className='size-3.5' />
          </span>
          <h3 className='min-w-0 flex-1 truncate text-[13px] font-medium'>
            {node.title}
          </h3>
          <StatusMark status={run.status} ms={node.runMs} />
        </div>
        <div data-canvas-control className='mt-1.5 flex h-8 items-center gap-2'>
          <Widget
            node={node}
            params={params}
            isLocked={isLocked}
            onAction={onAction}
          />
        </div>
        <div className='mt-2 h-[46px] overflow-hidden'>
          <Preview
            node={node}
            run={run}
            isStale={run.signature !== signature}
            isRetryPressed={isRetryPressed}
            onRun={onRun}
          />
        </div>
      </div>
      {node.input && place.input && (
        <InputPort
          node={node}
          type={node.input}
          port={place.input}
          place={place}
          wires={wires}
          sourceId={sourceId}
          isLocked={isLocked}
          onAction={onAction}
        />
      )}
      <span
        data-port={node.id}
        aria-hidden='true'
        style={portStyleOf(place.output, place)}
        className={cn(PORT, 'cursor-crosshair')}
      >
        <span
          style={{ backgroundColor: typeColorOf(node.output) }}
          className={cn(DOT, heldDotOf(isOutputHeld))}
        />
      </span>
    </div>
  );
}
