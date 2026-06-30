import {
  PROMPTS,
  TOOLS,
  type PromptSummary,
  type ToolSummary,
} from '@/app/mcp/_shared/tool-catalogue';

const TILE =
  'bg-card hairline-ring ring-border flex flex-col gap-3 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]';

function ToolTile({ tool }: { tool: ToolSummary }) {
  return (
    <li className={TILE}>
      <div className='flex flex-col gap-1'>
        <h3 className='font-mono text-sm font-medium'>{tool.name}</h3>
        <p className='text-muted-foreground text-[13px] text-pretty'>
          {tool.summary}
        </p>
      </div>
      <dl className='mt-auto grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs'>
        <dt className='text-muted-foreground'>Takes</dt>
        <dd>{tool.takes}</dd>
        <dt className='text-muted-foreground'>Returns</dt>
        <dd>{tool.returns}</dd>
      </dl>
    </li>
  );
}

function PromptTile({ prompt }: { prompt: PromptSummary }) {
  return (
    <li className={TILE}>
      <div className='flex flex-col gap-1'>
        <h3 className='text-sm font-medium'>{prompt.title}</h3>
        <p className='text-muted-foreground text-[13px] text-pretty'>
          {prompt.description}
        </p>
      </div>
      <dl className='mt-auto grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs'>
        <dt className='text-muted-foreground'>Name</dt>
        <dd className='font-mono'>{prompt.name}</dd>
        <dt className='text-muted-foreground'>Asks for</dt>
        <dd>{prompt.takes}</dd>
      </dl>
    </li>
  );
}

export function ToolList() {
  return (
    <div className='flex flex-col gap-10'>
      <ul className='grid gap-3 sm:grid-cols-2'>
        {TOOLS.map((tool) => (
          <ToolTile key={tool.name} tool={tool} />
        ))}
      </ul>
      <div className='flex flex-col gap-3'>
        <h3 className='text-sm font-medium'>Prompts that come with it</h3>
        <ul className='grid gap-3 sm:grid-cols-2'>
          {PROMPTS.map((prompt) => (
            <PromptTile key={prompt.name} prompt={prompt} />
          ))}
        </ul>
      </div>
    </div>
  );
}
