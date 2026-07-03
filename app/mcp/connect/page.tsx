import type { Metadata } from 'next';

import { pageMetadataOf } from '@/app/_site/seo';
import { SectionHeading } from '@/app/_home/section-heading';
import { SiteShell } from '@/app/_site/site-shell';
import { ClientChoiceProvider } from '@/app/mcp/_components/client-choice';
import { ClientGuide } from '@/app/mcp/_components/client-guide';
import { CLIENTS, SETUP_SECTION_ID } from '@/app/mcp/_components/clients';
import { CopyField } from '@/app/mcp/_components/copy-field';
import { ExamplePrompts } from '@/app/mcp/_components/example-prompts';
import { HeroActions } from '@/app/mcp/_components/hero-actions';
import { McpFaq } from '@/app/mcp/_components/mcp-faq';
import { SetupTabs } from '@/app/mcp/_components/setup-tabs';
import { ShadcnRoute } from '@/app/mcp/_components/shadcn-route';
import { ToolList } from '@/app/mcp/_components/tool-list';
import { ValuePoints } from '@/app/mcp/_components/value-points';
import { MCP_URL } from '@/app/mcp/_shared/mcp-config';
import { PROMPTS, TOOLS } from '@/app/mcp/_shared/tool-catalogue';
import { countLabel } from '@/lib/site';
import { TabsPanel } from '@/registry/ndeko/ui/tabs';

export const metadata: Metadata = pageMetadataOf({
  title: 'MCP server - ndekoui',
  description:
    'Connect Claude, Cursor, Codex and any MCP client to ndekoui. Your agent searches the catalogue, reads the source, installs pieces with the shadcn CLI and follows the design rules.',
  path: '/mcp/connect',
});

function McpHero() {
  return (
    <section className='grid gap-8 md:grid-cols-2 md:items-start'>
      <div className='flex flex-col gap-3'>
        <p className='text-primary-ink text-xs font-medium'>MCP server</p>
        <h1 className='text-3xl font-semibold text-balance sm:text-4xl'>
          Connect Claude, Cursor and Codex to ndekoui with MCP
        </h1>
      </div>
      <div className='flex flex-col gap-5'>
        <p className='text-muted-foreground max-w-md text-sm text-pretty'>
          Give your coding agent the whole catalogue. It searches the
          primitives, components, blocks and templates, reads their source,
          installs them with the shadcn CLI and writes the code around them by
          the rules of the design system.
        </p>
        <HeroActions />
        <div className='flex flex-col gap-2'>
          <p className='text-sm font-medium'>
            Using an app that is not listed?
          </p>
          <CopyField
            value={MCP_URL}
            label='Copy the server URL'
            className='max-w-sm'
          />
          <p className='text-muted-foreground text-xs'>
            Add it as a remote server over Streamable HTTP, with no sign-in.
          </p>
        </div>
      </div>
    </section>
  );
}

function SetupSection() {
  return (
    <section
      id={SETUP_SECTION_ID}
      aria-labelledby='setup-title'
      className='flex scroll-mt-20 flex-col gap-8'
    >
      <SectionHeading
        id='setup-title'
        eyebrow='Setup'
        title='Add the server to your client'
        description='Every client takes the same address. Only the place you paste it changes, and each tab links the official steps it follows.'
      />
      <SetupTabs>
        {CLIENTS.map((client) => (
          <TabsPanel key={client.id} value={client.id}>
            <ClientGuide client={client} />
          </TabsPanel>
        ))}
      </SetupTabs>
    </section>
  );
}

function ToolsSection() {
  const toolCount = countLabel(TOOLS.length, 'tool', 'tools');
  const promptCount = countLabel(PROMPTS.length, 'prompt', 'prompts');
  return (
    <section aria-labelledby='tools-title' className='flex flex-col gap-8'>
      <SectionHeading
        id='tools-title'
        eyebrow={`${toolCount} and ${promptCount}`}
        title='What your agent can ask for'
        description='Every tool reads and none writes. Your agent gets data and commands back, and you decide what runs.'
      />
      <ToolList />
    </section>
  );
}

function PromptsSection() {
  return (
    <section
      aria-labelledby='prompts-title'
      className='grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]'
    >
      <SectionHeading
        id='prompts-title'
        eyebrow='Examples'
        title='Things to ask once it is connected'
        description='Name the library in the request, and the agent reaches for the server on its own.'
      />
      <ExamplePrompts />
    </section>
  );
}

export default function McpPage() {
  return (
    <SiteShell>
      <ClientChoiceProvider>
        <div className='flex flex-col gap-24 pt-4 pb-16 md:pt-8'>
          <McpHero />
          <SetupSection />
          <ToolsSection />
          <ValuePoints />
          <ShadcnRoute />
          <PromptsSection />
          <McpFaq />
        </div>
      </ClientChoiceProvider>
    </SiteShell>
  );
}
