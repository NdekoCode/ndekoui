import {
  CalendarIcon,
  ChevronDownIcon,
  ClockIcon,
  CreditCardIcon,
  DownloadIcon,
  EyeIcon,
  FileSpreadsheetIcon,
  FolderPlusIcon,
  type Icon,
  LockIcon,
  RefreshCwIcon,
  BoxIcon,
  UserRoundPlusIcon,
  UsersIcon,
} from '@/registry/ndeko/lib/icons';
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
  icon: Icon;
  isOpenByDefault?: boolean;
};

type Question = {
  value: string;
  title: string;
  icon: Icon;
  answers: Answer[];
};

const QUESTIONS: Question[] = [
  {
    value: 'free-plan',
    title: 'What is included in the free plan?',
    icon: BoxIcon,
    answers: [
      {
        title: 'Is there a limit on teammates?',
        content:
          'No. Every plan lets you invite as many teammates as you need.',
        icon: UsersIcon,
      },
      {
        title: 'What happens at the fourth project?',
        content:
          'You are asked to upgrade before creating it. Existing projects stay as they are.',
        icon: FolderPlusIcon,
      },
    ],
  },
  {
    value: 'change-plan',
    title: 'Can I change my plan later?',
    icon: CreditCardIcon,
    answers: [
      {
        title: 'Are upgrades prorated?',
        content:
          'Yes. You pay only for the days left in the current billing period.',
        icon: CalendarIcon,
      },
      {
        title: 'Can I switch to yearly billing?',
        content:
          'Yes, at any time from the Billing page. The switch applies at the next renewal.',
        icon: RefreshCwIcon,
      },
    ],
  },
  {
    value: 'export',
    title: 'How do I export my data?',
    icon: DownloadIcon,
    answers: [
      {
        title: 'Which formats are available?',
        content:
          'CSV for projects and tasks, and the original files for attachments.',
        icon: FileSpreadsheetIcon,
        isOpenByDefault: true,
      },
      {
        title: 'Can exports run on a schedule?',
        content:
          'Yes. A weekly or monthly export can be sent to the workspace owner by email.',
        icon: ClockIcon,
      },
    ],
  },
  {
    value: 'access',
    title: 'Who can see my projects?',
    icon: EyeIcon,
    answers: [
      {
        title: 'Can I share a project with a guest?',
        content: 'Yes. A guest sees only the projects they are invited to.',
        icon: UserRoundPlusIcon,
      },
      {
        title: 'Can I make a project private?',
        content:
          'Yes. A private project is hidden from everyone who is not a member.',
        icon: LockIcon,
      },
    ],
  },
];

const ANSWER_TRIGGER = [
  'group/answer flex w-full cursor-pointer gap-2 rounded-md text-left text-[13px] font-medium text-foreground',
  FOCUS_RING,
].join(' ');

function AnswerRow({ answer }: { answer: Answer }) {
  return (
    <Collapsible
      defaultOpen={answer.isOpenByDefault}
      className='hairline-t border-border py-3 ps-6 pe-4'
    >
      <CollapsibleTrigger className={ANSWER_TRIGGER}>
        <ChevronDownIcon className='text-muted-foreground mt-0.5 size-4 shrink-0 transition-[rotate] duration-200 ease-(--ease-out-strong) group-data-panel-open/answer:rotate-180' />
        <span className='flex items-center gap-3'>
          <answer.icon className='text-muted-foreground size-4 shrink-0' />
          {answer.title}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <p className='ps-6 pt-1'>{answer.content}</p>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function Accordion20() {
  return (
    <Accordion defaultValue={['export']}>
      {QUESTIONS.map((question) => (
        <AccordionItem key={question.value} value={question.value}>
          <AccordionTrigger className='justify-start gap-3 [&>svg]:-order-1'>
            <span className='flex items-center gap-3'>
              <question.icon className='text-muted-foreground size-4 shrink-0' />
              {question.title}
            </span>
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
