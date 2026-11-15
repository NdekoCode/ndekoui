import { CopyButton } from '@/app/_site/copy-button';
import {
  installCommandOf,
  motionItemNameOf,
  urlInstallCommandOf,
} from '@/lib/site';
import { cn } from '@/lib/utils';

import { NdekoUILLogo } from './icons/ndekoui-logo';
import { ShadcnLogo } from './icons/shadcn-logo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

type Command = {
  label: string;
  icon: React.ReactNode;
  code: string;
};

export type InstallationCliProps = {
  value: string;
  className?: string;
};

export function InstallationCli({ value, className }: InstallationCliProps) {
  const itemName = motionItemNameOf(value);
  const commands: Command[] = [
    {
      label: 'shadcn',
      icon: <ShadcnLogo className='size-4' />,
      code: installCommandOf(itemName),
    },
    {
      label: 'URL',
      icon: <ShadcnLogo className='size-4' />,
      code: urlInstallCommandOf(itemName),
    },
    {
      label: 'ndekoui',
      icon: <NdekoUILLogo className='size-4' />,
      code: `npx ndekoui@latest add ${value}`,
    },
  ];

  return (
    <Tabs
      defaultValue={commands[0].label}
      className={cn(
        'not-prose bg-card hairline-ring ring-border overflow-hidden rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        className
      )}
    >
      <TabsList className='h-10 px-1'>
        {commands.map((command) => (
          <TabsTrigger
            key={command.label}
            value={command.label}
            className='gap-1.5 px-3'
          >
            {command.icon}
            {command.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {commands.map((command) => (
        <TabsContent
          key={command.label}
          value={command.label}
          className='mt-0 rounded-none p-3'
        >
          <div className='bg-foreground/[0.04] flex items-center gap-2 rounded-lg py-1 ps-3 pe-1'>
            <code className='text-muted-foreground min-w-0 flex-1 overflow-x-auto font-mono text-xs whitespace-nowrap'>
              {command.code}
            </code>
            <CopyButton
              value={command.code}
              label={`Copy the ${command.label} command`}
            />
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
