import type { SeriesSlot } from '@/registry/ndeko/lib/agent-run';
import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';

/** An invented workspace on its first day. */
export const WORKSPACE = { name: 'Solway Books' };

export type PhaseId = 'tools' | 'team' | 'agent' | 'watch';

export type Phase = {
  id: PhaseId;
  /** The name of the step in its summary row. */
  label: string;
  /** The heading of the step, which takes the focus when the step opens. */
  title: string;
  lead: string;
};

export const PHASES: Phase[] = [
  {
    id: 'tools',
    label: 'Tools',
    title: 'Connect your tools',
    lead: 'An agent only reads what you connect. One tool is enough to start',
  },
  {
    id: 'team',
    label: 'Team',
    title: 'Invite your team',
    lead: 'They see what the agent does and can approve what it asks for',
  },
  {
    id: 'agent',
    label: 'Agent',
    title: 'Create your first agent',
    lead: 'A name, a model and one job, said in a sentence',
  },
  {
    id: 'watch',
    label: 'First run',
    title: 'Watch it do its first job',
    lead: 'It works with the tools you connected. Nothing is changed in them',
  },
];

export function phaseOf(id: PhaseId) {
  const phase = PHASES.find((candidate) => candidate.id === id);
  return phase ?? PHASES[0];
}

export function indexOfPhase(id: PhaseId) {
  return PHASES.findIndex((candidate) => candidate.id === id);
}

export type ToolId = 'notion' | 'linear' | 'github' | 'googledrive';

/** What an agent does in a tool, said in plain words, and what it finds in this invented workspace. */
export type ToolTask = {
  label: string;
  finding: string;
};

export type Tool = {
  id: ToolId;
  name: string;
  brand: BrandSlug;
  shares: string;
  /** The first task is the one a run starts with. The second is used when no other tool is connected. */
  tasks: [ToolTask, ToolTask];
};

/** Known products, under their own name and mark. The findings are invented and belong to the sample workspace. */
export const TOOLS: Tool[] = [
  {
    id: 'notion',
    name: 'Notion',
    brand: 'notion',
    shares: 'Pages and databases',
    tasks: [
      {
        label: 'Find the pages edited since yesterday',
        finding: '3 pages were edited since yesterday',
      },
      {
        label: 'Read the launch notes',
        finding: 'The launch notes gained 2 open questions',
      },
    ],
  },
  {
    id: 'linear',
    name: 'Linear',
    brand: 'linear',
    shares: 'Issues and projects',
    tasks: [
      {
        label: 'List the open issues',
        finding: '12 issues are open, 3 of them due this week',
      },
      {
        label: 'Read the issues due this week',
        finding: '2 of the 3 issues due this week have no owner',
      },
    ],
  },
  {
    id: 'github',
    name: 'GitHub',
    brand: 'github',
    shares: 'Repositories and pull requests',
    tasks: [
      {
        label: 'List the pull requests waiting for review',
        finding: '4 pull requests wait for a review',
      },
      {
        label: 'Read the oldest pull request',
        finding: 'The oldest one has been open for 6 days',
      },
    ],
  },
  {
    id: 'googledrive',
    name: 'Google Drive',
    brand: 'googledrive',
    shares: 'Files and folders',
    tasks: [
      {
        label: 'Find the files changed since yesterday',
        finding: '5 files changed since yesterday',
      },
      {
        label: 'Read the planning sheet',
        finding: 'The planning sheet has 14 new rows',
      },
    ],
  },
];

export function toolOf(id: ToolId) {
  const tool = TOOLS.find((candidate) => candidate.id === id);
  return tool ?? TOOLS[0];
}

export type ModelId = 'claude' | 'gpt' | 'gemini';

export type Model = {
  id: ModelId;
  /** The name of the model family, without a version. */
  name: string;
  maker: string;
  brand: BrandSlug;
};

export const MODELS: Model[] = [
  { id: 'claude', name: 'Claude', maker: 'Anthropic', brand: 'claude' },
  { id: 'gpt', name: 'GPT', maker: 'OpenAI', brand: 'openai' },
  { id: 'gemini', name: 'Gemini', maker: 'Google', brand: 'gemini' },
];

export function modelOf(id: ModelId) {
  const model = MODELS.find((candidate) => candidate.id === id);
  return model ?? MODELS[0];
}

/** The picture of the first agent is drawn from this, not from its name, which a person can change. */
export const AGENT_SEED = 'first-agent';

export const AGENT_SERIES: SeriesSlot = 1;

export const JOB_MAX_LENGTH = 120;
