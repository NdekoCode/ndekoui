'use client';

import { Button } from '@/registry/ndeko/ui/button';

import { useClientChoice } from './client-choice';
import { FEATURED_CLIENTS, type ClientSetup } from './clients';

function InstallLinkButton({
  client,
  href,
}: {
  client: ClientSetup;
  href: string;
}) {
  const { Mark } = client;
  return (
    <Button
      variant='outline'
      size='lg'
      nativeButton={false}
      render={<a href={href} />}
    >
      <Mark />
      {`Add to ${client.name}`}
    </Button>
  );
}

function StepsButton({ client }: { client: ClientSetup }) {
  const { showClient } = useClientChoice();
  const { Mark } = client;
  return (
    <Button variant='outline' size='lg' onClick={() => showClient(client.id)}>
      <Mark />
      {`Add to ${client.name}`}
    </Button>
  );
}

function ClientButton({ client }: { client: ClientSetup }) {
  if (client.installLink) {
    return <InstallLinkButton client={client} href={client.installLink} />;
  }
  return <StepsButton client={client} />;
}

/** Clients with an install link open it; the others select their steps further down the page. */
export function HeroActions() {
  return (
    <div className='flex flex-wrap gap-2'>
      {FEATURED_CLIENTS.map((client) => (
        <ClientButton key={client.id} client={client} />
      ))}
    </div>
  );
}
