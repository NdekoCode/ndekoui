import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/registry/ndeko/ui/accordion';

import { SectionHeading } from './section-heading';

type Question = {
  id: string;
  question: string;
  answer: string;
};

type QuestionGroup = {
  name: string;
  questions: Question[];
};

const GROUPS: QuestionGroup[] = [
  {
    name: 'General',
    questions: [
      {
        id: 'free',
        question: 'Is Ndeko UI free?',
        answer:
          'Yes. Every primitive, component, block and template is MIT licensed, for personal and commercial projects.',
      },
      {
        id: 'origin',
        question: 'Where do the components come from?',
        answer:
          'They are built here, on our own primitives, data and design language. Open-source libraries such as Motion Primitives, Origin UI, prompt-kit and UI Layouts gave some of the starting ideas, and they are credited in the repository.',
      },
    ],
  },
  {
    name: 'Using it',
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

export function HomeFaq() {
  return (
    <section
      aria-labelledby='faq-title'
      className='grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]'
    >
      <SectionHeading
        id='faq-title'
        eyebrow='Questions'
        title='Everything people ask first'
        description='The short answers. The repository has the long ones.'
      />
      <div className='flex flex-col gap-8'>
        {GROUPS.map((group) => (
          <div key={group.name} className='flex flex-col gap-1'>
            <p className='text-muted-foreground text-xs font-medium'>
              {group.name}
            </p>
            <Accordion>
              {group.questions.map((item) => (
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
          </div>
        ))}
      </div>
    </section>
  );
}
