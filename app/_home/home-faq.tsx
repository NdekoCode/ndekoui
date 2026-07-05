import { Accordion } from '@base-ui/react/accordion';
import type { ComponentType } from 'react';

import {
  CodeIcon,
  GitPullRequestIcon,
  InfoIcon,
  MessageCircleIcon,
} from '@/registry/ndeko/lib/icons';

import { Reveal } from './reveal';
import { SectionHeading, STAGGER_MS } from './section-heading';

type Question = {
  id: string;
  question: string;
  answer: string;
};

type QuestionGroup = {
  name: string;
  icon: ComponentType<{ className?: string }>;
  questions: Question[];
};

const GROUPS: QuestionGroup[] = [
  {
    name: 'General',
    icon: InfoIcon,
    questions: [
      {
        id: 'free',
        question: 'Is ndekoui free?',
        answer:
          'Yes. Every primitive, component, block and template is MIT licensed, for personal and commercial projects.',
      },
      {
        id: 'origin',
        question: 'Where do the components come from?',
        answer:
          'They are built here, on our own primitives, data and design language. Some pieces started from open-source code such as Motion Primitives and prompt-kit, whose licences are kept in the repository.',
      },
    ],
  },
  {
    name: 'Using it',
    icon: CodeIcon,
    questions: [
      {
        id: 'install',
        question: 'How do I install a component?',
        answer:
          'Set up shadcn in your project, then run the command shown in the code panel of the component. The theme and the pieces it uses come with it.',
      },
      {
        id: 'stack',
        question: 'Which libraries does it build on?',
        answer:
          'Base UI for behaviour and accessibility, motion for animation, Tailwind CSS 4 for styling and Hugeicons for icons.',
      },
      {
        id: 'colours',
        question: 'Can I change the colours?',
        answer:
          'Yes. Every colour is a token of the theme. Change the primary colour and its ink pair, and the whole library follows in light and dark.',
      },
      {
        id: 'motion',
        question: 'What happens when someone turns motion off?',
        answer:
          'The theme keeps fades and colour changes and drops movement when the system asks for reduced motion. Components driven by JavaScript fall back to a fade or an instant change.',
      },
    ],
  },
  {
    name: 'Contributing',
    icon: GitPullRequestIcon,
    questions: [
      {
        id: 'contribute',
        question: 'How do I suggest or contribute a component?',
        answer:
          'Open an issue or a pull request on GitHub. The contributing guide lists the rules every component follows.',
      },
    ],
  },
];

function PlusMinus() {
  return (
    <span
      aria-hidden='true'
      className='bg-foreground/[0.05] group-data-[panel-open]:bg-primary group-data-[panel-open]:text-primary-foreground relative flex size-6 shrink-0 items-center justify-center rounded-md transition-colors duration-200'
    >
      <span className='absolute h-px w-2.5 bg-current' />
      <span className='absolute h-2.5 w-px bg-current transition-transform duration-200 ease-out group-data-[panel-open]:scale-y-0' />
    </span>
  );
}

function QuestionCard({ item }: { item: Question }) {
  return (
    <Accordion.Item
      value={item.id}
      className='bg-card hairline-ring ring-border rounded-2xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <Accordion.Header>
        <Accordion.Trigger className='group focus-visible:ring-ring/25 data-[panel-open]:text-primary-ink flex w-full items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left text-base font-medium outline-none focus-visible:ring-[3px]'>
          {item.question}
          <PlusMinus />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Panel className='h-[var(--accordion-panel-height)] overflow-hidden transition-[height] duration-200 ease-out data-[ending-style]:h-0 data-[starting-style]:h-0 motion-reduce:transition-none'>
        <p className='text-muted-foreground px-5 pb-5 text-sm leading-relaxed text-pretty'>
          {item.answer}
        </p>
      </Accordion.Panel>
    </Accordion.Item>
  );
}

/** The questions as plain text, for the structured data of the page. */
export const FAQ_QUESTIONS = GROUPS.flatMap((group) => group.questions);

export function HomeFaq() {
  return (
    <section
      aria-labelledby='faq-title'
      className='flex flex-col gap-10 lg:gap-12'
    >
      <SectionHeading
        id='faq-title'
        icon={MessageCircleIcon}
        eyebrow='Questions'
        lead='Everything'
        title='people ask first'
        description='The short answers. The repository has the long ones.'
        align='center'
      />
      <div className='mx-auto flex w-full max-w-3xl flex-col gap-8'>
        {GROUPS.map((group, index) => (
          <Reveal
            key={group.name}
            delay={index * STAGGER_MS}
            className='flex flex-col gap-3'
          >
            <p className='text-muted-foreground flex items-center gap-2 text-sm font-medium'>
              <group.icon className='size-4' />
              {group.name}
            </p>
            <Accordion.Root className='flex flex-col gap-3'>
              {group.questions.map((item) => (
                <QuestionCard key={item.id} item={item} />
              ))}
            </Accordion.Root>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
