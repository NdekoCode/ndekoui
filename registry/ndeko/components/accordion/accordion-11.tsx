import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/registry/ndeko/ui/accordion';

const QUESTIONS = [
  {
    value: 'free-plan',
    title: 'What is included in the free plan?',
    content:
      'Three projects, unlimited tasks and 30 days of activity history. Invite as many teammates as you need; billing starts only when you create a fourth project.',
  },
  {
    value: 'change-plan',
    title: 'Can I change my plan later?',
    content:
      'Yes. An upgrade applies right away and the difference is prorated on the next invoice. A downgrade takes effect at the end of the current billing period.',
  },
  {
    value: 'export',
    title: 'How do I export my data?',
    content:
      'Open Settings, then Export. You receive a ZIP archive with every project as a CSV file and every attachment in its original format, usually within a few minutes.',
  },
  {
    value: 'access',
    title: 'Who can see my projects?',
    content:
      'Only the members you invite. Each project keeps its own access list, and a guest sees only the projects they were added to.',
  },
];

const CARD_ITEM = [
  'rounded-xl border-b-0 bg-card px-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] hairline-ring ring-border outline-none',
  'has-focus-visible:ring-[3px] has-focus-visible:ring-ring/25',
].join(' ');

export default function Accordion11() {
  return (
    <Accordion defaultValue={['export']} className='gap-2'>
      {QUESTIONS.map((question) => (
        <AccordionItem
          key={question.value}
          value={question.value}
          className={CARD_ITEM}
        >
          <AccordionTrigger className='focus-visible:ring-0'>
            {question.title}
          </AccordionTrigger>
          <AccordionContent>{question.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
