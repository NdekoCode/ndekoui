import type { SeriesSlot } from '@/registry/ndeko/lib/agent-run';

import { MODELS, type Model } from './data';
import type { ModelId, Step, ToolId } from './model';
import { toolOf, TOOLS, valuesOf, type Tool } from './tools';

export type PaletteGroup = 'models' | 'logic' | 'tools';

export type LogicKind = 'branch' | 'approval' | 'wait' | 'loop';

export type PaletteEntry =
  | { id: string; group: 'models'; label: string; modelId: ModelId }
  | {
      id: string;
      group: 'logic';
      label: string;
      hint: string;
      logic: LogicKind;
    }
  | { id: string; group: 'tools'; label: string; toolId: ToolId };

export const GROUP_WORD: Record<PaletteGroup, string> = {
  models: 'Models',
  logic: 'Logic',
  tools: 'Tools',
};

export const GROUPS: PaletteGroup[] = ['models', 'logic', 'tools'];

function entryOfModel(model: Model): PaletteEntry {
  return {
    id: `model-${model.id}`,
    group: 'models',
    label: model.name,
    modelId: model.id,
  };
}

function entryOfTool(tool: Tool): PaletteEntry {
  return {
    id: `tool-${tool.id}`,
    group: 'tools',
    label: tool.name,
    toolId: tool.id,
  };
}

const LOGIC_ENTRIES: PaletteEntry[] = [
  {
    id: 'logic-branch',
    group: 'logic',
    label: 'Branch',
    hint: 'Route by a condition',
    logic: 'branch',
  },
  {
    id: 'logic-approval',
    group: 'logic',
    label: 'Approval',
    hint: 'Ask a person first',
    logic: 'approval',
  },
  {
    id: 'logic-wait',
    group: 'logic',
    label: 'Wait',
    hint: 'Pause before the next step',
    logic: 'wait',
  },
  {
    id: 'logic-loop',
    group: 'logic',
    label: 'Loop',
    hint: 'Repeat the steps after it',
    logic: 'loop',
  },
];

export const PALETTE: PaletteEntry[] = [
  ...MODELS.map(entryOfModel),
  ...LOGIC_ENTRIES,
  ...TOOLS.map(entryOfTool),
];

export function pressKeyOf(entryId: string) {
  return `palette-${entryId}`;
}

export function entryOf(id: string) {
  return PALETTE.find((entry) => entry.id === id);
}

/** Agents take the series colours in their fixed order, so the third agent of a flow is always the third colour. */
const SERIES_ORDER: SeriesSlot[] = [1, 2, 3, 4, 5];

export function seriesAfter(agentCount: number) {
  const index = agentCount % SERIES_ORDER.length;
  return SERIES_ORDER[index];
}

function logicStepOf(logic: LogicKind, id: string): Step {
  if (logic === 'branch') {
    return {
      id,
      kind: 'branch',
      name: 'New branch',
      outputs: [
        { id: `${id}-yes`, label: 'If yes', steps: [] },
        { id: `${id}-else`, label: 'Otherwise', steps: [] },
      ],
    };
  }
  if (logic === 'approval') {
    return {
      id,
      kind: 'approval',
      name: 'Ask a person',
      approval: { approverId: 'maren', timeoutHours: '4', onTimeout: 'deny' },
    };
  }
  if (logic === 'wait') {
    return { id, kind: 'wait', name: 'Wait', duration: '1h' };
  }
  return { id, kind: 'loop', name: 'Repeat', rounds: '3' };
}

function toolStepOf(toolId: ToolId, id: string): Step {
  const tool = toolOf(toolId);
  const firstAction = tool.actions.find((action) => !action.isEvent);
  const action = firstAction ?? tool.actions[0];
  return {
    id,
    kind: 'tool',
    name: action.label,
    tool: { toolId: tool.id, actionId: action.id, values: valuesOf(action) },
  };
}

/** A step as it lands on the canvas: ready to run, with the first action of its product and plain settings. */
export function stepOfEntry(
  entry: PaletteEntry,
  id: string,
  series: SeriesSlot
): Step {
  if (entry.group === 'logic') {
    return logicStepOf(entry.logic, id);
  }
  if (entry.group === 'tools') {
    return toolStepOf(entry.toolId, id);
  }
  return {
    id,
    kind: 'agent',
    name: 'New agent',
    seed: id,
    series,
    agent: {
      instructions: '',
      modelId: entry.modelId,
      creativity: 'balanced',
      streams: false,
      remembers: false,
      retries: true,
      outputName: 'answer',
      outputParts: [],
    },
  };
}
