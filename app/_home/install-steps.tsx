import { CopyButton } from '@/app/_site/copy-button';
import { REGISTRY_URL } from '@/lib/site';

import { SectionHeading } from './section-heading';

const STEPS = [
  {
    title: 'Set up shadcn in your project',
    detail:
      'Once per project. It creates the components.json file the CLI reads.',
    command: 'npx shadcn@latest init',
  },
  {
    title: 'Add the theme',
    detail: 'Tokens for light and dark, hairlines and the 3D materials.',
    command: `npx shadcn@latest add ${REGISTRY_URL}/theme.json`,
  },
  {
    title: 'Add what you need',
    detail: 'A primitive, a component or a block. Its own pieces come with it.',
    command: `npx shadcn@latest add ${REGISTRY_URL}/button.json`,
  },
];

export function InstallSteps() {
  return (
    <section
      aria-labelledby='install-title'
      className='grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]'
    >
      <SectionHeading
        id='install-title'
        eyebrow='Installation'
        title='Three commands, then it is your code'
        description='Nothing to depend on at runtime: every file lands in your project, ready to change.'
      />
      <ol className='flex flex-col gap-8'>
        {STEPS.map((step, index) => (
          <li
            key={step.command}
            className='grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3'
          >
            <span className='keycap-3d text-muted-foreground flex size-7 items-center justify-center rounded-md text-xs font-medium tabular-nums'>
              {index + 1}
            </span>
            <div className='flex flex-col gap-0.5 pt-1'>
              <p className='text-sm font-medium'>{step.title}</p>
              <p className='text-muted-foreground text-[13px]'>{step.detail}</p>
            </div>
            <div className='bg-foreground/[0.04] col-start-2 flex items-center gap-2 rounded-lg py-1 ps-3 pe-1'>
              <code className='text-muted-foreground min-w-0 flex-1 truncate font-mono text-xs'>
                {step.command}
              </code>
              <CopyButton value={step.command} label={`Copy: ${step.title}`} />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
