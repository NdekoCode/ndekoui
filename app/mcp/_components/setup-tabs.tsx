'use client';

import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Tabs, TabsList, TabsTab } from '@/registry/ndeko/ui/tabs';

import { useClientChoice } from './client-choice';
import { clientTabIdOf, CLIENTS } from './clients';

/** The client list on one side and the steps of the chosen client on the other; the steps resize in place. */
export function SetupTabs({ children }: { children: React.ReactNode }) {
  const { clientId, setClientId } = useClientChoice();

  function selectClient(value: unknown) {
    if (typeof value === 'string') {
      setClientId(value);
    }
  }

  return (
    <Tabs
      value={clientId}
      onValueChange={selectClient}
      orientation='vertical'
      className='gap-6 data-[orientation=vertical]:flex-col lg:items-start lg:data-[orientation=vertical]:flex-row'
    >
      <TabsList
        variant='segmented'
        aria-label='MCP clients'
        className='grid w-full grid-cols-2 sm:grid-cols-3 lg:flex lg:w-52 lg:shrink-0 lg:flex-col lg:items-stretch'
      >
        {CLIENTS.map((client) => {
          const { Mark } = client;
          return (
            <TabsTab
              key={client.id}
              id={clientTabIdOf(client.id)}
              value={client.id}
              className='justify-start'
            >
              <Mark />
              {client.name}
            </TabsTab>
          );
        })}
      </TabsList>
      <AnimatedSize className='w-full min-w-0 lg:flex-1'>
        {children}
      </AnimatedSize>
    </Tabs>
  );
}
