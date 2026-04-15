'use client';

import { useState } from 'react';

import { ArrowRightIcon, CodeIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Tabs, TabsList, TabsTab } from '@/registry/ndeko/ui/tabs';

import { CommandRow } from './command-row';
import {
  DEFAULT_MANAGER,
  INSTALL_COMMANDS,
  type InstallCommand,
  type PackageManagerId,
  SDK_CARD,
} from './data';

function isPackageManagerId(value: unknown): value is PackageManagerId {
  return INSTALL_COMMANDS.some((entry) => entry.id === value);
}

function commandOf(id: PackageManagerId) {
  const found = INSTALL_COMMANDS.find((entry) => entry.id === id);
  const fallback: InstallCommand = INSTALL_COMMANDS[0];
  const entry = found ?? fallback;
  return entry.command;
}

export function SdkCard() {
  const [manager, setManager] = useState<PackageManagerId>(DEFAULT_MANAGER);
  const command = commandOf(manager);

  function changeManager(value: unknown) {
    if (isPackageManagerId(value)) {
      setManager(value);
    }
  }

  return (
    <section className='px-4 py-12 sm:px-6 sm:py-16 lg:px-8'>
      <div className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] mx-auto grid max-w-4xl gap-8 rounded-xl p-6 shadow-[0_1px_2px_rgb(0_0_0/0.04)] sm:p-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:items-center md:gap-10'>
        <div className='flex flex-col items-start gap-4'>
          <span className='keycap-3d text-muted-foreground flex size-9 items-center justify-center rounded-lg'>
            <CodeIcon />
          </span>
          <div className='flex flex-col gap-2'>
            <p className='text-primary-ink text-xs font-medium'>
              {SDK_CARD.eyebrow}
            </p>
            <h2 className='text-xl font-semibold text-balance'>
              {SDK_CARD.title}
            </h2>
            <p className='text-muted-foreground text-sm text-pretty'>
              {SDK_CARD.description}
            </p>
          </div>
        </div>
        <div className='flex min-w-0 flex-col gap-3'>
          <Tabs value={manager} onValueChange={changeManager}>
            <TabsList variant='segmented' aria-label='Package manager'>
              {INSTALL_COMMANDS.map((entry) => (
                <TabsTab key={entry.id} value={entry.id}>
                  {entry.label}
                </TabsTab>
              ))}
            </TabsList>
          </Tabs>
          <CommandRow command={command} />
          <div className='flex flex-wrap gap-x-5 gap-y-1'>
            {SDK_CARD.links.map((link) => (
              <Button
                key={link.label}
                variant='link'
                className='h-auto px-0'
                nativeButton={false}
                render={<a href={link.href} />}
              >
                {link.label}
                <ArrowRightIcon className='size-3.5' />
              </Button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
