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

export default function Accordion03() {
  return (
    <Accordion defaultValue={['export']}>
      {QUESTIONS.map((question) => (
        <AccordionItem key={question.value} value={question.value}>
          <AccordionTrigger className='justify-start gap-3 [&>svg]:-order-1'>
            {question.title}
          </AccordionTrigger>
          <AccordionContent className='ps-7'>
            {question.content}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
