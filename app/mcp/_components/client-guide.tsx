import { MCP_URL, SERVER_TITLE } from '@/app/mcp/_shared/mcp-config';
import { ArrowUpRightIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

import { sourceLabelOf, type ClientSetup, type SetupStep } from './clients';
import { CopyField } from './copy-field';
import { InlineCodeText } from './inline-code-text';
import { SnippetBlock } from './snippet-block';

function ServerFields() {
  return (
    <dl className='grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-6 gap-y-2 text-[13px]'>
      <dt className='text-muted-foreground'>Name</dt>
      <dd>{SERVER_TITLE}</dd>
      <dt className='text-muted-foreground'>Transport</dt>
      <dd>Streamable HTTP</dd>
      <dt className='text-muted-foreground'>Server URL</dt>
      <dd className='min-w-0'>
        <CopyField value={MCP_URL} label='Copy the server URL' />
      </dd>
      <dt className='text-muted-foreground'>Authentication</dt>
      <dd>None</dd>
    </dl>
  );
}

function StepBody({ step }: { step: SetupStep }) {
  return (
    <div className='flex min-w-0 flex-col gap-3'>
      <p className='text-[13px] leading-relaxed text-pretty'>
        <InlineCodeText text={step.text} />
      </p>
      {step.showsFields && <ServerFields />}
      {step.snippet && <SnippetBlock snippet={step.snippet} />}
    </div>
  );
}

function NumberedSteps({ steps }: { steps: SetupStep[] }) {
  return (
    <ol className='flex flex-col gap-5'>
      {steps.map((step, index) => (
        <li
          key={step.text}
          className='grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3'
        >
          <span className='keycap-3d text-muted-foreground flex size-6 items-center justify-center rounded-md text-xs font-medium tabular-nums'>
            {index + 1}
          </span>
          <StepBody step={step} />
        </li>
      ))}
    </ol>
  );
}

function Steps({ steps }: { steps: SetupStep[] }) {
  const [onlyStep] = steps;
  const hasOneStep = steps.length === 1;
  if (hasOneStep) {
    return <StepBody step={onlyStep} />;
  }
  return <NumberedSteps steps={steps} />;
}

/** The steps of one client, read from its own documentation, linked at the top. */
export function ClientGuide({ client }: { client: ClientSetup }) {
  const { Mark } = client;
  return (
    <div className='bg-card hairline-ring ring-border flex flex-col gap-5 rounded-xl p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <div className='flex flex-wrap items-center gap-x-2.5 gap-y-2'>
        <Mark />
        <h3 className='text-sm font-medium'>{client.name}</h3>
        <a
          href={client.sourceUrl}
          target='_blank'
          rel='noreferrer'
          className='text-muted-foreground hover:text-foreground focus-visible:ring-ring/25 ms-auto inline-flex items-center gap-1 rounded-md text-xs transition-colors duration-150 outline-none focus-visible:ring-[3px]'
        >
          {sourceLabelOf(client)}
          <span className='sr-only'>, opens in a new tab</span>
          <ArrowUpRightIcon className='size-3.5' />
        </a>
      </div>
      {client.installLink && (
        <Button
          className='self-start'
          nativeButton={false}
          render={<a href={client.installLink} />}
        >
          <Mark />
          {`Add to ${client.name}`}
        </Button>
      )}
      <Steps steps={client.steps} />
      {client.note && (
        <p className='text-muted-foreground text-xs text-pretty'>
          {client.note}
        </p>
      )}
    </div>
  );
}
