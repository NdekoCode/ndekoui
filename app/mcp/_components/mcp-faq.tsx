import { SectionHeading } from '@/app/_home/section-heading';
import { MCP_PATH } from '@/app/mcp/_shared/mcp-config';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/registry/ndeko/ui/accordion';

type Question = {
  id: string;
  question: string;
  answer: string;
};

const QUESTIONS: Question[] = [
  {
    id: 'changes',
    question: 'Can the server change my project?',
    answer:
      'No. Every tool reads the registry and answers with names, source and commands. Files change only when your agent runs the shadcn command it was given, and your client decides whether it asks you first.',
  },
  {
    id: 'account',
    question: 'Do I need an account or an API key?',
    answer:
      'No. The server is public and asks for no sign-in. When a client offers an authentication setting, choose none.',
  },
  {
    id: 'local-only',
    question: 'My client only starts local servers',
    answer:
      'Run mcp-remote as a bridge: it starts on your machine and forwards every call to the server. The Other clients tab of the setup has the configuration.',
  },
  {
    id: 'shadcn',
    question: "How is it different from shadcn's MCP server?",
    answer:
      "shadcn's server lists, searches and installs items from every registry in your components.json, ndekoui included once you declare it. This server adds what keeps the rest of the code in the same style: the design rules, a summary of the theme and the map of the catalogue. Both can run side by side.",
  },
  {
    id: 'fresh',
    question: 'Does it know about the newest components?',
    answer:
      'It reads the same registry files this site serves, from the same deployment, so an item your agent can search is an item you can see in the catalogue.',
  },
  {
    id: 'locally',
    question: 'Can I run it on my machine?',
    answer: `Yes. Clone the repository, start the site with pnpm dev and point your client at http://localhost:3000${MCP_PATH}.`,
  },
  {
    id: 'not-used',
    question: 'Why does my agent ignore it?',
    answer:
      'Name the library in your request, for example "with ndekoui", or start from one of the two prompts the server ships. Some clients also need the server switched on in their list of tools.',
  },
];

export function McpFaq() {
  return (
    <section
      aria-labelledby='mcp-faq-title'
      className='grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]'
    >
      <SectionHeading
        id='mcp-faq-title'
        eyebrow='Questions'
        title='Before you connect it'
        description='What people ask about the server, answered short.'
      />
      <Accordion>
        {QUESTIONS.map((item) => (
          <AccordionItem key={item.id} value={item.id}>
            <AccordionTrigger className='text-sm'>
              {item.question}
            </AccordionTrigger>
            <AccordionContent className='text-muted-foreground text-sm leading-relaxed'>
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
