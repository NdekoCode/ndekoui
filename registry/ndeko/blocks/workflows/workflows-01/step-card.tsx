'use client';

import {
  EllipsisIcon,
  TrashIcon,
  TriangleAlertIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';

import {
  choiceOf,
  FIELDS_OF,
  KIND_WORD,
  shownNameOf,
  type OutputId,
  type Step,
} from './data';
import {
  outputLinesOf,
  targetsOf,
  type Graph,
  type OutputLine,
  type Problem,
} from './graph';
import type { Point, StepPlace } from './layout';
import type { BuilderAction } from './session';
import { StepTile } from './step-tile';

/** What a held wire makes of a step: where it leaves, a step it may land on, the one it is over, or one it cannot reach. */
export type Aim = 'idle' | 'source' | 'open' | 'aimed' | 'closed';

const CARD = [
  'bg-card hairline-ring ring-border flex size-full cursor-pointer items-center gap-2.5 rounded-xl p-2.5 text-start',
  'shadow-[0_1px_2px_rgb(0_0_0/0.04)] outline-none transition-[box-shadow,opacity] duration-150 hover:ring-foreground/25',
  'focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2',
].join(' ');

const AIM_CLASS: Record<Aim, string> = {
  idle: '',
  source: '',
  open: 'ring-primary/45 ring-2',
  aimed: 'ring-primary ring-2',
  closed: 'opacity-45',
};

const PORT =
  'group/port absolute top-0 left-0 flex size-6 items-center justify-center';

const DOT =
  'hairline-ring size-2.5 rounded-full transition-[scale,background-color,box-shadow] duration-150 ease-(--ease-out-strong)';

const DOT_FREE = 'bg-card ring-foreground/30';

const DOT_WIRED = 'bg-foreground/45 ring-transparent';

const DOT_OPEN = 'bg-card ring-primary scale-125 ring-2';

const DOT_HELD = 'bg-primary ring-primary scale-150';

const NOTHING = 'nothing';

/** Stripe · Account created: what the step is set to, in one line. */
function detailOf(step: Step) {
  const parts: string[] = [];
  for (const spec of FIELDS_OF[step.kind]) {
    const value = step.values[spec.id] ?? '';
    const label = choiceOf(spec, value)?.label ?? value;
    if (label !== '') {
      parts.push(label);
    }
  }
  return parts.join(' · ');
}

function leadWordOf(line: OutputLine) {
  if (line.target) {
    return `${line.word} leads to ${shownNameOf(line.target)}`;
  }
  if (line.output === 'next') {
    return 'The flow ends here';
  }
  return `${line.word} leads nowhere`;
}

function problemsWordOf(problems: Problem[]) {
  const lines = problems.map((problem) => problem.line);
  if (problems.length === 0) {
    return '';
  }
  if (problems.length === 1) {
    return `1 problem: ${lines[0]}.`;
  }
  return `${problems.length} problems: ${lines.join(', ')}.`;
}

/** The step said in full, since its place and its wires are only drawn. */
function spokenOf(step: Step, lines: OutputLine[], problems: Problem[]) {
  const leads = lines.map(leadWordOf);
  const name = `${KIND_WORD[step.kind]}: ${shownNameOf(step)}.`;
  return `${name} ${leads.join('. ')}. ${problemsWordOf(problems)}`;
}

function connectLabelOf(line: OutputLine) {
  if (line.output === 'next') {
    return 'Connect to';
  }
  return `If ${line.word.toLowerCase()}, connect to`;
}

function inputDotOf(aim: Aim, isReached: boolean) {
  if (aim === 'aimed') {
    return DOT_HELD;
  }
  if (aim === 'open') {
    return DOT_OPEN;
  }
  if (isReached) {
    return DOT_WIRED;
  }
  return DOT_FREE;
}

function outputDotOf(isHeld: boolean, isWired: boolean) {
  if (isHeld) {
    return DOT_HELD;
  }
  if (isWired) {
    return DOT_WIRED;
  }
  return DOT_FREE;
}

/** A port sits on the edge of its card, in a square large enough for a finger. */
function portStyleOf(port: Point, place: StepPlace) {
  const x = port.x - place.box.x - 12;
  const y = port.y - place.box.y - 12;
  return { transform: `translate(${x}px, ${y}px)` };
}

type StepMenuProps = {
  step: Step;
  graph: Graph;
  lines: OutputLine[];
  onAction: (action: BuilderAction) => void;
  onRemove: (id: string) => void;
};

/** Connecting without dragging: every way out of the step, with the steps it may lead to. */
function StepMenu({ step, graph, lines, onAction, onRemove }: StepMenuProps) {
  const targets = targetsOf(graph, step.id);

  function connect(output: OutputId, next: unknown) {
    const target = targets.find((candidate) => candidate.id === next);
    if (target) {
      onAction({ type: 'connected', from: step.id, output, to: target.id });
      return;
    }
    onAction({ type: 'disconnected', from: step.id, output });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            data-canvas-control
            data-step-menu={step.id}
            aria-label={`Actions for ${shownNameOf(step)}`}
            className='text-muted-foreground absolute top-1 right-1 size-6'
          />
        }
      >
        <EllipsisIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='min-w-52'>
        {lines.map((line) => (
          <div key={line.output}>
            <DropdownMenuLabel>{connectLabelOf(line)}</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              aria-label={connectLabelOf(line)}
              value={line.target?.id ?? NOTHING}
              onValueChange={(next) => connect(line.output, next)}
            >
              {targets.map((target) => (
                <DropdownMenuRadioItem key={target.id} value={target.id}>
                  {shownNameOf(target)}
                </DropdownMenuRadioItem>
              ))}
              <DropdownMenuRadioItem value={NOTHING}>
                Nothing
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </div>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant='destructive'
          onClick={() => onRemove(step.id)}
        >
          <TrashIcon />
          Delete step
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type StepCardProps = {
  step: Step;
  place: StepPlace;
  graph: Graph;
  /** The problems of this step alone. */
  problems: Problem[];
  aim: Aim;
  isSelected: boolean;
  /** The inspector shows this step. */
  isOpen: boolean;
  /** A pointer is moving it along the grid. */
  isLifted: boolean;
  /** The output a wire is held out of, by a pointer or by the demonstration. */
  heldOutput: OutputId | null;
  inspectorId: string;
  onOpen: (id: string, isFromKeyboard: boolean) => void;
  onReveal: (id: string) => void;
  onAction: (action: BuilderAction) => void;
  onRemove: (id: string) => void;
};

export function StepCard({
  step,
  place,
  graph,
  problems,
  aim,
  isSelected,
  isOpen,
  isLifted,
  heldOutput,
  inspectorId,
  onOpen,
  onReveal,
  onAction,
  onRemove,
}: StepCardProps) {
  const lines = outputLinesOf(graph, step);
  const [firstProblem] = problems;
  const isReached = graph.connections.some((link) => link.to === step.id);
  const isRestingSelected = isSelected && aim === 'idle';
  const { box } = place;
  const cardStyle = {
    width: box.width,
    height: box.height,
    transform: `translate(${box.x}px, ${box.y}px)`,
  };

  function open(event: React.MouseEvent<HTMLButtonElement>) {
    const isFromKeyboard = event.detail === 0;
    onOpen(step.id, isFromKeyboard);
  }

  return (
    <div
      data-step={step.id}
      style={cardStyle}
      className={cn(
        'absolute top-0 left-0 transition-transform duration-150 ease-(--ease-out-strong)',
        isLifted && 'z-10'
      )}
    >
      <button
        type='button'
        data-step-button={step.id}
        aria-label={spokenOf(step, lines, problems)}
        aria-expanded={isOpen}
        aria-controls={inspectorId}
        onClick={open}
        onFocus={() => onReveal(step.id)}
        className={cn(
          CARD,
          isRestingSelected && 'ring-primary/60 ring-2',
          isLifted && 'cursor-grabbing shadow-lg shadow-black/10',
          AIM_CLASS[aim]
        )}
      >
        <StepTile step={step} />
        <span className='flex max-h-full min-w-0 flex-1 flex-col overflow-hidden'>
          <span className='text-muted-foreground pe-6 text-[11px] leading-4'>
            {KIND_WORD[step.kind]}
          </span>
          <span className='line-clamp-2 text-[13px] leading-5 font-medium break-words'>
            {shownNameOf(step)}
          </span>
          {firstProblem && (
            <span className='text-warning-foreground flex items-start gap-1 text-xs leading-4'>
              <TriangleAlertIcon className='mt-0.5 size-3 shrink-0' />
              <span className='line-clamp-2'>{firstProblem.line}</span>
            </span>
          )}
          {!firstProblem && (
            <span className='text-muted-foreground line-clamp-2 text-xs leading-4'>
              {detailOf(step)}
            </span>
          )}
        </span>
      </button>
      <StepMenu
        step={step}
        graph={graph}
        lines={lines}
        onAction={onAction}
        onRemove={onRemove}
      />
      {place.input && (
        <span
          aria-hidden='true'
          style={portStyleOf(place.input, place)}
          className={cn(PORT, 'pointer-events-none')}
        >
          <span className={cn(DOT, inputDotOf(aim, isReached))} />
        </span>
      )}
      {lines.map((line) => {
        const port = place.outputs[line.output];
        if (!port) {
          return null;
        }
        const isHeld = heldOutput === line.output;
        const isWired = line.target !== undefined;
        return (
          <span
            key={line.output}
            data-port={line.output}
            aria-hidden='true'
            style={portStyleOf(port, place)}
            className={cn(PORT, 'cursor-crosshair')}
          >
            <span
              className={cn(
                DOT,
                'group-hover/port:ring-primary group-hover/port:scale-125',
                outputDotOf(isHeld, isWired)
              )}
            />
          </span>
        );
      })}
    </div>
  );
}
