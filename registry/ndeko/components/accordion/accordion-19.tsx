import { ChevronDownIcon } from '@/registry/ndeko/lib/icons';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/registry/ndeko/ui/accordion';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/registry/ndeko/ui/collapsible';

type Answer = {
  title: string;
  content: string;
  isOpenByDefault?: boolean;
};

type Question = {
  value: string;
  title: string;
  answers: Answer[];
};

const QUESTIONS: Question[] = [
  {
    value: 'free-plan',
    title: 'What is included in the free plan?',
    answers: [
      {
        title: 'Is there a limit on teammates?',
        content:
          'No. Every plan lets you invite as many teammates as you need.',
      },
      {
        title: 'What happens at the fourth project?',
        content:
          'You are asked to upgrade before creating it. Existing projects stay as they are.',
      },
    ],
  },
  {
    value: 'change-plan',
    title: 'Can I change my plan later?',
    answers: [
      {
        title: 'Are upgrades prorated?',
        content:
          'Yes. You pay only for the days left in the current billing period.',
      },
      {
        title: 'Can I switch to yearly billing?',
        content:
          'Yes, at any time from the Billing page. The switch applies at the next renewal.',
      },
    ],
  },
  {
    value: 'export',
    title: 'How do I export my data?',
    answers: [
      {
        title: 'Which formats are available?',
        content:
          'CSV for projects and tasks, and the original files for attachments.',
        isOpenByDefault: true,
      },
      {
        title: 'Can exports run on a schedule?',
        content:
          'Yes. A weekly or monthly export can be sent to the workspace owner by email.',
      },
    ],
  },
  {
    value: 'access',
    title: 'Who can see my projects?',
    answers: [
      {
        title: 'Can I share a project with a guest?',
        content: 'Yes. A guest sees only the projects they are invited to.',
      },
      {
        title: 'Can I make a project private?',
        content:
          'Yes. A private project is hidden from everyone who is not a member.',
      },
    ],
  },
];

const ROWS =
  'rounded-xl bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)] hairline-ring ring-border';

const ROW_ITEM = [
  'relative overflow-hidden outline-none first:rounded-t-xl last:rounded-b-xl',
  'has-[[data-slot=accordion-trigger]:focus-visible]:z-10',
  'has-[[data-slot=accordion-trigger]:focus-visible]:ring-[3px]',
  'has-[[data-slot=accordion-trigger]:focus-visible]:ring-ring/25',
].join(' ');

const ANSWER_TRIGGER = [
  'group/answer flex w-full cursor-pointer gap-2 rounded-md text-left text-[13px] font-medium text-foreground',
  FOCUS_RING,
].join(' ');

function AnswerRow({ answer }: { answer: Answer }) {
  return (
    <Collapsible
      defaultOpen={answer.isOpenByDefault}
      className='hairline-t border-border bg-foreground/[0.025] px-4 py-3'
    >
      <CollapsibleTrigger className={ANSWER_TRIGGER}>
        <ChevronDownIcon className='text-muted-foreground mt-0.5 size-4 shrink-0 transition-[rotate] duration-200 ease-(--ease-out-strong) group-data-panel-open/answer:rotate-180' />
        {answer.title}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <p className='ps-6 pt-1'>{answer.content}</p>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function Accordion19() {
  return (
    <Accordion defaultValue={['export']} className={ROWS}>
      {QUESTIONS.map((question) => (
        <AccordionItem
          key={question.value}
          value={question.value}
          className={ROW_ITEM}
        >
          <AccordionTrigger className='px-4 focus-visible:ring-0'>
            {question.title}
          </AccordionTrigger>
          <AccordionContent className='pb-0'>
            {question.answers.map((answer) => (
              <AnswerRow key={answer.title} answer={answer} />
            ))}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
