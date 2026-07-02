import { SectionHeading } from '@/app/_home/section-heading';
import {
  REGISTRY_ITEM_TEMPLATE,
  REGISTRY_NAMESPACE,
  SITE_URL,
} from '@/app/mcp/_shared/mcp-config';

import type { SetupSnippet } from './clients';
import { InlineCodeText } from './inline-code-text';
import { SnippetBlock } from './snippet-block';

type RouteStep = {
  title: string;
  detail: string;
  snippet: SetupSnippet;
};

const COMPONENTS_JSON = JSON.stringify(
  { registries: { [REGISTRY_NAMESPACE]: REGISTRY_ITEM_TEMPLATE } },
  null,
  2
);

const STEPS: RouteStep[] = [
  {
    title: 'Declare the registry',
    detail:
      'Add the namespace to `components.json`, next to the registries you already use.',
    snippet: {
      label: 'components.json',
      language: 'json',
      code: COMPONENTS_JSON,
    },
  },
  {
    title: "Set up shadcn's MCP server",
    detail:
      'Pick your client: `claude`, `cursor`, `vscode`, `codex` or `opencode`.',
    snippet: {
      label: 'Terminal',
      language: 'bash',
      code: 'npx shadcn@latest mcp init --client claude',
    },
  },
  {
    title: 'Ask for items by their namespaced name',
    detail: `Its list and search tools read our catalogue at \`${SITE_URL}/r/registry.json\`. The same names work in the CLI.`,
    snippet: {
      label: 'Terminal',
      language: 'bash',
      code: `npx shadcn@latest add ${REGISTRY_NAMESPACE}/pricing-01`,
    },
  },
];

export function ShadcnRoute() {
  return (
    <section
      aria-labelledby='shadcn-title'
      className='grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]'
    >
      <SectionHeading
        id='shadcn-title'
        eyebrow='shadcn MCP'
        title="Already use shadcn's MCP server?"
        description='It installs from every registry declared in components.json. Declare ndekoui once and it browses, searches and installs our items next to the others. Our server adds the design rules, the theme and the catalogue map; you can run both.'
      />
      <ol className='flex flex-col gap-8'>
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className='grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3'
          >
            <span className='keycap-3d text-muted-foreground flex size-7 items-center justify-center rounded-md text-xs font-medium tabular-nums'>
              {index + 1}
            </span>
            <div className='flex flex-col gap-0.5 pt-1'>
              <p className='text-sm font-medium'>{step.title}</p>
              <p className='text-muted-foreground text-[13px] text-pretty'>
                <InlineCodeText text={step.detail} />
              </p>
            </div>
            <div className='col-start-2 min-w-0'>
              <SnippetBlock snippet={step.snippet} />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
