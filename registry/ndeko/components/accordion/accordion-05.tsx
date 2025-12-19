import {
  CreditCardIcon,
  DownloadIcon,
  EyeIcon,
  BoxIcon,
} from '@/registry/ndeko/lib/icons';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/registry/ndeko/ui/accordion';

const QUESTIONS = [
  {
    value: 'free-plan',
    icon: BoxIcon,
    title: 'What is included in the free plan?',
    content:
      'Three projects, unlimited tasks and 30 days of activity history. Invite as many teammates as you need; billing starts only when you create a fourth project.',
  },
  {
    value: 'change-plan',
    icon: CreditCardIcon,
    title: 'Can I change my plan later?',
    content:
      'Yes. An upgrade applies right away and the difference is prorated on the next invoice. A downgrade takes effect at the end of the current billing period.',
  },
  {
    value: 'export',
    icon: DownloadIcon,
    title: 'How do I export my data?',
    content:
      'Open Settings, then Export. You receive a ZIP archive with every project as a CSV file and every attachment in its original format, usually within a few minutes.',
  },
  {
    value: 'access',
    icon: EyeIcon,
    title: 'Who can see my projects?',
    content:
      'Only the members you invite. Each project keeps its own access list, and a guest sees only the projects they were added to.',
  },
];

export default function Accordion05() {
  return (
    <Accordion defaultValue={['export']}>
      {QUESTIONS.map((question) => (
        <AccordionItem key={question.value} value={question.value}>
          <AccordionTrigger>
            <span className='flex items-center gap-3'>
              <question.icon className='text-muted-foreground size-4 shrink-0' />
              {question.title}
            </span>
          </AccordionTrigger>
          <AccordionContent className='ps-7'>
            {question.content}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
